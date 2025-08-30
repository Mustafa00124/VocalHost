#!/usr/bin/env python3
"""
Test script to verify environment configuration for Google OAuth and Stripe
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_configuration():
    """Test environment configuration"""
    print("🔍 Testing Configuration")
    print("=" * 50)
    
    all_good = True
    
    # Test Google OAuth configuration
    print("1. Google OAuth Configuration:")
    google_client_id = os.getenv("GOOGLE_CLIENT_ID")
    google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    google_redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")
    
    if google_client_id:
        print(f"✅ GOOGLE_CLIENT_ID: {google_client_id[:20]}...")
    else:
        print("❌ GOOGLE_CLIENT_ID not found")
        all_good = False
        
    if google_client_secret:
        print(f"✅ GOOGLE_CLIENT_SECRET: {google_client_secret[:20]}...")
    else:
        print("❌ GOOGLE_CLIENT_SECRET not found")
        all_good = False
        
    if google_redirect_uri:
        print(f"✅ GOOGLE_REDIRECT_URI: {google_redirect_uri}")
    else:
        print("❌ GOOGLE_REDIRECT_URI not found")
        all_good = False
    
    # Test Stripe configuration
    print("\n2. Stripe Configuration:")
    stripe_secret = os.getenv("STRIPE_SECRET_KEY")
    stripe_webhook = os.getenv("STRIPE_WEBHOOK_SECRET")
    stripe_basic_price = os.getenv("STRIPE_BASIC_PRICE_ID")
    stripe_pro_price = os.getenv("STRIPE_PRO_PRICE_ID")
    
    if stripe_secret and stripe_secret.startswith("sk_"):
        print(f"✅ STRIPE_SECRET_KEY: {stripe_secret[:20]}...")
    else:
        print("❌ STRIPE_SECRET_KEY not found or invalid")
        all_good = False
        
    if stripe_webhook and stripe_webhook.startswith("whsec_"):
        print(f"✅ STRIPE_WEBHOOK_SECRET: {stripe_webhook[:20]}...")
    else:
        print("❌ STRIPE_WEBHOOK_SECRET not found or invalid")
        all_good = False
        
    if stripe_basic_price:
        print(f"✅ STRIPE_BASIC_PRICE_ID: {stripe_basic_price}")
    else:
        print("❌ STRIPE_BASIC_PRICE_ID not found")
        all_good = False
        
    if stripe_pro_price:
        print(f"✅ STRIPE_PRO_PRICE_ID: {stripe_pro_price}")
    else:
        print("❌ STRIPE_PRO_PRICE_ID not found")
        all_good = False
    
    # Test OpenAI configuration
    print("\n3. OpenAI Configuration:")
    openai_key = os.getenv("OPENAI_KEY")
    
    if openai_key and openai_key.startswith("sk-"):
        print(f"✅ OPENAI_KEY: {openai_key[:20]}...")
    else:
        print("❌ OPENAI_KEY not found or invalid")
        all_good = False
    
    # Test Database configuration
    print("\n4. Database Configuration:")
    database_url = os.getenv("DATABASE_URL")
    
    if database_url:
        print(f"✅ DATABASE_URL: {database_url[:50]}...")
    else:
        print("❌ DATABASE_URL not found")
        all_good = False
    
    # Test Flask configuration
    print("\n5. Flask Configuration:")
    secret_key = os.getenv("SECRET_KEY")
    
    if secret_key:
        print(f"✅ SECRET_KEY: {secret_key[:20]}...")
    else:
        print("❌ SECRET_KEY not found")
        all_good = False
    
    print("\n" + "=" * 50)
    if all_good:
        print("✅ All configuration looks good!")
        print("\nTo test the OAuth flow:")
        print("1. Start backend: python run.py")
        print("2. Start frontend: cd ../AI-Voice-Assistant-Frontend && npm run dev")
        print("3. Visit: http://localhost:5173")
        print("4. Click 'Get Started' and try Google login")
    else:
        print("❌ Some configuration is missing. Please check your .env file.")
        print("\nMake sure you have a .env file with all required keys.")
        print("Copy from example.env and fill in your actual values.")
    
    return all_good

if __name__ == "__main__":
    success = test_configuration()
    exit(0 if success else 1)
