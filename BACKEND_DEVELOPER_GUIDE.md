# Backend Developer Guide - AI Voice Assistant Backend

## 🏗️ Project Overview

This is a **Flask-based Python backend** for an AI Voice Assistant service called **VocalHost**. The backend provides APIs for creating AI-powered voice assistants that can handle phone calls, manage appointments, process payments through Stripe subscriptions, and provide business insights through analytics.

## 🚀 Tech Stack

- **Framework**: Flask 3.1.1 with Python 3.11+
- **Database**: SQLite (development) / PostgreSQL (production) with SQLAlchemy ORM
- **Authentication**: Google OAuth 2.0 with session-based auth
- **Payment Processing**: Stripe API integration with webhooks
- **Voice Processing**: OpenAI Realtime API + Twilio for phone calls
- **Vector Database**: Qdrant for RAG (Retrieval-Augmented Generation)
- **Real-time Communication**: WebSockets (Flask-Sock) for voice streaming
- **Document Processing**: PDF/text extraction with OpenAI/Gemini
- **Phone Integration**: Twilio for call handling and number management
- **Deployment**: Fly.io with Docker, Vercel for frontend

## 🏛️ Architecture Overview

The backend follows a **modular Flask architecture** with:
- **Blueprint-based routing** for organized API endpoints (`/api`, `/voice`, `/stripe`, `/api/auth`)
- **Service layer** for business logic separation (booking, RAG, TTS, STT, etc.)
- **Database models** with SQLAlchemy relationships and subscription-based access control
- **Real-time WebSocket** handling for voice calls via OpenAI Realtime API
- **External service integrations** (Stripe, Twilio, OpenAI, Qdrant, Google OAuth)
- **Subscription-based feature gating** with plan limits and analytics

## 📊 Database Schema

### Core Models

#### User (Enhanced with Subscription Features)
```python
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80))
    email = db.Column(db.String(120), unique=True, nullable=True)
    google_id = db.Column(db.String(120), unique=True, nullable=True)
    google_token = db.Column(db.Text, nullable=True)
    google_refresh_token = db.Column(db.Text, nullable=True)
    stripe_customer_id = db.Column(db.String(120), nullable=True)
    
    # Subscription fields
    plan = db.Column(db.String(20), default="none")  # "none", "basic", "pro"
    subscription_status = db.Column(db.String(20), default="inactive")  # "active", "inactive", "past_due", "canceled"
    subscription_id = db.Column(db.String(120), nullable=True)
    subscription_updated_at = db.Column(db.DateTime, nullable=True)
    
    # Plan limits
    max_agents = db.Column(db.Integer, default=0)  # 0=none, 1=basic, 3=pro
    allowed_addons = db.Column(db.Text, default='[]')  # JSON array
    
    # Relationships
    assistants = db.relationship("Assistant", backref="owner", lazy=True)
```

**Key Methods:**
- `can_create_agent()`: Check if user can create another agent based on plan
- `can_use_addon(addon)`: Check if user can use specific features
- `get_plan_limits(plan)`: Static method for plan configuration

#### Assistant (Enhanced with Features and Status)
```python
class Assistant(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    business_name = db.Column(db.String(120))
    description = db.Column(db.Text)
    start_time = db.Column(db.String(5))        # "09:00"
    end_time = db.Column(db.String(5))          # "17:00"
    booking_duration_minutes = db.Column(db.Integer)
    available_days = db.Column(db.Text)          # JSON string
    twilio_number = db.Column(db.String(20))
    voice_type = db.Column(db.String(10), default="female")
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    
    # New fields
    status = db.Column(db.String(20), default="active")  # "active", "suspended", "inactive"
    enabled_features = db.Column(db.Text, default='["voice"]')  # JSON array
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())
```

**Key Methods:**
- `get_enabled_features()`: Get enabled features as Python list
- `has_feature(feature)`: Check if assistant has specific feature
- `is_accessible()`: Check if assistant is accessible (owner has active subscription)

#### Booking (Enhanced with Conversation Tracking)
```python
class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    assistant_id = db.Column(db.Integer, db.ForeignKey("assistant.id"), nullable=False)
    conversation_id = db.Column(db.Integer, db.ForeignKey("conversation.id"), nullable=False)  # NEW
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)
    customer_name = db.Column(db.String(80), nullable=False)
    details = db.Column(db.Text)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
```

