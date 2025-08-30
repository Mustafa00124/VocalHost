#!/usr/bin/env python3
"""
Simple test to directly test the Stripe checkout session creation logic
"""
import os
import stripe
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set Stripe API key
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# Price IDs for plans
STRIPE_PRICE_IDS = {
    "basic": "price_1S154GJESiymFxt51BZ2djFQ",
    "pro": "price_1S166FJESiymFxt59D8pdMeM"
}

def test_basic_plan_checkout():
    """Test the basic plan checkout session creation"""
    plan_id = "basic"
    
    print(f"🧪 Testing {plan_id} plan checkout session creation")
    print("=" * 60)
    
    try:
        # Create a test customer (simulating user)
        customer = stripe.Customer.create(
            email="testuser@example.com",
            name="Test User",
            metadata={"user_id": "123"}
        )
        print(f"✓ Test customer created: {customer.id}")
        
        # Create checkout session - EXACTLY like the backend code
        checkout_session = stripe.checkout.Session.create(
            customer=customer.id,
            payment_method_types=['card'],
            line_items=[{
                'price': STRIPE_PRICE_IDS[plan_id],
                'quantity': 1,
            }],
            mode='subscription',
            success_url='http://localhost:5000/dashboard?session_id={CHECKOUT_SESSION_ID}',
            cancel_url='http://localhost:5000/plans',
            metadata={
                'user_id': '123',
                'plan_id': plan_id
            }
        )
        
        print("🎉 SUCCESS! Checkout session created for basic plan!")
        print(f"📋 Session Details:")
        print(f"   Session ID: {checkout_session.id}")
        print(f"   Status: {checkout_session.status}")
        print(f"   Plan: {plan_id}")
        print(f"   Price ID: {STRIPE_PRICE_IDS[plan_id]}")
        print(f"   Customer: {customer.id}")
        print()
        print(f"🔗 Checkout URL:")
        print(f"   {checkout_session.url}")
        print()
        
        # Test the URL structure
        if "checkout.stripe.com" in checkout_session.url:
            print("✓ Valid Stripe checkout URL generated")
        else:
            print("✗ Invalid checkout URL")
        
        # Clean up test customer
        stripe.Customer.delete(customer.id)
        print("✓ Test customer cleaned up")
        
        return {
            "session_id": checkout_session.id,
            "url": checkout_session.url,
            "status": checkout_session.status
        }
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return None

def test_pro_plan_checkout():
    """Test the pro plan checkout session creation"""
    plan_id = "pro"
    
    print(f"🧪 Testing {plan_id} plan checkout session creation")
    print("=" * 60)
    
    try:
        # Create a test customer
        customer = stripe.Customer.create(
            email="testuser2@example.com",
            name="Test User 2",
            metadata={"user_id": "456"}
        )
        print(f"✓ Test customer created: {customer.id}")
        
        # Create checkout session for premium plan
        checkout_session = stripe.checkout.Session.create(
            customer=customer.id,
            payment_method_types=['card'],
            line_items=[{
                'price': STRIPE_PRICE_IDS[plan_id],
                'quantity': 1,
            }],
            mode='subscription',
            success_url='http://localhost:5000/dashboard?session_id={CHECKOUT_SESSION_ID}',
            cancel_url='http://localhost:5000/plans',
            metadata={
                'user_id': '456',
                'plan_id': plan_id
            }
        )
        
        print("🎉 SUCCESS! Checkout session created for pro plan!")
        print(f"📋 Session Details:")
        print(f"   Session ID: {checkout_session.id}")
        print(f"   Status: {checkout_session.status}")
        print(f"   Plan: {plan_id}")
        print(f"   Price ID: {STRIPE_PRICE_IDS[plan_id]}")
        print(f"   Customer: {customer.id}")
        print()
        print(f"🔗 Checkout URL:")
        print(f"   {checkout_session.url}")
        print()
        
        # Clean up
        stripe.Customer.delete(customer.id)
        print("✓ Test customer cleaned up")
        
        return {
            "session_id": checkout_session.id,
            "url": checkout_session.url,
            "status": checkout_session.status
        }
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return None

if __name__ == "__main__":
    print("🚀 Testing Stripe Checkout Session Creation")
    print("=" * 60)
    print(f"Using Stripe secret key: {os.getenv('STRIPE_SECRET_KEY')[:12]}...")
    print()
    
    # Test both plans
    basic_result = test_basic_plan_checkout()
    print()
    pro_result = test_pro_plan_checkout()
    print()
    
    # Summary
    print("📊 SUMMARY")
    print("=" * 60)
    if basic_result and pro_result:
        print("🎉 ALL TESTS PASSED!")
        print("✓ Basic plan checkout session: WORKING")
        print("✓ Pro plan checkout session: WORKING")
        print()
        print("🚀 Your Stripe integration is ready!")
        print("   Both price IDs are working correctly")
        print("   Checkout URLs are being generated")
        print("   Backend API should work perfectly")
    else:
        print("❌ SOME TESTS FAILED")
        if not basic_result:
            print("✗ Basic plan checkout: FAILED")
        if not pro_result:
            print("✗ Pro plan checkout: FAILED")
