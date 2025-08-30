# app/routes/assistant_routes.py

from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import json
from datetime import datetime, timedelta

from app.models import db, User, Assistant, Booking, AssistantAnalytics
from app.services.twillio_helper import buy_twilio_number
from app.services.rag import extract_and_index
from app.services.booking import generate_time_slots, load_booked_slots
from flask import session

assistant_bp = Blueprint("assistant", __name__)

@assistant_bp.route("/register", methods=["POST"])
def register_business():
    """
    Accepts multipart/form-data with form fields:
      - user_id (int)
      - business_name
      - receptionist_name
      - start_time (HH:MM)
      - end_time   (HH:MM)
      - booking_duration_minutes (int)
      - phone_number
      - available_days (JSON object)
      - voice_type ("male"|"female")
    Optionally:
      - files (one or more PDFs or text files) to index into RAG immediately.
    """
    # 1) Parse and validate core form fields
    form = request.form
    try:
        user_id = int(form["user_id"])
    except (KeyError, ValueError):
        return jsonify(error="Must include a valid user_id"), 400

    required = [
        "business_name",
        "receptionist_name",
        "start_time",
        "end_time",
        "booking_duration_minutes",
        "phone_number",
        "available_days",
        "voice_type"
    ]
    if not all(field in form for field in required):
        return jsonify(error="Missing one or more required fields"), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify(error="No such user"), 404
    
    # Check subscription status and limits
    if not user.can_create_agent():
        if user.subscription_status != "active":
            return jsonify(error="Active subscription required to create agents"), 403
        else:
            return jsonify(error=f"Agent limit reached. Your {user.plan} plan allows {user.max_agents} agent(s)"), 403
    
    # 2) Acquire or purchase Twilio number
    twilio_number = form.get("twilio_number")
    if not twilio_number:
        try:
            twilio_number = buy_twilio_number(country="US")
        except Exception as e:
            return jsonify(error="Twilio error", details=str(e)), 500

    # 3) Create the Assistant record
    assistant = Assistant(
        name=form["receptionist_name"],
        business_name=form["business_name"],
        description=form.get("business_description", ""),
        start_time=form["start_time"],
        end_time=form["end_time"],
        booking_duration_minutes=int(form["booking_duration_minutes"]),
        available_days=json.dumps(json.loads(form["available_days"])),
        twilio_number=twilio_number,
        voice_type=form["voice_type"],
        user_id=user.id
    )
    db.session.add(assistant)
    db.session.commit()

    indexed = 0
    if "files" in request.files:
        docs = []
        for f in request.files.getlist("files"):
            filename = secure_filename(f.filename or "")
            ext = filename.rsplit(".", 1)[-1].lower()
            data = f.read()
            if ext == "pdf":
                docs.append(data)
            elif ext in ("txt", "md", "text"):
                docs.append(data.decode("utf-8", errors="ignore"))
        if docs:
            result = extract_and_index(assistant.id, user.id, docs)
            indexed = result.get("indexed", 0)

    # 5) Return response
    resp = {
        "message":       f"Assistant created. Forward calls to {twilio_number}.",
        "assistant_id":  assistant.id,
        "twilio_number": twilio_number,
        "indexed_chunks": indexed
    }
    return jsonify(resp), 201


@assistant_bp.route("/slots/<int:assistant_id>", methods=["GET"])
def get_available_slots(assistant_id):
    """
    Query params:
      - date (YYYY-MM-DD) optional, defaults to today
    """
    assistant = Assistant.query.get_or_404(assistant_id)
    date_str = request.args.get("date") or datetime.now().strftime("%Y-%m-%d")
    try:
        date = datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        return jsonify(error="Invalid date format, use YYYY-MM-DD"), 400

    day = date.strftime("%A").lower()
    try:
        available_days = json.loads(assistant.available_days)
    except:
        available_days = {
            "monday": True, "tuesday": True, "wednesday": True,
            "thursday": True, "friday": True,
            "saturday": False, "sunday": False
        }

    if not available_days.get(day, False):
        return jsonify(date=date_str, day=day, slots=[], message=f"No slots on {day.capitalize()}"), 200

    slots = generate_time_slots(
        assistant.start_time,
        assistant.end_time,
        assistant.booking_duration_minutes,
        available_days,
        for_date=date.date()
    )
    booked = load_booked_slots(assistant.id, date.date())

    free = [s for s in slots if f"{date_str}_{s}" not in booked or booked[f"{date_str}_{s}"] is None]
    return jsonify(
        date=date_str,
        day=day,
        slots=free,
        business_hours=f"{assistant.start_time} - {assistant.end_time}",
        slot_duration=assistant.booking_duration_minutes
    ), 200