#### Conversation & Messages (For Call Tracking)
```python
class Conversation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    assistant_id = db.Column(db.Integer, db.ForeignKey("assistant.id"), nullable=False)
    caller_number = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    messages = db.relationship("Message", backref="conversation", lazy=True)

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey("conversation.id"), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # "user" or "assistant"
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
```

#### AssistantAnalytics (Pro Plan Feature)
```python
class AssistantAnalytics(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    assistant_id = db.Column(db.Integer, db.ForeignKey("assistant.id"), nullable=False)
    date = db.Column(db.Date, nullable=False)
    total_calls = db.Column(db.Integer, default=0)
    total_messages = db.Column(db.Integer, default=0)
    total_bookings = db.Column(db.Integer, default=0)
    avg_call_duration = db.Column(db.Float, default=0.0)
    successful_bookings = db.Column(db.Integer, default=0)
```

## 🌐 API Endpoints by Frontend Feature

### 1. **Authentication System** (Maps to Login/Callback pages)

#### Google OAuth Flow
```http
GET /api/auth/google/login?callback={frontend_url}
```
- **Frontend Usage**: Called when user clicks "Sign in with Google"
- **Response**: Redirects to Google OAuth
- **Frontend Flow**: Login page → Google → Callback page

```http
GET /api/auth/google/callback
```
- **Purpose**: Handle Google OAuth callback and create/update user
- **Business Logic**: 
  - Creates Stripe customer automatically
  - Upserts user with Google profile data
  - Sets secure session cookie
- **Response**: Redirects to frontend with `?login=success`

#### Session Management
```http
GET /api/auth/user/me
```
- **Frontend Usage**: Called on app load and auth callback to get user data
- **Authentication**: Session-based (credentials: 'include')
- **Response**:
```json
{
  "user": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "stripe_customer_id": "cus_1234567890abcdef"
  }
}
```

```http
POST /api/auth/logout
```
- **Frontend Usage**: Called from Navbar user dropdown
- **Business Logic**: Clears Flask session
- **Response**: Success confirmation

### 2. **Dashboard Page** (Maps to `/dashboard` route)

#### Get User's Agents with Analytics
```http
GET /api/my-agents
```
- **Frontend Usage**: Dashboard page loads this for main agent list
- **Authentication**: Required (session-based)
- **Business Logic**: 
  - Returns subscription info and limits
  - Includes analytics data based on plan (Basic: today only, Pro: 30 days)
  - Checks agent accessibility based on subscription status
- **Response**:
```json
{
  "user_info": {
    "plan": "pro",
    "subscription_status": "active",
    "max_agents": 3,
    "allowed_addons": ["voice", "chat", "booking", "crm", "analytics"],
    "can_create_agent": true
  },
  "agents": [
    {
      "id": 1,
      "agent_name": "Receptionist AI",
      "business_name": "Tech Corp",
      "twilio_number": "+1234567890",
      "status": "active",
      "is_accessible": true,
      "analytics": {
        "period": "last_30_days",
        "total_calls": 45,
        "total_bookings": 12,
        "conversion_rate": 26.67
      }
    }
  ]
}
```

#### Legacy Assistant Listing (Fallback)
```http
GET /api/assistants?user_id={userId}
```
- **Frontend Usage**: Used as fallback in Dashboard
- **Business Logic**: Simple assistant list without analytics
- **Response**: Array of assistant objects

#### Update Assistant
```http
PATCH /api/assistant/{assistantId}
```
- **Frontend Usage**: Dashboard edit functionality
- **Body**: `AssistantUpdatePayload` with fields to update
- **Business Logic**: Updates assistant configuration, validates ownership

### 3. **Create Assistant Page** (Maps to `/create` route)

#### Create Business Receptionist (Full Featured)
```http
POST /api/register
Content-Type: multipart/form-data
```
- **Frontend Usage**: Main creation flow with Twilio number
- **Business Logic**: 
  - Checks subscription limits (`user.can_create_agent()`)
  - Purchases Twilio number automatically
  - Processes uploaded documents for RAG indexing
  - Sets up business hours and scheduling
- **Form Fields**:
  - `user_id`, `business_name`, `receptionist_name`
  - `start_time`, `end_time`, `booking_duration_minutes`
  - `phone_number`, `voice_type`, `available_days` (JSON)
  - `files[]` (optional): Business documents
