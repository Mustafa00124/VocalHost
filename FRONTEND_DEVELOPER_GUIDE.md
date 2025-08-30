# Backend Developer Guide - AI Voice Assistant Frontend

## 🏗️ Project Overview

This is a **React + TypeScript** frontend application for an AI Voice Assistant service called **VocalHost**. The application allows businesses to create AI-powered voice assistants that can handle appointment scheduling, customer inquiries, and business operations through natural voice interactions.

## 🚀 Tech Stack

- **Frontend Framework**: React 18.2.0 with TypeScript
- **Build Tool**: Vite 5.1.0
- **Styling**: Tailwind CSS 3.4.1
- **State Management**: React Context API
- **Routing**: React Router DOM 6.22.1
- **Animations**: Framer Motion 11.18.2
- **HTTP Client**: Axios 1.9.0
- **Payment Processing**: Stripe.js 7.9.0
- **UI Components**: Headless UI, Heroicons
- **Forms**: Tailwind Forms plugin

## 🏛️ Architecture Overview

The application follows a **component-based architecture** with:
- **Context-based state management** for authentication and theming
- **Protected routes** for authenticated users
- **API-first design** - all data operations go through your backend
- **Responsive design** with mobile-first approach
- **Dark/Light theme support**
- **Google OAuth integration** for secure authentication
- **Stripe subscription management** with customer portal access

## 📱 Core Features & Pages

### 1. **Authentication System** (`/login`, `/auth/callback`)
- **Google OAuth Flow**: Complete Google OAuth integration
- **Session Management**: 30-minute token expiration with auto-logout
- **Protected Routes**: Dashboard, Create Assistant, Schedule
- **User Context**: Manages user state and subscription info across the app
- **Error Handling**: Comprehensive error states and user feedback

**Backend Requirements:**
```
GET /api/auth/google/login?callback={frontend_callback_url}
- Purpose: Initiates Google OAuth flow
- Query Params: callback (encoded frontend callback URL)
- Returns: Redirects to Google OAuth

GET /api/auth/callback
- Purpose: Handles OAuth callback from Google
- Returns: Redirects to frontend with success/failure status

GET /api/auth/user/me
- Returns: { user: { id, name, email, stripeCustomerId, subscriptionStatus, subscriptionPlan } }
- Authentication: Cookie-based (credentials: 'include')

POST /api/auth/logout
- Purpose: Logs out user and clears session
- Authentication: Cookie-based (credentials: 'include')
- Returns: Success status
```

### 2. **Dashboard** (`/dashboard`)
- **Assistant Management**: View, edit, delete AI assistants
- **Real-time Updates**: Shows newly created assistants
- **Status Management**: Active/inactive assistant states
- **Business Overview**: Quick stats and actions

**Backend Requirements:**
```
GET /api/assistants?user_id={userId}
- Returns: { assistants: Assistant[] }
- Authentication: Required

PUT /api/assistants/{assistantId}
- Body: AssistantUpdatePayload
- Authentication: Required

DELETE /api/assistants/{assistantId}
- Authentication: Required
```

### 3. **Create Assistant** (`/create`)
- **Assistant Configuration**: Name, business details, voice settings
- **Business Hours**: Start/end times, available days
- **Voice Customization**: Male/female voice selection
- **File Upload**: Business documents for AI training
- **Twilio Integration**: Phone number assignment

**Backend Requirements:**
```
POST /api/assistants
- Body: FormData with fields:
  - user_id, receptionist_name, business_name, business_description
  - start_time, end_time, booking_duration_minutes
  - phone_number, voice_type, files[]
- Returns: { id, twilioNumber, message }
- Authentication: Required
```

### 4. **Schedule Management** (`/schedule`)
- **Calendar Views**: Day, week, month views
- **Appointment Booking**: Customer appointment creation
- **Time Slot Management**: Available/occupied slots
- **Business Hours**: Respects assistant availability
- **Real-time Updates**: Live booking status

**Backend Requirements:**
```
GET /api/assistants?user_id={userId}
- Returns: { assistants: AssistantInfo[] }

GET /api/bookings?assistant_id={assistantId}&date={date}
- Returns: { bookings: BackendBooking[], slots: Record<string, BackendSlot[]> }

POST /api/bookings
- Body: { assistant_id, customer_name, date, time, details }
- Returns: { success: boolean, booking_id: string }
```