@assistant_bp.route("/bookings/<int:assistant_id>", methods=["GET"])
def get_assistant_bookings(assistant_id):
    """
    Query params:
      - start_date (YYYY-MM-DD), default=today
      - end_date   (YYYY-MM-DD), default=start+7d
    """
    assistant = Assistant.query.get_or_404(assistant_id)

    # parse date range
    sd = request.args.get("start_date")
    ed = request.args.get("end_date")
    try:
        start = datetime.strptime(sd, "%Y-%m-%d").date() if sd else datetime.now().date()
        end   = datetime.strptime(ed, "%Y-%m-%d").date() if ed else start + timedelta(days=7)
    except ValueError:
        return jsonify(error="Invalid date format, use YYYY-MM-DD"), 400

    # fetch bookings
    rows = Booking.query.filter_by(assistant_id=assistant_id) \
        .filter(Booking.date >= start, Booking.date <= end) \
        .order_by(Booking.date, Booking.time) \
        .all()

    bookings = [{
        "id":            b.id,
        "date":          b.date.strftime("%Y-%m-%d"),
        "time":          b.time.strftime("%H:%M"),
        "customer_name": b.customer_name,
        "details":       b.details,
        "created_at":    b.created_at.strftime("%Y-%m-%d %H:%M:%S")
    } for b in rows]

    # build slots per day
    all_slots = {}
    current = start
    try:
        available_days = json.loads(assistant.available_days)
    except:
        available_days = {}
    while current <= end:
        day = current.strftime("%A").lower()
        if available_days.get(day, False):
            day_slots = generate_time_slots(
                assistant.start_time,
                assistant.end_time,
                assistant.booking_duration_minutes,
                available_days,
                for_date=current
            )
            booked_map = load_booked_slots(assistant.id, current)
            formatted = []
            for slot in day_slots:
                t24 = datetime.strptime(slot, "%I:%M %p").strftime("%H:%M")
                is_booked = f"{current.strftime('%Y-%m-%d')}_{slot}" in booked_map
                formatted.append({"time": t24, "is_booked": is_booked})
            all_slots[current.strftime("%Y-%m-%d")] = formatted
        current += timedelta(days=1)

    return jsonify(
        bookings=bookings,
        slots=all_slots,
        business_hours=f"{assistant.start_time} - {assistant.end_time}",
        slot_duration=assistant.booking_duration_minutes
    ), 200


@assistant_bp.route("/assistants", methods=["GET"])
def list_assistants():
    """
    GET /api/assistants?user_id=123
    or if you have session-based auth, omit the query-param and rely on session["user_id"].
    """
    # Try session first (if you have a login flow), otherwise fall back to ?user_id=
    user_id = session.get("user_id") or request.args.get("user_id", type=int)
    if not user_id:
        return jsonify(error="Missing user_id"), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify(error="No such user"), 404

    assistants = Assistant.query.filter_by(user_id=user_id).all()

    payload = []
    for a in assistants:
        payload.append({
            "id": a.id,
            "name": a.name,
            "business_name": a.business_name,
            "description": a.description,
            "start_time": a.start_time,
            "end_time": a.end_time,
            "booking_duration_minutes": a.booking_duration_minutes,
            "available_days": json.loads(a.available_days) if a.available_days else None,
            "twilio_number": a.twilio_number,
            "voice_type": a.voice_type
        })

    return jsonify(assistants=payload), 200