- **Response**:
```json
{
  "message": "Assistant created. Forward calls to +1234567890.",
  "assistant_id": 1,
  "twilio_number": "+1234567890",
  "indexed_chunks": 15
}
```

#### Create AI Assistant (Simplified)
```http
POST /api/register/assistant
Content-Type: multipart/form-data
```
- **Frontend Usage**: Alternative creation flow for AI-only assistants
- **Business Logic**: 
  - Checks subscription limits
  - No phone number assignment
  - Default business hours set
- **Form Fields**:
  - `user_id`, `assistant_name`, `business_name`, `business_description`
  - `files[]` (optional): Business documents

### 4. **Schedule Page** (Maps to `/schedule` route)

#### Get Available Time Slots
```http
GET /api/slots/{assistantId}?date={YYYY-MM-DD}
```
- **Frontend Usage**: Calendar view for showing available appointment times
- **Business Logic**: 
  - Respects assistant's business hours and available days
  - Excludes already booked slots
  - Generates time slots based on duration settings
- **Response**:
```json
{
  "date": "2025-01-28",
  "day": "tuesday",
  "slots": ["9:00 AM", "9:30 AM", "10:00 AM"],
  "business_hours": "09:00 - 17:00",
  "slot_duration": 30
}
```

#### Get Assistant Bookings & Schedule
```http
GET /api/bookings/{assistantId}?start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}
```
- **Frontend Usage**: Schedule page calendar view with week/month ranges
- **Business Logic**: 
  - Returns all bookings in date range
  - Generates slot availability matrix
  - Includes business hours context
- **Response**:
```json
{
  "bookings": [
    {
      "id": 1,
      "date": "2025-01-28",
      "time": "10:00",
      "customer_name": "John Doe",
      "details": "Consultation meeting",
      "created_at": "2025-01-28 09:30:00"
    }
  ],
  "slots": {
    "2025-01-28": [
      {"time": "09:00", "is_booked": false},
      {"time": "10:00", "is_booked": true}
    ]
  }
}
```

### 5. **Subscription Plans Page** (Maps to `/plans` route)

#### Create Checkout Session
```http
POST /stripe/create-checkout-session
```
- **Frontend Usage**: When user clicks "Subscribe" button
- **Authentication**: Required
- **Business Logic**: 
  - Creates/retrieves Stripe customer
  - Sets up subscription checkout with plan metadata
- **Body**:
```json
{
  "plan_id": "basic"  // or "pro"
}
```
- **Response**:
```json
{
  "id": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/...",
  "status": "created"
}
```

#### Customer Portal Access
```http
POST /stripe/create-customer-portal-session
```
- **Frontend Usage**: "Manage Subscription" button in navbar/plans page
- **Authentication**: Required
- **Business Logic**: Creates secure portal session for subscription management
- **Response**:
```json
{
  "url": "https://billing.stripe.com/session/..."
}
```

#### Stripe Webhooks (Critical for Subscription Updates)
```http
POST /stripe/webhook
```
- **Purpose**: Handle subscription lifecycle events
- **Business Logic**: 
  - `checkout.session.completed`: Activates subscription, sets plan limits
  - `customer.subscription.updated`: Updates plan and features
  - `customer.subscription.deleted`: Suspends assistants, resets limits
  - `invoice.payment_failed`: Marks subscription as past_due
- **Security**: Webhook signature verification with `STRIPE_WEBHOOK_SECRET`

### 6. **Voice Call System** (Background Processing)

#### Voice Call Entry Point
```http
POST /voice/voice
```
- **Purpose**: Twilio webhook for incoming calls
- **Business Logic**: 
  - Validates assistant exists and is accessible
  - Checks subscription status before allowing calls
  - Creates conversation record
  - Returns TwiML to connect to WebSocket
- **Form Data**: `To` (assistant number), `From` (caller number)

#### Real-time Call Processing
```http
WebSocket: /ws/call/{conversationId}
```
- **Purpose**: Real-time audio streaming with OpenAI Realtime API
- **Business Logic**: 
  - Handles audio streaming between Twilio and OpenAI
  - Processes booking requests during calls
  - Tracks analytics (call duration, success rate)
  - Implements interruption handling

### 7. **Document Processing (RAG System)**

