# Backend Developer Guide - AI Voice Assistant Backend

## 🏗️ Project Overview

This is a **Flask-based Python backend** for an AI Voice Assistant service called **VocalHost**. The backend provides APIs for creating AI-powered voice assistants that can handle phone calls, manage appointments, and process payments through Stripe integration.

## 🚀 Tech Stack

- **Framework**: Flask 3.1.1 with Python 3.11+
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: Google OAuth 2.0
- **Payment Processing**: Stripe API integration
- **Voice Processing**: OpenAI Realtime API + Twilio
- **Vector Database**: Qdrant for RAG (Retrieval-Augmented Generation)
- **Real-time Communication**: WebSockets (Flask-Sock)
- **Document Processing**: PDF/text extraction with Gemini 2.0
- **Phone Integration**: Twilio for call handling
- **Deployment**: Fly.io with Docker

## 🏛️ Architecture Overview

The backend follows a **modular Flask architecture** with:
- **Blueprint-based routing** for organized API endpoints
- **Service layer** for business logic separation
- **Database models** with SQLAlchemy relationships
- **Real-time WebSocket** handling for voice calls
- **External service integrations** (Stripe, Twilio, OpenAI, Qdrant)

## 📊 Database Schema

### Core Models

#### User
```python
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80))
    email = db.Column(db.String(120), unique=True, nullable=True)
    google_id = db.Column(db.String(120), unique=True, nullable=True)
    google_token = db.Column(db.Text, nullable=True)
    google_refresh_token = db.Column(db.Text, nullable=True)
    stripe_customer_id = db.Column(db.String(120), nullable=True)  # Stripe customer ID
    assistants = db.relationship("Assistant", backref="owner", lazy=True)
```

#### Assistant
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
```

#### Conversation & Messages
```python
class Conversation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    assistant_id = db.Column(db.Integer, db.ForeignKey("assistant.id"))
    caller_number = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    messages = db.relationship("Message", backref="conversation", lazy=True)

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey("conversation.id"))
    role = db.Column(db.String(20), nullable=False)  # "user" or "assistant"
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
```

#### Booking
```python
class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    assistant_id = db.Column(db.Integer, db.ForeignKey("assistant.id"))
    conversation_id = db.Column(db.Integer, db.ForeignKey("conversation.id"))
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time, nullable=False)
    customer_name = db.Column(db.String(80), nullable=False)
    details = db.Column(db.Text)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