@assistant_bp.route("/assistant/<int:assistant_id>", methods=["PATCH"])
def update_assistant(assistant_id):
    """
    Update fields on an existing Assistant.
    Accepts JSON body with any of:
      - business_name (str)
      - receptionist_name (str)      → maps to Assistant.name
      - description (str)
      - start_time (HH:MM)
      - end_time   (HH:MM)
      - booking_duration_minutes (int)
      - available_days (JSON object of day→bool)
      - voice_type ("male" or "female")
    (Note: twilio_number and user's phone_number cannot be changed here.)
    """
    data = request.get_json(force=True, silent=True) or {}
    assistant = Assistant.query.get_or_404(assistant_id)
    
    # Only allow these fields to be updated
    updatable = {
        "business_name":           lambda v: setattr(assistant, "business_name", v),
        "receptionist_name":       lambda v: setattr(assistant, "name", v),
        "description":             lambda v: setattr(assistant, "description", v),
        "start_time":              lambda v: setattr(assistant, "start_time", v),
        "end_time":                lambda v: setattr(assistant, "end_time", v),
        "booking_duration_minutes":lambda v: setattr(assistant, "booking_duration_minutes", int(v)),
        "voice_type":              lambda v: setattr(assistant, "voice_type", v),
        "available_days":          lambda v: setattr(assistant, "available_days", json.dumps(v)),
    }

    changed = []
    for field, setter in updatable.items():
        if field in data:
            try:
                setter(data[field])
                changed.append(field)
            except (ValueError, TypeError):
                return jsonify(error=f"Invalid value for `{field}`"), 400

    if not changed:
        return jsonify(message="No updatable fields provided"), 400

    db.session.commit()

    # Return the updated assistant record
    assistant_data = {
        "id":                         assistant.id,
        "name":                       assistant.name,
        "business_name":              assistant.business_name,
        "description":                assistant.description,
        "start_time":                 assistant.start_time,
        "end_time":                   assistant.end_time,
        "booking_duration_minutes":   assistant.booking_duration_minutes,
        "voice_type":                 assistant.voice_type,
        "available_days":             json.loads(assistant.available_days),
    }

    return jsonify(
        message="Assistant updated successfully",
        updated_fields=changed,
        assistant=assistant_data
    ), 200

@assistant_bp.route("/register/assistant", methods=["POST"])
def register_assistant():
    """
    Register an AI assistant (simpler than receptionist).
    Accepts multipart/form-data with form fields:
      - user_id (int)
      - assistant_name
      - business_name
      - business_description
    Optionally:
      - files (one or more PDFs or text files) to index into RAG immediately.
    """
    # 1) Parse and validate core form fields
    form = request.form
    try:
        user_id = int(form["user_id"])
    except (KeyError, ValueError):
        return jsonify(error="Must include a valid user_id"), 400

    required = [
        "assistant_name",
        "business_name",
        "business_description"
    ]
    if not all(field in form for field in required):
        return jsonify(error="Missing one or more required fields"), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify(error="No such user"), 404
    
    # Check subscription status and limits
    if not user.can_create_agent():
        if user.subscription_status != "active":
            return jsonify(error="Active subscription required to create agents"), 403
        else:
            return jsonify(error=f"Agent limit reached. Your {user.plan} plan allows {user.max_agents} agent(s)"), 403
    
    # 2) Create the Assistant record
    # Get enabled features from form, default to voice and booking
    enabled_features = form.get("enabled_features", '["voice", "booking"]')
    if isinstance(enabled_features, str):
        try:
            enabled_features = json.loads(enabled_features)
        except:
            enabled_features = ["voice", "booking"]
    
    assistant = Assistant(
        name=form["assistant_name"],
        business_name=form["business_name"],
        description=form["business_description"],
        # Set default values for required fields
        start_time="09:00",
        end_time="17:00",
        booking_duration_minutes=30,
        available_days=json.dumps({
            "monday": True, "tuesday": True, "wednesday": True,
            "thursday": True, "friday": True,
            "saturday": False, "sunday": False
        }),
        twilio_number=None,  # No phone number for AI assistant
        voice_type=form.get("voice_type", "female"),  # Use form voice type
        user_id=user.id,
        enabled_features=json.dumps(enabled_features)
    )
    db.session.add(assistant)
    db.session.commit()

    # 3) Optional: immediately index any uploaded files via RAG
    indexed = 0
    if "files" in request.files:
        docs = []
        for f in request.files.getlist("files"):
            filename = secure_filename(f.filename or "")
            ext = filename.rsplit(".", 1)[-1].lower()
            data = f.read()
            if ext == "pdf":
                docs.append(data)
            elif ext in ("txt", "md", "text"):
                docs.append(data.decode("utf-8", errors="ignore"))
        if docs:
            result = extract_and_index(assistant.id, user.id, docs)
            indexed = result.get("indexed", 0)

    # 4) Return response
    resp = {
        "message": "AI Assistant created successfully.",
        "assistant_id": assistant.id,
        "indexed_chunks": indexed
    }
    return jsonify(resp), 201


