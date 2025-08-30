# app/routes/stripe_routes.py

from flask import Blueprint, request, jsonify, session
import stripe
import os
from datetime import datetime
from app.models import db, User

stripe_bp = Blueprint("stripe", __name__)

# Set Stripe API key
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# Stripe webhook endpoint secret
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

# Price IDs for plans (these should match your Stripe dashboard)
STRIPE_PRICE_IDS = {
    "basic": "price_1S154GJESiymFxt51BZ2djFQ",
    "pro": "price_1S166FJESiymFxt59D8pdMeM"
}

@stripe_bp.route("/create-checkout-session", methods=["POST"])
def create_checkout_session():
    """
    Create a Stripe checkout session for subscription.
    Body: { "plan_id": "basic" | "pro" }
    """
    # Check authentication
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    data = request.get_json() or {}
    plan_id = data.get("plan_id")
    
    if plan_id not in STRIPE_PRICE_IDS:
        return jsonify({"error": "Invalid plan_id. Must be 'basic' or 'pro'"}), 400
    
    try:
        # Create or get Stripe customer
        if not user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.name,
                metadata={"user_id": user.id}
            )
            user.stripe_customer_id = customer.id
            db.session.commit()
        
        # Create checkout session
        checkout_session = stripe.checkout.Session.create(
            customer=user.stripe_customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': STRIPE_PRICE_IDS[plan_id],
                'quantity': 1,
            }],
            mode='subscription',
            success_url=os.getenv('FRONTEND_URL', 'http://localhost:5173') + '/dashboard?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=os.getenv('FRONTEND_URL', 'http://localhost:5173') + '/plans',
            metadata={
                'user_id': user.id,
                'plan_id': plan_id
            }
        )
        
        return jsonify({
            "id": checkout_session.id,
            "url": checkout_session.url,
            "status": checkout_session.status
        })
        
    except stripe.error.StripeError as e:
        return jsonify({"error": "Stripe error", "details": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


@stripe_bp.route("/create-customer-portal-session", methods=["POST"])
def create_customer_portal_session():
    """
    Create a Stripe customer portal session for subscription management.
    Requires authentication via session.
    """
    # Check authentication
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if not user.stripe_customer_id:
        return jsonify({"error": "No Stripe customer found. Please subscribe to a plan first."}), 400
    
    try:
        # Create customer portal session
        portal_session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=request.host_url.rstrip('/') + '/dashboard',
        )
        
        return jsonify({
            "url": portal_session.url
        })
        
    except stripe.error.StripeError as e:
        return jsonify({"error": "Stripe error", "details": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


@stripe_bp.route("/webhook", methods=["POST"])
def stripe_webhook():
    """
    Handle Stripe webhook events.
    This endpoint receives events from Stripe about subscription changes.
    """
    print("👉 Incoming Stripe webhook")
    print(f"📋 Headers: {dict(request.headers)}")
    
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    
    print(f"🔐 Signature header: {sig_header}")
    print(f"📦 Payload size: {len(payload)} bytes")
    
    if not STRIPE_WEBHOOK_SECRET:
        print("❌ STRIPE_WEBHOOK_SECRET not configured!")
        return jsonify({"error": "Webhook secret not configured"}), 500
    else:
        print(f"✅ Webhook secret configured: {STRIPE_WEBHOOK_SECRET[:10]}...")
    
    try:
        print("🔍 Attempting to construct event from webhook...")
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
        print("✅ Event constructed successfully!")
    except ValueError as e:
        print(f"❌ Invalid payload: {e}")
        return jsonify({"error": "Invalid payload"}), 400
    except stripe.error.SignatureVerificationError as e:
        print(f"❌ Invalid signature: {e}")
        return jsonify({"error": "Invalid signature"}), 400
    except Exception as e:
        print(f"❌ Unexpected error constructing event: {e}")
        return jsonify({"error": "Event construction failed"}), 400
    
    # Handle the event
    event_type = event['type']
    event_data = event['data']['object']
    
    print(f"✅ Received event type: {event_type}")
    print(f"📊 Event data keys: {list(event_data.keys())}")
    print(f"🆔 Event ID: {event.get('id', 'N/A')}")
    print(f"⏰ Event created: {datetime.fromtimestamp(event.get('created', 0))}")
    
    try:
        if event_type == 'checkout.session.completed':
            print("💳 Processing checkout.session.completed event")
            
            # Payment succeeded, subscription created
            customer_id = event_data.get('customer')
            subscription_id = event_data.get('subscription')
            metadata = event_data.get('metadata', {})
            user_id = metadata.get('user_id')
            plan_id = metadata.get('plan_id')
            
            print(f"📋 Checkout session data:")
            print(f"   Customer ID: {customer_id}")
            print(f"   Subscription ID: {subscription_id}")
            print(f"   User ID from metadata: {user_id}")
            print(f"   Plan ID from metadata: {plan_id}")
            print(f"   Full metadata: {metadata}")
            
            if user_id:
                print(f"🔍 Looking up user with ID: {user_id}")
                user = User.query.get(int(user_id))
                if user:
                    print(f"✅ Found user: {user.name} ({user.email})")
                    print(f"📊 Current user state:")
                    print(f"   Plan: {user.plan}")
                    print(f"   Status: {user.subscription_status}")
                    print(f"   Max Agents: {user.max_agents}")
                    print(f"   Stripe Customer ID: {user.stripe_customer_id}")
                    
                    if not user.stripe_customer_id:
                        print(f"🔗 Setting Stripe customer ID: {customer_id}")
                        user.stripe_customer_id = customer_id
                    
                    # Set subscription details
                    print(f"📝 Updating subscription details...")
                    user.subscription_id = subscription_id
                    user.subscription_status = "active"
                    user.subscription_updated_at = datetime.utcnow()
                    
                    # Set plan and limits based on plan_id
                    if plan_id in ['basic', 'pro']:
                        print(f"🎯 Setting plan to: {plan_id}")
                        user.plan = plan_id
                        limits = User.get_plan_limits(plan_id)
                        user.max_agents = limits['max_agents']
                        user.set_allowed_addons(limits['allowed_addons'])
                        print(f"📊 New limits: max_agents={limits['max_agents']}, addons={limits['allowed_addons']}")
                    else:
                        print(f"⚠️ Unknown plan_id: {plan_id}")
                    
                    print("💾 Committing changes to database...")
                    db.session.commit()
                    print("✅ Database updated successfully!")
                    
                    print(f"📊 Final user state:")
                    print(f"   Plan: {user.plan}")
                    print(f"   Status: {user.subscription_status}")
                    print(f"   Max Agents: {user.max_agents}")
                    print(f"   Can Create Agent: {user.can_create_agent()}")
                else:
                    print(f"❌ User not found with ID: {user_id}")
            else:
                print("❌ No user_id in metadata")
            
            print(f"🎉 Subscription created for customer {customer_id}, plan: {plan_id}")
            
        elif event_type == 'invoice.payment_failed':
            print("❌ Processing invoice.payment_failed event")
            
            # Payment failed - mark subscription as past_due
            customer_id = event_data.get('customer')
            subscription_id = event_data.get('subscription')
            
            print(f"💳 Payment failed data:")
            print(f"   Customer ID: {customer_id}")
            print(f"   Subscription ID: {subscription_id}")
            
            user = User.query.filter_by(stripe_customer_id=customer_id).first()
            if user:
                print(f"✅ Found user: {user.name} ({user.email})")
                print(f"📝 Marking subscription as past_due...")
                user.subscription_status = "past_due"
                user.subscription_updated_at = datetime.utcnow()
                db.session.commit()
                print("✅ Database updated successfully!")
            else:
                print(f"❌ User not found with customer ID: {customer_id}")
            
            print(f"⚠️ Payment failed for customer {customer_id}")
            
        elif event_type == 'customer.subscription.updated':
            # Subscription updated (plan change, etc.)
            customer_id = event_data.get('customer')
            subscription_id = event_data.get('id')
            status = event_data.get('status')
            
            # Get the price ID to determine the plan
            items = event_data.get('items', {}).get('data', [])
            plan_id = None
            if items:
                price_id = items[0].get('price', {}).get('id')
                # Map price ID to plan
                for plan_name, plan_price_id in STRIPE_PRICE_IDS.items():
                    if price_id == plan_price_id:
                        plan_id = plan_name
                        break
            
            user = User.query.filter_by(stripe_customer_id=customer_id).first()
            if user:
                user.subscription_id = subscription_id
                user.subscription_status = status
                user.subscription_updated_at = datetime.utcnow()
                
                # Update plan and limits if plan changed
                if plan_id and plan_id != user.plan:
                    user.plan = plan_id
                    limits = User.get_plan_limits(plan_id)
                    user.max_agents = limits['max_agents']
                    user.set_allowed_addons(limits['allowed_addons'])
                
                db.session.commit()
            
            print(f"Subscription updated for customer {customer_id}, status: {status}, plan: {plan_id}")
            
        elif event_type == 'customer.subscription.deleted':
            # Subscription cancelled
            customer_id = event_data.get('customer')
            
            user = User.query.filter_by(stripe_customer_id=customer_id).first()
            if user:
                user.subscription_status = "canceled"
                user.subscription_updated_at = datetime.utcnow()
                user.plan = "none"
                user.max_agents = 0
                user.set_allowed_addons([])
                
                # Suspend all user's assistants
                for assistant in user.assistants:
                    assistant.status = "suspended"
                
                db.session.commit()
            
            print(f"Subscription cancelled for customer {customer_id}")
            
        elif event_type == 'invoice.payment_succeeded':
            # Payment succeeded - reactivate if was past_due
            customer_id = event_data.get('customer')
            
            user = User.query.filter_by(stripe_customer_id=customer_id).first()
            if user and user.subscription_status == "past_due":
                user.subscription_status = "active"
                user.subscription_updated_at = datetime.utcnow()
                
                # Reactivate suspended assistants
                for assistant in user.assistants:
                    if assistant.status == "suspended":
                        assistant.status = "active"
                
                db.session.commit()
            
            print(f"Payment succeeded for customer {customer_id}")
            
        else:
            print(f"🤷 Unhandled event type: {event_type}")
            print(f"📋 Available event data: {list(event_data.keys())}")
        
        print("✅ Webhook processing completed successfully")
        return jsonify({"status": "success"})
        
    except Exception as e:
        print(f"💥 ERROR processing webhook: {str(e)}")
        print(f"🔍 Exception type: {type(e).__name__}")
        import traceback
        print(f"📚 Full traceback:")
        traceback.print_exc()
        return jsonify({"error": "Webhook processing failed"}), 500


@stripe_bp.route("/test/login", methods=["POST"])
def test_login():
    """Test endpoint to manually login - DEVELOPMENT ONLY"""
    import os
    if os.getenv('FLASK_ENV') != 'development':
        return jsonify({"error": "Not available in production"}), 403
    
    data = request.get_json() or {}
    user_id = data.get('user_id', 1)  # Default to user ID 1
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Set session
    session["user_id"] = user.id
    
    return jsonify({
        "message": f"Logged in as user {user.id}",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "plan": user.plan,
            "subscription_status": user.subscription_status
        }
    })


@stripe_bp.route("/test/set-subscription", methods=["POST"])
def test_set_subscription():
    """Test endpoint to manually set subscription status - DEVELOPMENT ONLY"""
    import os
    if os.getenv('FLASK_ENV') != 'development':
        return jsonify({"error": "Not available in production"}), 403
    
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    
    data = request.get_json()
    plan_type = data.get('plan', 'basic')  # 'basic', 'pro', or 'none'
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Set subscription based on plan type
    if plan_type in ['basic', 'pro']:
        limits = User.get_plan_limits(plan_type)
        user.plan = plan_type
        user.subscription_status = "active"
        user.max_agents = limits['max_agents']
        user.set_allowed_addons(limits['allowed_addons'])
        user.subscription_updated_at = datetime.utcnow()
    else:  # none
        user.plan = "none"
        user.subscription_status = "inactive"
        user.max_agents = 0
        user.set_allowed_addons([])
        user.subscription_updated_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({
        "message": f"Set subscription to {plan_type}",
        "plan": user.plan,
        "status": user.subscription_status,
        "max_agents": user.max_agents,
        "allowed_addons": user.get_allowed_addons()
    })


@stripe_bp.route("/debug-session", methods=["GET"])
def debug_session():
    """Debug endpoint to check session state - DEVELOPMENT ONLY"""
    import os
    if os.getenv('FLASK_ENV') != 'development':
        return jsonify({"error": "Not available in production"}), 403
    
    user_id = session.get("user_id")
    session_data = dict(session)
    
    if user_id:
        user = User.query.get(user_id)
        user_data = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "plan": user.plan,
            "subscription_status": user.subscription_status,
            "max_agents": user.max_agents,
            "allowed_addons": user.get_allowed_addons(),
            "can_create_agent": user.can_create_agent()
        } if user else None
    else:
        user_data = None
    
    return jsonify({
        "session_user_id": user_id,
        "session_data": session_data,
        "user_from_db": user_data,
        "message": "Session debug info"
    })


@stripe_bp.route("/subscription-status", methods=["GET"])
def get_subscription_status():
    """
    Get current user's subscription status.
    Returns subscription details for authenticated user.
    """
    # Check authentication
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "Not authenticated"}), 401
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    if not user.stripe_customer_id:
        return jsonify({
            "subscription_status": "none",
            "plan": None,
            "message": "No subscription found"
        })
    
    try:
        # Get customer's subscriptions
        subscriptions = stripe.Subscription.list(
            customer=user.stripe_customer_id,
            status='active',
            limit=1
        )
        
        if subscriptions.data:
            subscription = subscriptions.data[0]
            price_id = subscription['items']['data'][0]['price']['id']
            
            # Determine plan based on price ID
            plan = None
            for plan_name, plan_price_id in STRIPE_PRICE_IDS.items():
                if price_id == plan_price_id:
                    plan = plan_name
                    break
            
            return jsonify({
                "subscription_status": subscription.status,
                "plan": plan,
                "current_period_end": subscription.current_period_end,
                "cancel_at_period_end": subscription.cancel_at_period_end
            })
        else:
            return jsonify({
                "subscription_status": "none",
                "plan": None,
                "message": "No active subscription found"
            })
            
    except stripe.error.StripeError as e:
        return jsonify({"error": "Stripe error", "details": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Internal server error", "details": str(e)}), 500