```

## 🌐 API Endpoints

### Base URL
```
http://localhost:5001 (development)
https://your-domain.com (production)
```

### 1. Authentication Endpoints

#### Google OAuth Flow
```http
GET /api/auth/google/login?callback={frontend_url}
```
- **Purpose**: Initiate Google OAuth authentication
- **Query Params**: `callback` - Frontend URL to redirect after auth
- **Response**: Redirects to Google OAuth

```http
GET /api/auth/google/callback
```
- **Purpose**: Handle Google OAuth callback
- **Response**: Redirects to frontend with `?login=success`

#### User Management
```http
GET /api/auth/user/me
```
- **Purpose**: Get current authenticated user
- **Authentication**: Required (session-based)
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
- **Purpose**: Logout current user and clear session
- **Authentication**: Required (session-based)
- **Response**:
```json
{
  "message": "Successfully logged out"
}
```

### 2. Assistant Management

#### List User's Assistants
```http
GET /api/assistants?user_id={userId}
```
- **Purpose**: Get all assistants for a user
- **Query Params**: `user_id` (integer)
- **Response**:
```json
{
  "assistants": [
    {
      "id": 1,
      "name": "Receptionist AI",
      "business_name": "Tech Corp",
      "description": "AI receptionist for tech company",
      "start_time": "09:00",
      "end_time": "17:00",
      "booking_duration_minutes": 30,
      "available_days": {
        "monday": true,
        "tuesday": true,
        "wednesday": true,
        "thursday": true,
        "friday": true,
        "saturday": false,
        "sunday": false
      },
      "twilio_number": "+1234567890",
      "voice_type": "female"
    }
  ]
}
```

#### Create Business Assistant
```http
POST /api/register
Content-Type: multipart/form-data
```
- **Purpose**: Create a new AI voice assistant
- **Body** (FormData):
  - `user_id` (int): User ID
  - `business_name` (string): Company name
  - `receptionist_name` (string): AI assistant name
  - `start_time` (string): "HH:MM" format
  - `end_time` (string): "HH:MM" format
  - `booking_duration_minutes` (int): Slot duration
  - `phone_number` (string): Business phone
  - `available_days` (JSON): Days of week
  - `voice_type` (string): "male" or "female"
  - `files[]` (optional): Business documents for RAG

- **Response**:
```json
{
  "message": "Assistant created. Forward calls to +1234567890.",
  "assistant_id": 1,
  "twilio_number": "+1234567890",
  "indexed_chunks": 15
}
```

#### Create AI Assistant (Simpler)
```http
POST /api/register/assistant
Content-Type: multipart/form-data
```
- **Purpose**: Create AI assistant without phone integration
- **Body** (FormData):
  - `user_id` (int): User ID
  - `assistant_name` (string): AI name
  - `business_name` (string): Company name
  - `business_description` (string): Company description
  - `files[]` (optional): Business documents

#### Update Assistant
```http
PATCH /api/assistant/{assistantId}
Content-Type: application/json
```
- **Purpose**: Update assistant configuration
- **Body** (JSON):
```json
{
  "business_name": "Updated Corp Name",
  "receptionist_name": "New AI Name",
  "start_time": "08:00",
  "end_time": "18:00",
  "available_days": {
    "monday": true,
    "tuesday": true,
    "wednesday": true,
    "thursday": true,
    "friday": true,
    "saturday": false,
    "sunday": false
  }
}
```

### 3. Booking & Scheduling

#### Get Available Time Slots
```http
GET /api/slots/{assistantId}?date={YYYY-MM-DD}
```
- **Purpose**: Get available booking slots for a date
- **Query Params**: `date` (optional, defaults to today)
- **Response**:
```json
{
  "date": "2025-08-28",
  "day": "thursday",
  "slots": ["9:00 AM", "9:30 AM", "10:00 AM"],
  "business_hours": "09:00 - 17:00",
  "slot_duration": 30
}
```

#### Get Assistant Bookings
```http
GET /api/bookings/{assistantId}?start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}
```
- **Purpose**: Get all bookings and slot status for date range
- **Query Params**: 
  - `start_date` (optional, defaults to today)
  - `end_date` (optional, defaults to start_date + 7 days)
- **Response**:
```json
{
  "bookings": [
    {
      "id": 1,
      "date": "2025-08-28",
      "time": "10:00",
      "customer_name": "John Doe",
      "details": "Consultation meeting",
      "created_at": "2025-08-28 09:30:00"
    }
  ],
  "slots": {
    "2025-08-28": [
      {"time": "09:00", "is_booked": false},
      {"time": "09:30", "is_booked": false},
      {"time": "10:00", "is_booked": true}
    ]
  },
  "business_hours": "09:00 - 17:00",
  "slot_duration": 30
}
```

### 4. Stripe Payment Integration

#### Create Checkout Session
```http
POST /stripe/create-checkout-session
Content-Type: application/json
```
- **Purpose**: Create Stripe checkout session for subscription
- **Body**:
```json
{
  "plan_id": "basic"
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

#### Customer Portal Session
```http
POST /stripe/create-customer-portal-session
Content-Type: application/json
```
- **Purpose**: Create customer portal for subscription management
- **Authentication**: Required (session-based)
- **Body**: No body required (gets customer_id from authenticated user)
- **Response**:
```json
{
  "url": "https://billing.stripe.com/session/..."
}
```

#### Webhook Endpoint
```http
POST /stripe/webhook
```
- **Purpose**: Handle Stripe webhook events
- **Headers**: `Stripe-Signature` for webhook verification
- **Events Handled**: 
  - `checkout.session.completed`
  - `invoice.payment_failed`
  - Subscription lifecycle events

### 5. RAG (Document Processing)

#### Index Business Documents
```http
POST /api/rag/index_files
Content-Type: multipart/form-data
```
- **Purpose**: Process and index business documents for AI knowledge
- **Body** (FormData):
  - `assistant_id` (int): Assistant ID
  - `user_id` (int): User ID
  - `files[]`: PDF, TXT, MD files
- **Response**:
```json
{
  "indexed": 15
}
```

### 6. Voice Call Integration

#### Voice Call Entry Point
```http
POST /voice/voice
Content-Type: application/x-www-form-urlencoded
```
- **Purpose**: Handle incoming Twilio phone calls
- **Body** (Twilio form data):
  - `To`: Called number
  - `From`: Caller number
- **Response**: TwiML XML for call handling

#### WebSocket for Real-time Call Processing
```http
WebSocket: /ws/call/{conversationId}
```
- **Purpose**: Real-time audio streaming between Twilio and OpenAI
- **Events**:
  - `media`: Audio frames
  - `start`: Call start
  - `stop`: Call end

## 🔐 Authentication & Security

### Session Management
- **Cookie-based sessions** with secure settings
- **30-minute session timeout**
- **CSRF protection** enabled
- **Secure cookies** (HTTPS required in production)

### OAuth Flow
1. **Frontend redirects** to `/api/auth/google/login?callback={frontend_url}`
2. **Backend initiates** Google OAuth flow
3. **Google redirects** to `/api/auth/google/callback`
4. **Backend exchanges** code for tokens and gets user profile
5. **Backend creates/finds** Stripe customer and stores `stripe_customer_id`
6. **Backend creates** user session
7. **Redirects to frontend** with success status

### Protected Routes
All API endpoints (except auth) require valid session:
```python
# Check if user is authenticated
user_id = session.get("user_id")
if not user_id:
    return jsonify({"error": "Not authenticated"}), 401
```

## 💳 Payment Processing

### Stripe Integration
- **Test Mode**: Uses Stripe test keys
- **Customer Management**: Automatic customer creation on OAuth login
- **Subscription Management**: Monthly recurring billing
- **Price Plans**:
  - Basic: `price_1S154GJESiymFxt51BZ2djFQ`
  - Pro: `price_1S166FJESiymFxt59D8pdMeM`
- **Customer Portal**: Secure access for subscription management

### Webhook Security
- **Signature verification** using `Stripe-Signature` header
- **Endpoint secret** validation
- **Event processing** for subscription lifecycle events:
  - `checkout.session.completed` - Subscription successful
  - `invoice.payment_failed` - Payment failed
  - `customer.subscription.updated` - Subscription updated
  - `customer.subscription.deleted` - Subscription cancelled

## 🎙️ Voice Processing

### OpenAI Realtime API
- **Model**: GPT-4o Mini Realtime
- **Audio Format**: G711 μ-law (8kHz)
- **Features**:
  - Server-side VAD (Voice Activity Detection)
  - Interruption handling
  - Real-time transcription
  - Natural conversation flow

### Call Flow
1. **Incoming call** → Twilio → `/voice/voice`
2. **WebSocket connection** → OpenAI Realtime API
3. **Audio streaming** between Twilio and OpenAI
4. **AI processing** with business context (RAG)
5. **Booking management** through conversation
6. **Call completion** with appointment confirmation

## 📁 File Processing

### Document Types Supported
- **PDF**: Extracted using Gemini 2.0
- **Text**: TXT, MD files
- **Processing**: Chunking, embedding, vector storage

### RAG Pipeline
1. **Document upload** → Text extraction
2. **Chunking** → 512-character chunks with overlap
3. **Embedding** → OpenAI text-embedding-3-large
4. **Vector storage** → Qdrant database
5. **Retrieval** → Semantic search during calls

## 🔄 Real-time Updates

### WebSocket Communication
- **Flask-Sock** for WebSocket handling
- **Call state management** per conversation
- **Audio streaming** in real-time
- **Interruption handling** for natural conversation

### Event Flow
1. **User speaks** → Audio to OpenAI
2. **AI processes** → Response generation
3. **Audio output** → Twilio playback
4. **Interruption** → Stop current response
5. **Continue** → Natural conversation flow

## 🚨 Error Handling

### HTTP Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (authentication required)
- **404**: Not Found (resource doesn't exist)
- **500**: Internal Server Error

### Error Response Format
```json
{
  "error": "Description of the error",
  "details": "Additional error information"
}
```

### Common Error Scenarios
- **Missing authentication**: 401 Unauthorized
- **Invalid plan_id**: 400 Bad Request
- **Database connection**: 500 Internal Server Error
- **Stripe API errors**: 400 Bad Request with details

## 🔧 Environment Variables

### Required Variables
```env
# Database
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/ai_voice_assistant

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5001/api/auth/google/callback

# OpenAI
OPENAI_KEY=sk-...

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:5001/api/auth/google/callback

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=...

# Flask
SECRET_KEY=your_secret_key_here
```

### Optional Variables
```env
# OpenRouter (for document processing)
OPENROUTER_API_KEY=...
OPENROUTER_URL=https://openrouter.ai/api/v1/chat/completions

# Twilio
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
```

## 📊 Data Validation

### Input Validation
- **Required fields** checked for all endpoints
- **Data types** validated (integers, dates, times)
- **Business logic** validation (time slots, availability)
- **File upload** validation (size, type, format)

### Business Rules
- **Time slots** respect business hours
- **Booking conflicts** prevented
- **Assistant ownership** verified
- **Subscription status** checked for premium features

## 🚀 Development Setup

### Local Development
1. **Install dependencies**: `pip install -r requirements.txt`
2. **Set environment variables** in `.env` file
3. **Start PostgreSQL**: `brew services start postgresql@14`
4. **Create database**: `createdb ai_voice_assistant`
5. **Run migrations**: `alembic upgrade head`
6. **Start Flask app**: `python3 run.py`

### Database Migrations
```bash
# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# Current migrations applied:
# - b991d95a6447: Add conversation_id to Booking
# - 1f5cdf4a8c45: Add stripe_customer_id to User
```

### Testing
- **Unit tests**: Test individual functions
- **Integration tests**: Test API endpoints
- **OAuth testing**: Test Google OAuth flow end-to-end
- **Stripe testing**: Use test cards and webhooks
- **Voice testing**: Simulate call scenarios

## 🔗 Integration Points

### Frontend → Backend
- **REST API** for all data operations
- **WebSocket** for real-time voice calls
- **File uploads** via multipart/form-data
- **Authentication** via OAuth and sessions

### Backend → External Services
- **Stripe**: Payment processing, subscriptions, and customer management
- **Twilio**: Phone number management and call handling
- **OpenAI**: Voice AI processing and RAG
- **Qdrant**: Vector database for document search
- **Google**: OAuth authentication and user profile management

### Webhook Endpoints
- **Stripe webhooks**: Payment and subscription events
- **Twilio webhooks**: Call status updates
- **Real-time processing**: Voice call events

## 📈 Performance Considerations

### Database Optimization
- **Indexes** on frequently queried fields
- **Connection pooling** for database connections
- **Query optimization** for complex joins

### Caching Strategy
- **Business hours** cached per assistant
- **Available slots** cached per date
- **User sessions** cached in memory

### Scalability
- **Horizontal scaling** with load balancers
- **Database sharding** for large datasets
- **Microservices** architecture ready

## 🔒 Security Best Practices

### Data Protection
- **Input sanitization** for all user inputs
- **SQL injection** prevention with ORM
- **XSS protection** with proper headers
- **CSRF tokens** for form submissions

### API Security
- **Rate limiting** on sensitive endpoints
- **Request validation** for all inputs
- **Error message** sanitization
- **Logging** for security events

### Payment Security
- **PCI compliance** through Stripe
- **Webhook signature** verification
- **Secure key storage** in environment variables
- **HTTPS enforcement** in production


---

**Note**: This backend is designed to be completely decoupled from the frontend implementation. All business logic, data validation, and external service integrations are handled on the backend side. The frontend serves as a modern, responsive interface that communicates with these API endpoints.
