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
            success_url=request.host_url.rstrip('/') + '/dashboard?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=request.host_url.rstrip('/') + '/plans',
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
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')
    
    if not STRIPE_WEBHOOK_SECRET:
        return jsonify({"error": "Webhook secret not configured"}), 500
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        # Invalid payload
        return jsonify({"error": "Invalid payload"}), 400
    except stripe.error.SignatureVerificationError:
        # Invalid signature
        return jsonify({"error": "Invalid signature"}), 400
    
    # Handle the event
    event_type = event['type']
    event_data = event['data']['object']
    
    try:
        if event_type == 'checkout.session.completed':
            # Payment succeeded, subscription created
            customer_id = event_data.get('customer')
            subscription_id = event_data.get('subscription')
            metadata = event_data.get('metadata', {})
            user_id = metadata.get('user_id')
            plan_id = metadata.get('plan_id')
            
            if user_id:
                user = User.query.get(int(user_id))
                if user:
                    if not user.stripe_customer_id:
                        user.stripe_customer_id = customer_id
                    
                    # Set subscription details
                    user.subscription_id = subscription_id
                    user.subscription_status = "active"
                    user.subscription_updated_at = datetime.utcnow()
                    
                    # Set plan and limits based on plan_id
                    if plan_id in ['basic', 'pro']:
                        user.plan = plan_id
                        limits = User.get_plan_limits(plan_id)
                        user.max_agents = limits['max_agents']
                        user.set_allowed_addons(limits['allowed_addons'])
                    
                    db.session.commit()
            
            print(f"Subscription created for customer {customer_id}, plan: {plan_id}")
            
        elif event_type == 'invoice.payment_failed':
            # Payment failed - mark subscription as past_due
            customer_id = event_data.get('customer')
            subscription_id = event_data.get('subscription')
            
            user = User.query.filter_by(stripe_customer_id=customer_id).first()
            if user:
                user.subscription_status = "past_due"
                user.subscription_updated_at = datetime.utcnow()
                db.session.commit()
            
            print(f"Payment failed for customer {customer_id}")
            
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
            print(f"Unhandled event type: {event_type}")
        
        return jsonify({"status": "success"})
        
    except Exception as e:
        print(f"Error processing webhook: {str(e)}")
        return jsonify({"error": "Webhook processing failed"}), 500


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
