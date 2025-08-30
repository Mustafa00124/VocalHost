#!/usr/bin/env python3
"""
Simple test script to test Stripe checkout session creation
"""
import os
import json
import stripe
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set Stripe API key
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

def test_stripe_connection():
    """Test basic Stripe connection"""
    try:
        # Test basic Stripe API call
        balance = stripe.Balance.retrieve()
        print("✓ Stripe connection successful")
        print(f"  Available balance: {balance.available}")
        return True
    except Exception as e:
        print(f"✗ Stripe connection failed: {e}")
        return False

def test_checkout_session():
    """Test checkout session creation"""
    STRIPE_PRICE_IDS = {
        "basic": "price_1S154GJESiymFxt51BZ2djFQ",
        "premium": "price_1S166FJESiymFxt59D8pdMeM"
    }
    
    try:
        # Create a test customer
        customer = stripe.Customer.create(
            email="test@example.com",
            name="Test User",
            metadata={"user_id": "test_123"}
        )
        print(f"✓ Test customer created: {customer.id}")
        
        # Create checkout session for basic plan
        checkout_session = stripe.checkout.Session.create(
            customer=customer.id,
            payment_method_types=['card'],
            line_items=[{
                'price': STRIPE_PRICE_IDS["basic"],
                'quantity': 1,
            }],
            mode='subscription',
            success_url='http://localhost:5000/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url='http://localhost:5000/cancel',
            metadata={
                'user_id': 'test_123',
                'plan_id': 'basic'
            }
        )
        
        print("✓ Checkout session created successfully!")
        print(f"  Session ID: {checkout_session.id}")
        print(f"  Checkout URL: {checkout_session.url}")
        
        # Clean up - delete test customer
        stripe.Customer.delete(customer.id)
        print("✓ Test customer cleaned up")
        
        return checkout_session
        
    except Exception as e:
        print(f"✗ Checkout session creation failed: {e}")
        return None

def test_customer_portal():
    """Test customer portal session creation"""
    try:
        # Create a test customer
        customer = stripe.Customer.create(
            email="test@example.com",
            name="Test User"
        )
        
        # Create customer portal session
        portal_session = stripe.billing_portal.Session.create(
            customer=customer.id,
            return_url='http://localhost:5000/dashboard',
        )
        
        print("✓ Customer portal session created successfully!")
        print(f"  Portal URL: {portal_session.url}")
        
        # Clean up
        stripe.Customer.delete(customer.id)
        print("✓ Test customer cleaned up")
        
        return portal_session
        
    except Exception as e:
        print(f"✗ Customer portal creation failed: {e}")
        return None

if __name__ == "__main__":
    print("🧪 Testing Stripe Integration")
    print("=" * 50)
    
    # Check if Stripe keys are set
    if not os.getenv("STRIPE_SECRET_KEY"):
        print("✗ STRIPE_SECRET_KEY not found in environment")
        exit(1)
    
    print(f"Using Stripe secret key: {os.getenv('STRIPE_SECRET_KEY')[:12]}...")
    print()
    
    # Test basic connection
    if test_stripe_connection():
        print()
        
        # Test checkout session
        print("Testing checkout session creation...")
        checkout = test_checkout_session()
        print()
        
        # Test customer portal
        print("Testing customer portal creation...")
        portal = test_customer_portal()
        print()
        
        if checkout and portal:
            print("🎉 All Stripe tests passed! Your integration should work.")
        else:
            print("❌ Some tests failed. Check your Stripe configuration.")
    else:
        print("❌ Basic Stripe connection failed. Check your API keys.")
