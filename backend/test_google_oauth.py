#!/usr/bin/env python3
"""
Test script for Google OAuth integration
This script tests the complete OAuth flow and subscription integration
"""

import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
BASE_URL = "http://localhost:5001"  # Adjust if your backend runs on different port
TEST_EMAIL = "mustafa.siddiqui24@gmail.com"

def test_oauth_flow():
    """Test the complete OAuth flow"""
    print("🔍 Testing Google OAuth Integration")
    print("=" * 50)
    
    # Create a session to maintain cookies
    session = requests.Session()
    
    try:
        # Step 1: Test if backend is running
        print("1. Testing backend connectivity...")
        health_response = session.get(f"{BASE_URL}/api/assistants")
        if health_response.status_code == 401:
            print("✅ Backend is running (got expected 401 for unauthorized)")
        else:
            print(f"⚠️  Unexpected response: {health_response.status_code}")
        
        # Step 2: Get OAuth redirect URL
        print("\n2. Testing OAuth initiation...")
        oauth_response = session.get(f"{BASE_URL}/api/auth/google/login")
        
        if oauth_response.status_code == 302:
            redirect_url = oauth_response.headers.get('Location')
            print(f"✅ OAuth redirect URL generated")
            print(f"🔗 Redirect URL: {redirect_url[:100]}...")
            
            if "accounts.google.com" in redirect_url:
                print("✅ Redirect points to Google OAuth")
            else:
                print("❌ Redirect doesn't point to Google")
                
        else:
            print(f"❌ OAuth initiation failed: {oauth_response.status_code}")
            print(f"Response: {oauth_response.text}")
        
        # Step 3: Test environment variables
        print("\n3. Testing environment configuration...")
        google_client_id = os.getenv("GOOGLE_CLIENT_ID")
        google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        google_redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
        
        if google_client_id:
            print(f"✅ GOOGLE_CLIENT_ID configured: {google_client_id[:20]}...")
        else:
            print("❌ GOOGLE_CLIENT_ID not found")
            
        if google_client_secret:
            print(f"✅ GOOGLE_CLIENT_SECRET configured: {google_client_secret[:20]}...")
        else:
            print("❌ GOOGLE_CLIENT_SECRET not found")
            
        if google_redirect_uri:
            print(f"✅ GOOGLE_REDIRECT_URI configured: {google_redirect_uri}")
        else:
            print("❌ GOOGLE_REDIRECT_URI not found")
        
        # Step 4: Test Stripe configuration
        print("\n4. Testing Stripe integration...")
        stripe_key = os.getenv("STRIPE_SECRET_KEY")
        stripe_webhook = os.getenv("STRIPE_WEBHOOK_SECRET")
        
        if stripe_key and stripe_key.startswith("sk_"):
            print(f"✅ Stripe secret key configured: {stripe_key[:20]}...")
        else:
            print("❌ Stripe secret key not properly configured")
            
        if stripe_webhook and stripe_webhook.startswith("whsec_"):
            print(f"✅ Stripe webhook secret configured: {stripe_webhook[:20]}...")
        else:
            print("❌ Stripe webhook secret not properly configured")
        
        # Step 5: Test database connectivity
        print("\n5. Testing database connectivity...")
        try:
            # Import after setting up path
            import sys
            sys.path.append(os.path.dirname(os.path.abspath(__file__)))
            
            from app import create_app
            from app.models import User, db
            
            app = create_app()
            with app.app_context():
                # Try to query users table
                user_count = User.query.count()
                print(f"✅ Database connected. Found {user_count} users")
                
                # Check if test user exists
                test_user = User.query.filter_by(email=TEST_EMAIL).first()
                if test_user:
                    print(f"✅ Test user found: {test_user.name} (Plan: {test_user.plan})")
                    print(f"   Subscription status: {test_user.subscription_status}")
                    print(f"   Max agents: {test_user.max_agents}")
                    print(f"   Allowed addons: {test_user.get_allowed_addons()}")
                else:
                    print(f"ℹ️  Test user {TEST_EMAIL} not found (will be created on first login)")
                    
        except Exception as e:
            print(f"❌ Database connection failed: {str(e)}")
        
        print("\n" + "=" * 50)
        print("🎯 MANUAL TESTING INSTRUCTIONS:")
        print("=" * 50)
        print("1. Start your backend server:")
        print("   cd AI-Voice-Assistant")
        print("   python run.py")
        print()
        print("2. Start your frontend server:")
        print("   cd AI-Voice-Assistant-Frontend")
        print("   npm run dev")
        print()
        print("3. Open browser and go to: http://localhost:5173")
        print("4. Click 'Get Started' or 'Login'")
        print("5. Use Google OAuth with your credentials")
        print(f"   Email: {TEST_EMAIL}")
        print("   Password: [Your Google password]")
        print()
        print("6. After login, check:")
        print("   - User profile shows in navbar")
        print("   - 'My Agents' link appears")
        print("   - '/my-agents' page loads correctly")
        print("   - Plan limits are displayed")
        print("   - Subscription status is shown")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_oauth_flow()
    exit(0 if success else 1)