### 5. **Subscription Plans** (`/plans`)
- **Pricing Tiers**: Basic ($25), Pro ($50), Custom
- **Stripe Integration**: Secure payment processing
- **Customer Portal**: Subscription management via Stripe
- **Plan Features**: Voice assistants, support levels, analytics

**Backend Requirements:**
```
POST /stripe/create-checkout-session
- Body: { planId, planName, price, successUrl, cancelUrl }
- Returns: { sessionId: string }

POST /stripe/create-customer-portal-session
- Body: { customer_id: string }
- Returns: { url: string }
```

## 🔐 Authentication & Security

### Google OAuth Implementation
- **Frontend Flow**: User clicks "Sign in with Google" → redirects to backend
- **Backend Handles**: OAuth token exchange, user creation, session management
- **Session Storage**: Backend manages secure sessions with cookies
- **Token Expiration**: 30-minute session timeout with automatic logout

### User Data Structure
```typescript
interface User {
  id: number;
  name: string;           // Real name from Google OAuth
  email: string;          // Google account email
  stripeCustomerId?: string;  // For subscription management
  subscriptionStatus?: 'active' | 'inactive' | 'cancelled';
  subscriptionPlan?: 'basic' | 'pro' | 'custom';
  expiresAt?: number;     // Session expiration timestamp
}
```

### Security Features
- **Secure OAuth Flow**: All authentication handled by backend
- **Cookie-based Sessions**: Secure session management
- **Protected Routes**: Authentication required for sensitive pages
- **Automatic Logout**: Token expiration handling
- **Error Handling**: Graceful fallbacks for auth failures

## 💳 Payment & Subscription System

### Stripe Integration
- **Checkout Sessions**: For new subscriptions
- **Customer Portal**: For existing subscription management
- **Webhook Handling**: Subscription lifecycle events
- **Price Structure**: Cents-based pricing (2500 = $25.00)

### Subscription Management Flow
1. **User Signs In**: Via Google OAuth
2. **Subscription Check**: Backend provides subscription status
3. **Manage Subscription**: Frontend calls customer portal API
4. **Portal Redirect**: User manages subscription in Stripe

### Backend Webhook Endpoints Needed
```
POST /stripe/webhook
- Handles: subscription.created, subscription.updated, subscription.deleted
- Payment success/failure events
- Customer portal session events
```

## 📊 Data Models & Types

### Assistant Model
```typescript
interface Assistant {
  id: number;
  name: string;
  business_name?: string;
  description?: string;
  start_time: string;        // "09:00"
  end_time: string;          // "17:00"
  booking_duration_minutes: number;
  available_days: Record<string, boolean>;  // { monday: true, ... }
  twilio_number: string;
  voice_type: "male" | "female";
  status?: "active" | "inactive";
}
```

### Appointment/Booking Model
```typescript
interface Appointment {
  id: string;
  customerName: string;
  details?: string;
  date: string;              // ISO date string
  time: string;              // "HH:MM" format
  duration?: number;         // minutes
  created_at: string;
}
```

### Subscription Model
```typescript
interface SubscriptionPlan {
  id: string;                // "basic", "pro", "custom"
  name: string;              // "Basic", "Pro", "Custom"
  price: string;             // "$25", "$50", "Custom"
  priceValue: number;        // 2500, 5000, 0 (in cents)
  features: string[];
  popular: boolean;
}
```

## 🌐 API Endpoints Summary

### Authentication (NEW - Required for OAuth)
- `GET /api/auth/google/login?callback={url}` - Start Google OAuth flow
- `GET /api/auth/callback` - Handle OAuth callback
- `GET /api/auth/user/me` - Get current user info (including Stripe data)
- `POST /api/auth/logout` - Logout user

### Assistants
- `GET /api/assistants?user_id={id}` - List user's assistants
- `POST /api/assistants` - Create new assistant
- `PUT /api/assistants/{id}` - Update assistant
- `DELETE /api/assistants/{id}` - Delete assistant

### Bookings
- `GET /api/bookings?assistant_id={id}&date={date}` - Get bookings and slots
- `POST /api/bookings` - Create new booking

### Stripe Integration (Updated)
- `POST /stripe/create-checkout-session` - Create payment session
- `POST /stripe/create-customer-portal-session` - Access customer portal
- `POST /stripe/webhook` - Handle Stripe events

