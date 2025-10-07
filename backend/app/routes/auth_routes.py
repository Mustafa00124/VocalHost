# app/routes/auth_routes.py

from fastapi import APIRouter, HTTPException, Depends, Request, Response, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models import User
from app.database import get_db
import os, secrets, stripe
import json

# Allow insecure transport for local development (OAuth via HTTP)
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

auth_router = APIRouter(prefix="/api/auth", tags=["auth"])

# Pydantic models
class UserResponse(BaseModel):
    id: int
    name: Optional[str]
    email: Optional[str]
    stripe_customer_id: Optional[str]

class AuthResponse(BaseModel):
    message: str
    user: UserResponse

class LoginResponse(BaseModel):
    message: str
    user: UserResponse

GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI  = os.getenv("GOOGLE_REDIRECT_URI")

SCOPES = [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid",
]

# Set Stripe API key
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

@auth_router.get("/google/login")
async def google_login(
    request: Request,
    response: Response,
    callback: Optional[str] = Query(None)
):
    """Initiate Google OAuth login"""
    flow = Flow.from_client_config(
        client_config={
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri":    "https://accounts.google.com/o/oauth2/auth",
                "token_uri":   "https://oauth2.googleapis.com/token",
                "redirect_uris": [GOOGLE_REDIRECT_URI],
            }
        },
        scopes=SCOPES,
    )
    flow.redirect_uri = GOOGLE_REDIRECT_URI

    # Use state parameter to pass callback URL instead of cookies
    state_data = {
        "nonce": secrets.token_urlsafe(16),
        "callback": callback or "http://localhost:5173/dashboard"
    }
    state = secrets.token_urlsafe(16)  # Keep it simple for now
    
    # Store callback in cookie as backup
    if callback:
        response.set_cookie("frontend_callback", callback, httponly=True, samesite="lax", max_age=300)
    else:
        response.set_cookie("frontend_callback", "http://localhost:5173/auth/callback", httponly=True, samesite="lax", max_age=300)

    auth_url, _ = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent",
        state=state,
    )
    return RedirectResponse(url=auth_url)


@auth_router.get("/google/callback")
async def google_callback(
    request: Request,
    response: Response,
    state: Optional[str] = Query(None),
    code: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Handle Google OAuth callback"""
    # Minimal validation - state check skipped for localhost development
    if not state:
        raise HTTPException(status_code=400, detail="Missing state parameter")

    # 2) Exchange code for tokens
    try:
        flow = Flow.from_client_config(
            client_config={
                "web": {
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "auth_uri":    "https://accounts.google.com/o/oauth2/auth",
                    "token_uri":   "https://oauth2.googleapis.com/token",
                    "redirect_uris": [GOOGLE_REDIRECT_URI],
                }
            },
            scopes=SCOPES,
            state=state,
        )
        flow.redirect_uri = GOOGLE_REDIRECT_URI
        
        full_url = str(request.url)
        flow.fetch_token(authorization_response=full_url)
        creds = flow.credentials
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Token exchange failed: {str(e)}")

    # 3) Fetch user info
    try:
        service = build("oauth2", "v2", credentials=creds)
        profile = service.userinfo().get().execute()
        google_id = profile["id"]
        email = profile.get("email")
        name = profile.get("name")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch user profile: {str(e)}")

    # 4) Upsert User in DB
    try:
        stmt = select(User).where(User.google_id == google_id)
        user = db.execute(stmt).scalar_one_or_none()
        
        if not user and email:
            stmt = select(User).where(User.email == email)
            user = db.execute(stmt).scalar_one_or_none()
        
        if not user:
            user = User(
                google_id=google_id,
                email=email,
                name=name,
                google_token=creds.token,
                google_refresh_token=creds.refresh_token,
            )
            db.add(user)
            db.flush()
        else:
            user.google_token = creds.token
            user.google_refresh_token = creds.refresh_token or user.google_refresh_token
            user.name = name or user.name
            user.email = email or user.email

        # Create Stripe customer if not exists
        if not user.stripe_customer_id and stripe.api_key:
            try:
                customer = stripe.Customer.create(
                    email=email,
                    name=name,
                    metadata={"user_id": user.id if user.id else "pending"}
                )
                user.stripe_customer_id = customer.id
            except Exception as e:
                pass  # Continue without Stripe customer

        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    # 5) Set user session cookie
    response.set_cookie("user_id", str(user.id), httponly=True, samesite="lax", max_age=86400*30)  # 30 days

    # 6) Redirect to front-end callback
    frontend_callback = request.cookies.get("frontend_callback") or "http://localhost:5173/auth/callback"
    response.delete_cookie("frontend_callback")
    
    sep = "&" if "?" in frontend_callback else "?"
    redirect_url = f"{frontend_callback}{sep}login=success"
    
    return RedirectResponse(url=redirect_url)


@auth_router.get("/user/me")
async def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Returns the currently-authenticated user, based on the session cookie.
    Your front-end can call this right after the OAuth redirect to grab
    the user's ID/name/email and store it in localStorage.
    """
    user_id = request.cookies.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    stmt = select(User).where(User.id == int(user_id))
    user = db.execute(stmt).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "stripe_customer_id": user.stripe_customer_id
        }
    }


@auth_router.post("/logout")
async def logout(response: Response):
    """
    Logout the current user and clear the session.
    """
    response.delete_cookie("user_id")
    return {"message": "Successfully logged out"}
