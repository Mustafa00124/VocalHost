# app/routes/stripe_routes.py

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import select
import stripe
import os
from datetime import datetime

from app.models import User, Assistant
from app.database import get_db

stripe_router = APIRouter(prefix="/api/stripe", tags=["stripe"])

# Set Stripe API key
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# Stripe webhook endpoint secret
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

# Price IDs for plans (these should match your Stripe dashboard)
STRIPE_PRICE_IDS = {
    "basic": "price_1S154GJESiymFxt51BZ2djFQ",
    "pro": "price_1S166FJESiymFxt59D8pdMeM"
}

# Pydantic models
class CheckoutSessionRequest(BaseModel):
    plan_id: str

class TestLoginRequest(BaseModel):
    user_id: int = 1

class TestSubscriptionRequest(BaseModel):
    plan: str = "basic"


@stripe_router.post("/create-checkout-session")
async def create_checkout_session(
    data: CheckoutSessionRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Create a Stripe checkout session for subscription.
    Body: { "plan_id": "basic" | "pro" }
    """
    # Check authentication
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    stmt = select(User).where(User.id == int(user_id))
    user = db.execute(stmt).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if data.plan_id not in STRIPE_PRICE_IDS:
        raise HTTPException(status_code=400, detail="Invalid plan_id. Must be 'basic' or 'pro'")
    
    try:
        # Create or get Stripe customer
        if not user.stripe_customer_id:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.name,
                metadata={"user_id": user.id}
            )
            user.stripe_customer_id = customer.id
            db.commit()
        
        # Create checkout session
        checkout_session = stripe.checkout.Session.create(
            customer=user.stripe_customer_id,
            payment_method_types=['card'],
            line_items=[{
                'price': STRIPE_PRICE_IDS[data.plan_id],
                'quantity': 1,
            }],
            mode='subscription',
            success_url=os.getenv('FRONTEND_URL', 'http://localhost:5173') + '/dashboard?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=os.getenv('FRONTEND_URL', 'http://localhost:5173') + '/plans',
            metadata={
                'user_id': user.id,
                'plan_id': data.plan_id
            }
        )
        
        return {
            "id": checkout_session.id,
            "url": checkout_session.url,
            "status": checkout_session.status
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@stripe_router.post("/create-customer-portal-session")
async def create_customer_portal_session(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Create a Stripe customer portal session for subscription management.
    Requires authentication via session.
    """
    # Check authentication
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    stmt = select(User).where(User.id == int(user_id))
    user = db.execute(stmt).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No Stripe customer found. Please subscribe to a plan first.")
    
    try:
        # Create customer portal session
        portal_session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=os.getenv('FRONTEND_URL', 'http://localhost:5173') + '/dashboard',
        )
        
        return {"url": portal_session.url}
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@stripe_router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Handle Stripe webhook events.
    This endpoint receives events from Stripe about subscription changes.
    """
    print("👉 Incoming Stripe webhook")
    
    payload = await request.body()
    sig_header = request.headers.get('Stripe-Signature')
    
    print(f"🔐 Signature header: {sig_header}")
    print(f"📦 Payload size: {len(payload)} bytes")
    
    if not STRIPE_WEBHOOK_SECRET:
        print("❌ STRIPE_WEBHOOK_SECRET not configured!")
        raise HTTPException(status_code=500, detail="Webhook secret not configured")
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
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        print(f"❌ Invalid signature: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        print(f"❌ Unexpected error constructing event: {e}")
        raise HTTPException(status_code=400, detail="Event construction failed")
    
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
            
            if user_id:
                print(f"🔍 Looking up user with ID: {user_id}")
                stmt = select(User).where(User.id == int(user_id))
                user = db.execute(stmt).scalar_one_or_none()
                if user:
                    print(f"✅ Found user: {user.name} ({user.email})")
                    
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
                    
                    print("💾 Committing changes to database...")
                    db.commit()
                    print("✅ Database updated successfully!")
                else:
                    print(f"❌ User not found with ID: {user_id}")
            else:
                print("❌ No user_id in metadata")
            
            print(f"🎉 Subscription created for customer {customer_id}, plan: {plan_id}")
            
        elif event_type == 'invoice.payment_failed':
            print("❌ Processing invoice.payment_failed event")
            
            customer_id = event_data.get('customer')
            stmt = select(User).filter_by(stripe_customer_id=customer_id)
            user = db.execute(stmt).scalar_one_or_none()
            if user:
                print(f"✅ Found user: {user.name} ({user.email})")
                user.subscription_status = "past_due"
                user.subscription_updated_at = datetime.utcnow()
                db.commit()
                print("✅ Database updated successfully!")
            
        elif event_type == 'customer.subscription.updated':
            customer_id = event_data.get('customer')
            subscription_id = event_data.get('id')
            status = event_data.get('status')
            
            # Get the price ID to determine the plan
            items = event_data.get('items', {}).get('data', [])
            plan_id = None
            if items:
                price_id = items[0].get('price', {}).get('id')
                for plan_name, plan_price_id in STRIPE_PRICE_IDS.items():
                    if price_id == plan_price_id:
                        plan_id = plan_name
                        break
            
            stmt = select(User).filter_by(stripe_customer_id=customer_id)
            user = db.execute(stmt).scalar_one_or_none()
            if user:
                user.subscription_id = subscription_id
                user.subscription_status = status
                user.subscription_updated_at = datetime.utcnow()
                
                if plan_id and plan_id != user.plan:
                    user.plan = plan_id
                    limits = User.get_plan_limits(plan_id)
                    user.max_agents = limits['max_agents']
                    user.set_allowed_addons(limits['allowed_addons'])
                
                db.commit()
            
            print(f"Subscription updated for customer {customer_id}, status: {status}, plan: {plan_id}")
            
        elif event_type == 'customer.subscription.deleted':
            customer_id = event_data.get('customer')
            
            stmt = select(User).filter_by(stripe_customer_id=customer_id)
            user = db.execute(stmt).scalar_one_or_none()
            if user:
                user.subscription_status = "canceled"
                user.subscription_updated_at = datetime.utcnow()
                user.plan = "none"
                user.max_agents = 0
                user.set_allowed_addons([])
                
                # Suspend all user's assistants
                for assistant in user.assistants:
                    assistant.status = "suspended"
                
                db.commit()
            
            print(f"Subscription cancelled for customer {customer_id}")
            
        elif event_type == 'invoice.payment_succeeded':
            customer_id = event_data.get('customer')
            
            stmt = select(User).filter_by(stripe_customer_id=customer_id)
            user = db.execute(stmt).scalar_one_or_none()
            if user and user.subscription_status == "past_due":
                user.subscription_status = "active"
                user.subscription_updated_at = datetime.utcnow()
                
                # Reactivate suspended assistants
                for assistant in user.assistants:
                    if assistant.status == "suspended":
                        assistant.status = "active"
                
                db.commit()
            
            print(f"Payment succeeded for customer {customer_id}")
        
        else:
            print(f"🤷 Unhandled event type: {event_type}")
        
        print("✅ Webhook processing completed successfully")
        return {"status": "success"}
        
    except Exception as e:
        print(f"💥 ERROR processing webhook: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Webhook processing failed")


@stripe_router.post("/test/login")
async def test_login(data: TestLoginRequest, db: Session = Depends(get_db)):
    """Test endpoint to manually login - DEVELOPMENT ONLY"""
    if os.getenv('FLASK_ENV') != 'development':
        raise HTTPException(status_code=403, detail="Not available in production")
    
    stmt = select(User).where(User.id == data.user_id)
    user = db.execute(stmt).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Note: Cannot set cookies in test endpoint, return user data instead
    return {
        "message": f"User {user.id} found (use auth flow to login properly)",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "plan": user.plan,
            "subscription_status": user.subscription_status
        }
    }


@stripe_router.post("/test/set-subscription")
async def test_set_subscription(
    data: TestSubscriptionRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Test endpoint to manually set subscription status - DEVELOPMENT ONLY"""
    if os.getenv('FLASK_ENV') != 'development':
        raise HTTPException(status_code=403, detail="Not available in production")
    
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    stmt = select(User).where(User.id == int(user_id))
    user = db.execute(stmt).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Set subscription based on plan type
    if data.plan in ['basic', 'pro']:
        limits = User.get_plan_limits(data.plan)
        user.plan = data.plan
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
    
    db.commit()
    
    return {
        "message": f"Set subscription to {data.plan}",
        "plan": user.plan,
        "status": user.subscription_status,
        "max_agents": user.max_agents,
        "allowed_addons": user.get_allowed_addons()
    }