@assistant_bp.route("/my-agents", methods=["GET"])
def get_my_agents():
    """
    Get all agents owned by the current user with plan-based limits and analytics.
    Requires active session authentication.
    """
    # Check authentication
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Get user's subscription info
    user_info = {
        "plan": user.plan,
        "subscription_status": user.subscription_status,
        "max_agents": user.max_agents,
        "allowed_addons": user.get_allowed_addons(),
        "can_create_agent": user.can_create_agent()
    }

    # Get all user's assistants
    assistants = Assistant.query.filter_by(user_id=user_id).order_by(Assistant.created_at.desc()).all()
    
    agents_data = []
    for assistant in assistants:
        agent_data = {
            "id": assistant.id,
            "agent_name": assistant.name,
            "business_name": assistant.business_name,
            "description": assistant.description,
            "twilio_number": assistant.twilio_number,
            "voice_type": assistant.voice_type,
            "status": assistant.status,
            "features": assistant.get_enabled_features(),
            "start_time": assistant.start_time,
            "end_time": assistant.end_time,
            "booking_duration_minutes": assistant.booking_duration_minutes,
            "available_days": json.loads(assistant.available_days) if assistant.available_days else None,
            "created_at": assistant.created_at.isoformat() if assistant.created_at else None,
            "is_accessible": assistant.is_accessible()
        }

        # Add analytics for Pro users
        if user.can_use_addon("analytics"):
            # Get last 30 days of analytics
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=30)
            
            analytics = AssistantAnalytics.query.filter(
                AssistantAnalytics.assistant_id == assistant.id,
                AssistantAnalytics.date >= start_date,
                AssistantAnalytics.date <= end_date
            ).all()
            
            # Calculate totals
            total_calls = sum(a.total_calls or 0 for a in analytics)
            total_messages = sum(a.total_messages or 0 for a in analytics)
            total_bookings = sum(a.total_bookings or 0 for a in analytics)
            successful_bookings = sum(a.successful_bookings or 0 for a in analytics)
            
            # Calculate average call duration
            call_durations = [a.avg_call_duration or 0 for a in analytics if a.total_calls and a.total_calls > 0]
            avg_call_duration = sum(call_durations) / len(call_durations) if call_durations else 0
            
            agent_data["analytics"] = {
                "period": "last_30_days",
                "total_calls": total_calls,
                "total_messages": total_messages,
                "total_bookings": total_bookings,
                "successful_bookings": successful_bookings,
                "avg_call_duration": round(avg_call_duration, 2),
                "conversion_rate": round((successful_bookings / total_calls * 100) if total_calls > 0 else 0, 2)
            }
        elif user.plan == "basic":
            # Basic users get limited analytics
            # Get just today's data
            today = datetime.now().date()
            today_analytics = AssistantAnalytics.query.filter(
                AssistantAnalytics.assistant_id == assistant.id,
                AssistantAnalytics.date == today
            ).first()
            
            if today_analytics:
                agent_data["analytics"] = {
                    "period": "today",
                    "total_calls": today_analytics.total_calls or 0,
                    "total_bookings": today_analytics.total_bookings or 0
                }
            else:
                agent_data["analytics"] = {
                    "period": "today",
                    "total_calls": 0,
                    "total_bookings": 0
                }

        agents_data.append(agent_data)

    return jsonify({
        "user": user_info,
        "agents": agents_data,
        "total_agents": len(agents_data)
    }), 200