#### Index Business Documents
```http
POST /api/rag/index_files
Content-Type: multipart/form-data
```
- **Frontend Usage**: File upload in Create Assistant forms
- **Business Logic**: 
  - Extracts text from PDF/TXT/MD files
  - Chunks content for vector storage
  - Embeds and indexes in Qdrant
- **Form Fields**: `assistant_id`, `user_id`, `files[]`
- **Response**:
```json
{
  "indexed": 15
}
```

## 🔐 Authentication & Security

### Session Management
- **Cookie-based sessions** with secure settings (`HttpOnly`, `Secure`, `SameSite`)
- **30-minute session timeout** managed by frontend
- **CSRF protection** enabled for state-changing operations
- **CORS enabled** for frontend domains (localhost:5173, Vercel deployment)

### OAuth Flow Implementation
1. **Frontend**: User clicks "Sign in with Google" → redirects to `/api/auth/google/login?callback={frontend_url}`
2. **Backend**: Initiates Google OAuth flow with state validation
3. **Google**: User authenticates → redirects to `/api/auth/google/callback`
4. **Backend**: 
   - Validates OAuth state and exchanges code for tokens
   - Creates/updates user record with Google profile data
   - Creates Stripe customer automatically
   - Sets secure session cookie
5. **Frontend**: Redirected with `?login=success` → calls `/api/auth/user/me` to get user data

### Subscription-Based Access Control
- **Route Protection**: Most endpoints check `session["user_id"]`
- **Feature Gating**: Plan-based limits enforced in business logic
- **Assistant Access**: `assistant.is_accessible()` checks owner's subscription status
- **Plan Limits**: Enforced in assistant creation and feature usage

## 💳 Payment Processing & Subscription Management

### Stripe Integration Details
- **Test Mode**: Uses test keys for development
- **Customer Management**: Automatic customer creation on OAuth
- **Subscription Plans**:
  - Basic: `price_1S154GJESiymFxt51BZ2djFQ` ($25/month, 1 agent)
  - Pro: `price_1S166FJESiymFxt59D8pdMeM` ($50/month, 3 agents + analytics)
- **Webhook Events**: Complete subscription lifecycle handling
- **Customer Portal**: Self-service subscription management

### Plan Feature Matrix
```python
# Basic Plan
{
    "max_agents": 1,
    "allowed_addons": ["voice", "chat"]
}

# Pro Plan  
{
    "max_agents": 3,
    "allowed_addons": ["voice", "chat", "booking", "crm", "analytics"]
}
```

### Business Logic Integration
- **Agent Creation**: Checks `user.can_create_agent()` before allowing creation
- **Feature Access**: `user.can_use_addon(feature)` gates advanced features
- **Status Enforcement**: Suspended assistants return unavailable message on calls
- **Analytics**: Plan-based analytics (Basic: today only, Pro: 30 days)

## 🎙️ Voice Processing & Real-time Communication

### OpenAI Realtime API Integration
- **Model**: GPT-4o Mini Realtime for natural conversation
- **Audio Format**: G711 μ-law (8kHz) compatible with Twilio
- **Features**:
  - Server-side VAD (Voice Activity Detection)
  - Real-time interruption handling
  - Natural conversation flow with context awareness
  - RAG integration for business-specific responses

### Call Flow Architecture
1. **Incoming Call**: Twilio → `/voice/voice` endpoint
2. **Validation**: Check assistant existence and subscription status
3. **WebSocket Setup**: TwiML connects to `/ws/call/{conversationId}`
4. **Real-time Processing**: Audio streams between Twilio ↔ OpenAI
5. **Business Logic**: AI processes booking requests with business context
6. **Analytics Tracking**: Call metrics recorded for reporting

### RAG Integration During Calls
- **Context Retrieval**: Business documents searched during conversation
- **Semantic Search**: Qdrant vector database for relevant information
- **Response Enhancement**: OpenAI combines real-time input with business knowledge
- **Booking Integration**: AI can check availability and create appointments

## 📊 Analytics & Reporting System

### Analytics Data Collection
- **Call Metrics**: Duration, success rate, conversion rate
- **Booking Metrics**: Total bookings, successful bookings
- **Daily Aggregation**: `AssistantAnalytics` model tracks daily metrics
- **Real-time Updates**: Metrics updated during call processing

