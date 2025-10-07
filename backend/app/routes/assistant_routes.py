# app/routes/assistant_routes.py

from fastapi import APIRouter, HTTPException, Depends, Request, UploadFile, File, Form, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import select, and_
import json
import os
from datetime import datetime, timedelta

from app.models import User, Assistant, Booking, AssistantAnalytics
from app.database import get_db
from app.services.twillio_helper import buy_twilio_number
from app.services.rag import extract_and_index
from app.services.booking import generate_time_slots, load_booked_slots

assistant_router = APIRouter(prefix="/api", tags=["assistant"])

# Pydantic models
class AssistantCreate(BaseModel):
    business_name: str
    receptionist_name: str
    start_time: str
    end_time: str
    booking_duration_minutes: int
    phone_number: str
    available_days: Dict[str, bool]
    voice_type: str
    business_description: Optional[str] = ""

class AssistantUpdate(BaseModel):
    business_name: Optional[str] = None
    receptionist_name: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    booking_duration_minutes: Optional[int] = None
    available_days: Optional[Dict[str, bool]] = None
    voice_type: Optional[str] = None

class AssistantResponse(BaseModel):
    id: int
    name: str
    business_name: str
    description: Optional[str]
    start_time: str
    end_time: str
    booking_duration_minutes: int
    available_days: Dict[str, bool]
    twilio_number: Optional[str]
    voice_type: str
    status: str
    features: List[str]
    created_at: Optional[datetime]
    is_accessible: bool

class BookingResponse(BaseModel):
    id: int
    date: str
    time: str
    customer_name: str
    details: Optional[str]
    created_at: datetime

class SlotsResponse(BaseModel):
    date: str
    day: str
    slots: List[str]
    business_hours: str
    slot_duration: int

@assistant_router.post("/register")
async def register_business(
    user_id: int = Form(...),
    business_name: str = Form(...),
    receptionist_name: str = Form(...),
    start_time: str = Form(...),
    end_time: str = Form(...),
    booking_duration_minutes: int = Form(...),
    phone_number: str = Form(...),
    available_days: str = Form(...),  # JSON string
    voice_type: str = Form(...),
    business_description: str = Form(""),
    twilio_number: Optional[str] = Form(None),
    files: List[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Register a new business assistant.
    Accepts multipart/form-data with form fields and optional files for RAG indexing.
    """
    # 1) Validate user exists
    stmt = select(User).where(User.id == user_id)
    user = db.execute(stmt).scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="No such user")
    
    # Check subscription status and limits
    if not user.can_create_agent():
        if user.subscription_status != "active":
            raise HTTPException(status_code=403, detail="Active subscription required to create agents")
        else:
            raise HTTPException(status_code=403, detail=f"Agent limit reached. Your {user.plan} plan allows {user.max_agents} agent(s)")
    
    # 2) Acquire or purchase Twilio number
    if not twilio_number:
        try:
            twilio_number = buy_twilio_number(country="US")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Twilio error: {str(e)}")

    # 3) Parse available days
    try:
        available_days_dict = json.loads(available_days)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid available_days JSON format")

    # 4) Create the Assistant record
    assistant = Assistant(
        name=receptionist_name,
        business_name=business_name,
        description=business_description,
        start_time=start_time,
        end_time=end_time,
        booking_duration_minutes=booking_duration_minutes,
        available_days=json.dumps(available_days_dict),
        twilio_number=twilio_number,
        voice_type=voice_type,
        user_id=user.id
    )
    db.add(assistant)
    db.flush()  # Get the ID

    # 5) Process uploaded files for RAG indexing
    indexed = 0
    if files:
        docs = []
        for file in files:
            if not file.filename:
                continue
                
            filename = os.path.basename(file.filename)
            ext = filename.rsplit(".", 1)[-1].lower()
            data = await file.read()
            
            if ext == "pdf":
                docs.append(data)
            elif ext in ("txt", "md", "text"):
                docs.append(data.decode("utf-8", errors="ignore"))
        
        if docs:
            result = extract_and_index(assistant.id, user.id, docs)
            indexed = result.get("indexed", 0)

    db.commit()

    # 6) Return response
    return {
        "message": f"Assistant created. Forward calls to {twilio_number}.",
        "assistant_id": assistant.id,
        "twilio_number": twilio_number,
        "indexed_chunks": indexed
    }


# Flask routes removed - using FastAPI routes only above
# Old Flask routes were here (lines 168-576) but have been removed
