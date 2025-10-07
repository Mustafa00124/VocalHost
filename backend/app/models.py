from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Time, Float, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import json
from app.database import Base


class User(Base):
    __tablename__ = "user"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(80))
    email = Column(String(120), unique=True, nullable=True)
    google_id = Column(String(120), unique=True, nullable=True)
    google_token = Column(Text, nullable=True)
    google_refresh_token = Column(Text, nullable=True)
    stripe_customer_id = Column(String(120), nullable=True)  # Stripe customer ID
    
    # Subscription fields
    plan = Column(String(20), default="none")  # "none", "basic", "pro"
    subscription_status = Column(String(20), default="inactive")  # "active", "inactive", "past_due", "canceled"
    subscription_id = Column(String(120), nullable=True)  # Stripe subscription ID
    subscription_updated_at = Column(DateTime, nullable=True)
    
    # Plan limits (can be overridden per user if needed)
    max_agents = Column(Integer, default=0)  # 0=none, 1=basic, 3=pro
    allowed_addons = Column(Text, default='[]')  # JSON array of allowed add-ons
    
    assistants = relationship("Assistant", back_populates="owner")
    
    def get_allowed_addons(self):
        """Get allowed add-ons as a Python list"""
        try:
            return json.loads(self.allowed_addons or '[]')
        except:
            return []
    
    def set_allowed_addons(self, addons_list):
        """Set allowed add-ons from a Python list"""
        self.allowed_addons = json.dumps(addons_list)
    
    def can_create_agent(self):
        """Check if user can create another agent based on their plan"""
        if self.subscription_status != "active":
            return False
        current_count = len(self.assistants)
        return current_count < self.max_agents
    
    def can_use_addon(self, addon):
        """Check if user can use a specific add-on"""
        if self.subscription_status != "active":
            return False
        return addon in self.get_allowed_addons()
    
    @staticmethod
    def get_plan_limits(plan):
        """Get default limits for a plan"""
        if plan == "basic":
            return {
                "max_agents": 1,
                "allowed_addons": ["voice", "booking"]
            }
        elif plan == "pro":
            return {
                "max_agents": 3,
                "allowed_addons": ["voice", "chat", "booking", "crm", "analytics"]
            }
        else:
            return {
                "max_agents": 0,
                "allowed_addons": []
            }

class Assistant(Base):
    __tablename__ = "assistant"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(80), nullable=False)
    business_name = Column(String(120))
    description = Column(Text)
    start_time = Column(String(5))
    end_time = Column(String(5))
    booking_duration_minutes = Column(Integer)
    available_days = Column(Text)  # JSON string of available days
    twilio_number = Column(String(20))
    voice_type = Column(String(10), default="female")
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    
    # Assistant status and features
    status = Column(String(20), default="active")  # "active", "suspended", "inactive"
    enabled_features = Column(Text, default='["voice"]')  # JSON array of enabled features
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="assistants")
    
    def get_enabled_features(self):
        """Get enabled features as a Python list"""
        try:
            return json.loads(self.enabled_features or '["voice"]')
        except:
            return ["voice"]
    
    def set_enabled_features(self, features_list):
        """Set enabled features from a Python list"""
        self.enabled_features = json.dumps(features_list)
    
    def has_feature(self, feature):
        """Check if assistant has a specific feature enabled"""
        return feature in self.get_enabled_features()
    
    def is_accessible(self):
        """Check if assistant is accessible (owner has active subscription and assistant is active)"""
        return (self.status == "active" and 
                self.owner and 
                self.owner.subscription_status == "active")


class Booking(Base):
    __tablename__ = "booking"
    
    id             = Column(Integer, primary_key=True)
    assistant_id   = Column(Integer, ForeignKey("assistant.id"), nullable=False)
    conversation_id  = Column(Integer, ForeignKey("conversation.id"), nullable=False)  # new!
    date           = Column(Date, nullable=False)
    time           = Column(Time, nullable=False)
    customer_name  = Column(String(80), nullable=False)
    details        = Column(Text)
    created_at     = Column(DateTime, server_default=func.now())



class Conversation(Base):
    __tablename__ = "conversation"
    
    id             = Column(Integer, primary_key=True)
    assistant_id   = Column(Integer, ForeignKey("assistant.id"), nullable=False)
    caller_number  = Column(String(20), nullable=False)
    created_at     = Column(DateTime, server_default=func.now())

    messages       = relationship("Message", back_populates="conversation")


class Message(Base):
    __tablename__ = "message"
    
    id              = Column(Integer, primary_key=True)
    conversation_id = Column(Integer, ForeignKey("conversation.id"), nullable=False)
    role            = Column(String(20), nullable=False)   # "user" or "assistant"
    content         = Column(Text, nullable=False)
    created_at      = Column(DateTime, server_default=func.now())
    
    # Relationships
    conversation    = relationship("Conversation", back_populates="messages")


class AssistantAnalytics(Base):
    """Analytics data for assistants (Pro plan feature)"""
    __tablename__ = "assistant_analytics"
    
    id = Column(Integer, primary_key=True)
    assistant_id = Column(Integer, ForeignKey("assistant.id"), nullable=False)
    
    # Daily metrics
    date = Column(Date, nullable=False)
    total_calls = Column(Integer, default=0)
    total_messages = Column(Integer, default=0)
    total_bookings = Column(Integer, default=0)
    avg_call_duration = Column(Float, default=0.0)  # in seconds
    successful_bookings = Column(Integer, default=0)
    
    # Unique index for assistant_id + date
    __table_args__ = (UniqueConstraint('assistant_id', 'date', name='_assistant_date_uc'),)
    
    @staticmethod
    def increment_metric(db_session, assistant_id, metric_name, value=1, date_override=None):
        """Increment a metric for an assistant on a specific date"""
        from datetime import date as dt_date
        from sqlalchemy import select
        target_date = date_override or dt_date.today()
        
        # Get or create analytics record for today
        stmt = select(AssistantAnalytics).filter_by(
            assistant_id=assistant_id,
            date=target_date
        )
        analytics = db_session.execute(stmt).scalar_one_or_none()
        
        if not analytics:
            analytics = AssistantAnalytics(
                assistant_id=assistant_id,
                date=target_date
            )
            db_session.add(analytics)
        
        # Update the metric
        if hasattr(analytics, metric_name):
            current_value = getattr(analytics, metric_name) or 0
            setattr(analytics, metric_name, current_value + value)
        
        db_session.commit()
        return analytics
