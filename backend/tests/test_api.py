#!/usr/bin/env python3
"""
Minimal Flask app to test the Stripe API endpoints
"""
import os
from flask import Flask, request, jsonify, session
from app.routes.stripe_routes import stripe_bp
import stripe
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create Flask app
app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "test_secret_key_for_testing")

# Set Stripe API key
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# Register Stripe blueprint
app.register_blueprint(stripe_bp, url_prefix="/stripe")

# Mock user for testing
@app.route("/test/create-session", methods=["POST"])
def test_create_session():
    """Create a test session and then call the Stripe endpoint"""
    # Mock user session
    session["user_id"] = 1
    
    # Forward to the actual Stripe endpoint
    from flask import redirect, url_for
    return app.test_client().post("/stripe/create-checkout-session", 
                                 json={"plan_id": "basic"},
                                 headers={"Content-Type": "application/json"})

# Mock User model for testing
class MockUser:
    def __init__(self):
        self.id = 1
        self.email = "test@example.com"
        self.name = "Test User"
        self.stripe_customer_id = None

# Mock database query
def mock_get_user(user_id):
    return MockUser()

# Override the database query in the Stripe routes
import app.routes.stripe_routes as stripe_routes
original_get = stripe_routes.User.query.get
stripe_routes.User.query.get = mock_get_user

if __name__ == "__main__":
    print("Starting test API server...")
    print("Available endpoints:")
    print("  POST http://localhost:5001/stripe/create-checkout-session")
    print("  POST http://localhost:5001/stripe/create-customer-portal-session")
    print("  POST http://localhost:5001/test/create-session (with mock session)")
    print()
    app.run(debug=True, port=5001)