@stripe_router.get("/debug-session")
async def debug_session(request: Request, db: Session = Depends(get_db)):
    """Debug endpoint to check session state - DEVELOPMENT ONLY"""
    if os.getenv('FLASK_ENV') != 'development':
        raise HTTPException(status_code=403, detail="Not available in production")
    
    user_id = request.cookies.get("user_id")
    
    if user_id:
        stmt = select(User).where(User.id == int(user_id))
        user = db.execute(stmt).scalar_one_or_none()
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
    
    return {
        "session_user_id": user_id,
        "user_from_db": user_data,
        "message": "Session debug info"
    }


@stripe_router.get("/subscription-status")
async def get_subscription_status(request: Request, db: Session = Depends(get_db)):
    """
    Get current user's subscription status.
    Returns subscription details for authenticated user.
    """
    # Check authentication
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    stmt = select(User).where(User.id == int(user_id))
    user = db.execute(stmt).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.stripe_customer_id:
        return {
            "subscription_status": "none",
            "plan": None,
            "message": "No subscription found"
        }
    
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
            
            return {
                "subscription_status": subscription.status,
                "plan": plan,
                "current_period_end": subscription.current_period_end,
                "cancel_at_period_end": subscription.cancel_at_period_end
            }
        else:
            return {
                "subscription_status": "none",
                "plan": None,
                "message": "No active subscription found"
            }
            
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