### Plan-Based Analytics Access
```python
# Basic Plan - Limited Analytics
{
    "period": "today",
    "total_calls": 5,
    "total_bookings": 2
}

# Pro Plan - Full Analytics  
{
    "period": "last_30_days",
    "total_calls": 145,
    "total_messages": 520,
    "total_bookings": 35,
    "successful_bookings": 32,
    "avg_call_duration": 125.5,
    "conversion_rate": 22.07
}
```

## 🔧 Environment Variables

### Required Configuration
```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
# or sqlite:///app.db for development

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret  
GOOGLE_REDIRECT_URI=http://localhost:5001/api/auth/google/callback

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# OpenAI
OPENAI_KEY=sk-...

# Qdrant Vector Database
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=your_api_key

# Flask Security
SECRET_KEY=your_secret_key_here

# Twilio (for voice calls)
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx

# Frontend URL
FRONTEND_URL=https://your-frontend-domain.com
```

## 🚨 Error Handling & Status Codes

### HTTP Status Code Usage
- **200**: Successful operation
- **201**: Resource created (assistant, booking)
- **400**: Validation error, invalid input
- **401**: Authentication required
- **403**: Subscription limit reached, feature not allowed
- **404**: Resource not found
- **500**: Internal server error

### Subscription-Related Error Messages
```json
// Agent creation limit reached
{
  "error": "Agent limit reached. Your basic plan allows 1 agent(s)"
}

// Feature not available for plan
{
  "error": "Active subscription required to create agents"
}

// Assistant suspended due to subscription
{
  "error": "This assistant is currently unavailable due to account status"
}
```

## 📈 Development Setup & Testing

### Local Development Environment
```bash
# Backend setup
cd backend
pip install -r requirements.txt
cp example.env .env  # Configure environment variables
python run.py  # Starts on localhost:5001

# Database setup
alembic upgrade head  # Apply migrations

# Test endpoints
curl http://localhost:5001/api/auth/user/me -H "Cookie: session=..."
```

### Development Testing Endpoints
```http
# Development only - manual login
POST /stripe/test/login
{
  "user_id": 1
}

# Development only - set subscription
POST /stripe/test/set-subscription  
{
  "plan": "pro"
}

# Debug session state
GET /stripe/debug-session
```

## 🔗 Frontend Integration Points

### What Frontend Expects from Backend

#### Authentication Flow
- OAuth redirect handling with state validation
- Session-based authentication with 30-minute timeout
- User data endpoint for profile information
- Logout endpoint for session cleanup

#### Assistant Management
- Subscription-aware assistant creation with limit enforcement
- Real-time assistant listing with analytics data
- Update capabilities for assistant configuration
- Status management based on subscription state

#### Subscription Integration
- Stripe checkout session creation with plan metadata
- Customer portal access for self-service management
- Webhook-driven subscription updates
- Plan limit enforcement in all operations

#### Booking System
- Time slot generation respecting business hours
- Booking creation and conflict prevention
- Calendar view data with availability matrix
- Business hours and duration configuration

### API Response Consistency
- All endpoints return JSON with consistent error format
- Authentication errors return 401 with clear messages
- Subscription limits return 403 with helpful upgrade prompts
- Success responses include necessary data for UI updates

## 🚀 Deployment & Production Considerations

### Fly.io Deployment
- **Docker**: Uses provided Dockerfile for containerization
- **Database**: PostgreSQL in production, SQLite for development
- **Environment**: All secrets managed through Fly.io secrets
- **SSL**: Automatic HTTPS with secure cookie settings

### Production Security
- **HTTPS Enforcement**: Secure cookies only in production
- **CORS Configuration**: Whitelist frontend domains
- **Webhook Security**: Stripe signature verification
- **Session Security**: HttpOnly, Secure, SameSite cookies

### Performance Optimization
- **Database Indexing**: On frequently queried fields (user_id, assistant_id)
- **Connection Pooling**: SQLAlchemy handles database connections
- **Caching Strategy**: Business hours and slots cached when possible
- **WebSocket Management**: Active calls tracked and cleaned up

### Monitoring & Logging
- **Error Logging**: Comprehensive error tracking in webhooks
- **Analytics Collection**: Call metrics for business insights
- **Health Checks**: Basic endpoint health monitoring
- **Subscription Events**: Detailed logging of subscription changes

---

**Note**: This backend implements a complete SaaS platform with subscription-based access control, real-time voice processing, and comprehensive business management features. All business logic, data validation, plan enforcement, and external service integrations are handled server-side for security and consistency.