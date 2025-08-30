import os
import json
from datetime import datetime, date, time, timedelta
from app.models import Booking
from app.extensions import db
# from app.services.whatsapp_notification import send_booking_confirmation

def load_booked_slots(assistant_id: int, date: datetime.date):
    """Return a dict of slot-strings → Booking rows for that assistant & date."""
    rows = Booking.query.filter_by(assistant_id=assistant_id, date=date).all()
    return {row.time.strftime("%I:%M %p").lstrip("0"): row for row in rows}

def handle_booking(assistant_id: int, date: datetime.date, time: datetime.time,
                  customer_name: str, details: str,  conversation_id: int = None):
    """Persist a new booking to the database."""
    booking = Booking(
        assistant_id=assistant_id, 
        conversation_id=conversation_id,
        date=date, 
        time=time,
        customer_name=customer_name, 
        details=details
    )
    # print(f"Booking: {booking}")
    db.session.add(booking)
    db.session.commit()
    # print(f"Booking saved: {customer_name} on {date} at {time}")
    # try:
    #     send_booking_confirmation(booking.id, conversation_id)
    # except Exception as e:
    #     print(f"Error sending booking notifications: {e}")
    return booking

def cancel_booking(assistant_id: int, date: date, time: time) -> Booking | None:
    """Delete an existing booking for the given slot."""
    booking = Booking.query.filter_by(assistant_id=assistant_id, date=date, time=time).first()
    if not booking:
        return None
    db.session.delete(booking)
    db.session.commit()
    return booking


def reschedule_booking(
    assistant_id: int,
    old_date: date,
    old_time: time,
    new_date: date,
    new_time: time
) -> Booking | None:
    """Update an existing booking to a new date/time."""
    booking = Booking.query.filter_by(
        assistant_id=assistant_id,
        date=old_date,
        time=old_time
    ).first()
    if not booking:
        return None
    booking.date = new_date
    booking.time = new_time
    db.session.commit()
    return booking

def load_user_bookings(assistant_id: int, conversation_id: int) -> list[dict]:
    """
    Return all future bookings for this assistant and conversation (caller).
    """
    rows = Booking.query.\
        filter_by(assistant_id=assistant_id, conversation_id=conversation_id).\
        filter(Booking.date >= date.today()).\
        all()

    return [
      {
        "date": row.date.strftime("%Y-%m-%d"),
        "time": row.time.strftime("%I:%M %p").lstrip("0"),
        "name": row.customer_name,
        "details": row.details or "",
      }
      for row in rows
    ]

def generate_time_slots(
    start_time_24: str,
    end_time_24: str,
    duration_minutes: int,
    available_days: dict[str, bool] | None = None,
    for_date: date | None = None
) -> list[str]:
    """
    Returns a list of pretty-printed slots (e.g. "9:00 AM") between start_time and end_time
    on the given for_date, respecting the available_days map.
    - start_time_24 / end_time_24: "HH:MM" strings in 24h.
    - duration_minutes: length of each slot.
    - available_days: {"monday": True, ..., "sunday": False}. If None, defaults to Mon–Fri.
    - for_date: which calendar date to generate for; defaults to today.
    """
    # 1) Determine target_date
    target_date = for_date or datetime.now().date()
    
    # 2) Default available_days to Mon–Fri if not provided
    if available_days is None:
        available_days = {
            "monday":   True,
            "tuesday":  True,
            "wednesday":True,
            "thursday": True,
            "friday":   True,
            "saturday": False,
            "sunday":   False
        }
    
    # 3) If business is closed that weekday, return no slots
    weekday = target_date.strftime("%A").lower()
    if not available_days.get(weekday, False):
        return []
    
    # 4) Parse the start/end times into datetime objects on target_date
    sh, sm = map(int, start_time_24.split(":"))
    eh, em = map(int, end_time_24.split(":"))
    current = datetime.combine(target_date, time(sh, sm))
    cutoff  = datetime.combine(target_date, time(eh, em))
    
    # 5) Build the list of slots
    slots: list[str] = []
    while current < cutoff:
        pretty = current.strftime("%I:%M %p").lstrip("0")
        slots.append(pretty)
        current += timedelta(minutes=duration_minutes)
    
    return slots