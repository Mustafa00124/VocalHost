from app.extensions import db 
from datetime import datetime
import json


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80))
    email = db.Column(db.String(120), unique=True, nullable=True)
    google_id = db.Column(db.String(120), unique=True, nullable=True)
    google_token = db.Column(db.Text, nullable=True)
    google_refresh_token = db.Column(db.Text, nullable=True)
    stripe_customer_id = db.Column(db.String(120), nullable=True)  # Stripe customer ID
    
    # Subscription fields
    plan = db.Column(db.String(20), default="none")  # "none", "basic", "pro"
    subscription_status = db.Column(db.String(20), default="inactive")  # "active", "inactive", "past_due", "canceled"
    subscription_id = db.Column(db.String(120), nullable=True)  # Stripe subscription ID
    subscription_updated_at = db.Column(db.DateTime, nullable=True)
    
    # Plan limits (can be overridden per user if needed)
    max_agents = db.Column(db.Integer, default=0)  # 0=none, 1=basic, 3=pro
    allowed_addons = db.Column(db.Text, default='[]')  # JSON array of allowed add-ons
    
    assistants = db.relationship("Assistant", backref="owner", lazy=True)
    
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

class Assistant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    business_name = db.Column(db.String(120))
    description = db.Column(db.Text)
    start_time = db.Column(db.String(5))
    end_time = db.Column(db.String(5))
    booking_duration_minutes = db.Column(db.Integer)
    available_days = db.Column(db.Text)  # JSON string of available days
    twilio_number = db.Column(db.String(20))
    voice_type = db.Column(db.String(10), default="female")
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    
    # Assistant status and features
    status = db.Column(db.String(20), default="active")  # "active", "suspended", "inactive"
    enabled_features = db.Column(db.Text, default='["voice"]')  # JSON array of enabled features
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())
    
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


class Booking(db.Model):
    id             = db.Column(db.Integer, primary_key=True)
    assistant_id   = db.Column(db.Integer, db.ForeignKey("assistant.id"), nullable=False)
    conversation_id  = db.Column(db.Integer, db.ForeignKey("conversation.id"), nullable=False)  # new!
    date           = db.Column(db.Date, nullable=False)
    time           = db.Column(db.Time, nullable=False)
    customer_name  = db.Column(db.String(80), nullable=False)
    details        = db.Column(db.Text)
    created_at     = db.Column(db.DateTime, server_default=db.func.now())



class Conversation(db.Model):
    __tablename__ = "conversation"
    id             = db.Column(db.Integer, primary_key=True)
    assistant_id   = db.Column(db.Integer, db.ForeignKey("assistant.id"), nullable=False)
    caller_number  = db.Column(db.String(20), nullable=False)
    created_at     = db.Column(db.DateTime, server_default=db.func.now())

    messages       = db.relationship("Message", backref="conversation", lazy=True)


class Message(db.Model):
    __tablename__ = "message"
    id              = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey("conversation.id"), nullable=False)
    role            = db.Column(db.String(20), nullable=False)   # "user" or "assistant"
    content         = db.Column(db.Text,   nullable=False)
    created_at      = db.Column(db.DateTime, server_default=db.func.now())


class AssistantAnalytics(db.Model):
    """Analytics data for assistants (Pro plan feature)"""
    __tablename__ = "assistant_analytics"
    id = db.Column(db.Integer, primary_key=True)
    assistant_id = db.Column(db.Integer, db.ForeignKey("assistant.id"), nullable=False)
    
    # Daily metrics
    date = db.Column(db.Date, nullable=False)
    total_calls = db.Column(db.Integer, default=0)
    total_messages = db.Column(db.Integer, default=0)
    total_bookings = db.Column(db.Integer, default=0)
    avg_call_duration = db.Column(db.Float, default=0.0)  # in seconds
    successful_bookings = db.Column(db.Integer, default=0)
    
    # Unique index for assistant_id + date
    __table_args__ = (db.UniqueConstraint('assistant_id', 'date', name='_assistant_date_uc'),)
    
    @staticmethod
    def increment_metric(assistant_id, metric_name, value=1, date_override=None):
        """Increment a metric for an assistant on a specific date"""
        from datetime import date as dt_date
        target_date = date_override or dt_date.today()
        
        # Get or create analytics record for today
        analytics = AssistantAnalytics.query.filter_by(
            assistant_id=assistant_id,
            date=target_date
        ).first()
        
        if not analytics:
            analytics = AssistantAnalytics(
                assistant_id=assistant_id,
                date=target_date
            )
            db.session.add(analytics)
        
        # Update the metric
        if hasattr(analytics, metric_name):
            current_value = getattr(analytics, metric_name) or 0
            setattr(analytics, metric_name, current_value + value)
        
        db.session.commit()
        return analytics