## 🔧 Environment Variables

The frontend expects these environment variables:
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

## 📱 Frontend UI Components

### Navigation Bar Updates
- **When Signed In**: Shows user name, email, Manage Subscription button, Sign Out
- **When Signed Out**: Shows "Sign in with Google" button
- **Mobile Menu**: Responsive design with all authentication options

### User Interface Elements
- **Google Sign-In Button**: Prominent placement in navbar and login page
- **User Info Display**: Name and email shown when authenticated
- **Manage Subscription**: Direct access to Stripe Customer Portal
- **Error Handling**: User-friendly error messages and feedback

## 🚨 Error Handling

The frontend implements comprehensive error handling:
- **API Failures**: Graceful fallbacks and user notifications
- **Network Issues**: Retry mechanisms and offline handling
- **Validation Errors**: Form validation with helpful messages
- **Authentication Errors**: Automatic logout on token expiration
- **OAuth Errors**: Clear feedback for authentication failures

## 🔄 State Management

### Context Providers
- **AuthContext**: User authentication, OAuth flow, and subscription management
- **ThemeContext**: Dark/light theme preferences

### Authentication State
- **User Data**: Real-time user information and subscription status
- **Session Management**: Automatic token expiration and logout
- **Error States**: Comprehensive error handling and user feedback

## 📋 Backend Development Priorities

1. **Google OAuth System**: Implement complete OAuth flow with session management
2. **User Management**: User CRUD operations with Stripe customer ID integration
3. **Authentication Endpoints**: Secure session handling and user validation
4. **Assistant API**: Full CRUD for voice assistants
5. **Booking System**: Appointment scheduling logic
6. **Stripe Integration**: Payment processing, webhooks, and customer portal
7. **Real-time Updates**: WebSocket for live data
8. **File Upload**: Document handling for AI training
9. **Business Logic**: Appointment validation and conflicts

## 🔗 Integration Points

### Frontend → Backend
- All data operations via REST API
- Authentication via Google OAuth and secure sessions
- File uploads via FormData
- Real-time updates via polling (can be upgraded to WebSocket)

### Backend → Google OAuth
- OAuth token exchange and validation
- User profile information retrieval
- Session creation and management

### Backend → Stripe
- Checkout session creation
- Customer portal sessions
- Webhook event handling
- Subscription lifecycle management

### Backend → External Services
- Twilio for phone number management
- AI services for voice assistant training
- Email/SMS for notifications

## 🎯 Key Backend Requirements

### OAuth Flow Implementation
```typescript
// 1. Handle OAuth initiation
GET /api/auth/google/login?callback={frontend_url}

// 2. Process OAuth callback
GET /api/auth/callback
// - Exchange code for tokens
// - Create/update user record
// - Set secure session cookie
// - Redirect to frontend with success

// 3. Provide user data
GET /api/auth/user/me
// - Return user info including Stripe customer ID
// - Validate session cookie
// - Include subscription status
```

### Session Management
- **Secure Cookies**: HttpOnly, Secure, SameSite attributes
- **Session Expiration**: 30-minute timeout
- **Automatic Cleanup**: Expired session handling
- **CSRF Protection**: Implement CSRF tokens for state-changing operations

### Stripe Integration
- **Customer Creation**: Create Stripe customer on first OAuth login
- **Subscription Tracking**: Monitor subscription status changes
- **Webhook Processing**: Handle all Stripe events
- **Portal Access**: Generate customer portal URLs

## 📚 Additional Resources

- **Stripe Documentation**: [Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)
- **Google OAuth**: [OAuth 2.0 Implementation](https://developers.google.com/identity/protocols/oauth2)
- **React Router**: [Protected Routes](https://reactrouter.com/en/main/start/concepts#protected-routes)
- **Tailwind CSS**: [Responsive Design](https://tailwindcss.com/docs/responsive-design)
- **Framer Motion**: [Animation Examples](https://www.framer.com/motion/examples/)

---

**Note**: This frontend is designed to be completely decoupled from your backend implementation. All business logic, data validation, and external service integrations should be handled on the backend side. The frontend serves as a modern, responsive interface that communicates with your API endpoints and provides a professional user experience for Google OAuth authentication and Stripe subscription management.
