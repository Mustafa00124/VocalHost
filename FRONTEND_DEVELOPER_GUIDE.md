# Frontend Developer Guide - AI Voice Assistant Frontend

## 🏗️ Project Overview

This is a **React + TypeScript** frontend application for an AI Voice Assistant service called **VocalHost**. The application allows businesses to create AI-powered voice assistants that can handle appointment scheduling, customer inquiries, and business operations through natural voice interactions. The frontend features a comprehensive dashboard, subscription management, and assistant configuration system.

## 🚀 Tech Stack

- **Frontend Framework**: React 18.2.0 with TypeScript
- **Build Tool**: Vite 5.1.0 for fast development and optimized builds
- **Styling**: Tailwind CSS 3.4.1 with dark/light theme support
- **State Management**: React Context API (AuthContext, ThemeContext, CreateAssistantContext)
- **Routing**: React Router DOM 6.22.1 with protected routes
- **Animations**: Framer Motion 11.18.2 for smooth transitions and stepper animations
- **HTTP Client**: Fetch API with credentials support
- **Payment Processing**: Stripe Checkout integration
- **UI Components**: Heroicons, custom components with Headless UI patterns
- **Forms**: Multi-step form handling with TypeScript validation and stepper navigation
- **Deployment**: Vercel with environment variable management

## 🏛️ Architecture Overview

The application follows a **modern React architecture** with:
- **Context-based state management** for authentication, theming, and multi-step forms
- **Protected route system** for subscription-based access control
- **Multi-step stepper flows** with guided user experiences and live previews
- **API-first design** with comprehensive error handling
- **Responsive design** with mobile-first Tailwind CSS approach
- **Dark/Light theme system** with user preference persistence
- **Google OAuth integration** with secure session management
- **Stripe subscription management** with customer portal access
- **Real-time data updates** through API polling and state management
- **Comprehensive button text readability** with CSS overrides for accessibility

## 📱 Application Flow & Page Structure

### 1. **Home Page** (`/` route) - Landing & Marketing

**Purpose**: Marketing landing page with feature showcase and call-to-action
**Access**: Public (unauthenticated users)
**Redirect Logic**: Authenticated users automatically redirected to `/create`

**Key Features**:
- Hero section with value proposition and "Create Your Business Voice Assistant" heading
- Feature showcase with icons and descriptions (calendar, voice, automation)
- Pricing preview with links to `/plans` page
- Calendly integration for custom plan inquiries
- Responsive design with animated elements using Framer Motion

**Components Used**:
- `LeftFloatingElements`, `RightFloatingElements` for visual enhancement
- Heroicons for feature illustrations (CalendarIcon, BuildingOfficeIcon, etc.)
- Motion animations for smooth page transitions

**Backend Dependencies**: None (static marketing content)

### 2. **Authentication System** (`/login`, `/auth/callback`)

#### Login Page (`/login`)
**Purpose**: Google OAuth authentication entry point
**Access**: Public (redirects authenticated users to dashboard)

**Key Features**:
- "Sign in with Google" button with FaGoogle icon and proper branding
- Clear value proposition for signing up
- Responsive design with theme support
- Automatic redirect for already-authenticated users

**Backend Integration**:
```typescript
// Initiates OAuth flow
window.location.href = `${BASE_URL}/api/auth/google/login?callback=${encodeURIComponent(window.location.origin + '/auth/callback')}`;
```

#### Auth Callback Page (`/auth/callback`)
**Purpose**: Handle OAuth redirect and complete authentication
**Access**: Public (OAuth callback endpoint)

**Flow**:
1. Receives `?login=success` from backend OAuth callback
2. Calls `checkAuthStatus()` to fetch user data from `/api/auth/user/me`
3. Stores user data in localStorage with 30-minute expiration
4. Redirects to dashboard on success

**Backend Dependencies**:
- `GET /api/auth/google/callback` - OAuth processing
- `GET /api/auth/user/me` - User data retrieval

### 3. **Dashboard Page** (`/dashboard` route) - Main Management Hub

**Purpose**: Central hub for managing AI assistants with analytics
**Access**: Protected (requires authentication)
**Key Component**: Main application interface after login

**Core Features**:

#### Assistant Management Grid
- **Visual Card Layout**: Each assistant displayed as an interactive card with status indicators
- **Real-time Status**: Active/inactive status with visual indicators and accessibility checks
- **Quick Actions**: Edit, view details, manage settings via card buttons
- **Analytics Preview**: Calls, bookings, conversion rates (plan-dependent display)

#### Subscription Status Integration
```typescript
interface SubscriptionStatus {
  plan: string;                    // "none", "basic", "pro"
  subscription_status: string;     // "active", "inactive", "past_due"
  max_agents: number;             // Plan-based limits
  allowed_addons: string[];       // Available features
  can_create_agent: boolean;      // Creation permission
}
```

#### Plan-Based Feature Display
- **Basic Plan**: Shows today's analytics only, 1 agent limit, basic features
- **Pro Plan**: Shows 30-day analytics, 3 agent limit, advanced features (CRM, WhatsApp)
- **No Plan**: Prompts for subscription with feature limitations and upgrade paths

#### Assistant Card Information
```typescript
interface AssistantCard {
  id: number;
  agent_name: string;
  business_name: string;
  twilio_number: string;
  status: "active" | "suspended" | "inactive";
  is_accessible: boolean;
  analytics?: {
    period: "today" | "last_30_days";
    total_calls: number;
    total_bookings: number;
    conversion_rate?: number;     // Pro plan only
    avg_call_duration?: number;   // Pro plan only
  };
}
```

**Backend Dependencies**:
- `GET /api/my-agents` - Main dashboard data with subscription info and analytics
- `GET /api/assistants?user_id={id}` - Fallback assistant listing
- `PATCH /api/assistant/{id}` - Assistant updates

**State Management**:
- Local state for assistant list and loading states
- Real-time updates when returning from assistant creation via navigation state
- Subscription status caching for performance optimization

### 4. **Create Assistant Page** (`/create` route) - Multi-Step AI Configuration

**Purpose**: Comprehensive assistant creation with guided multi-step stepper flow
**Access**: Protected (requires authentication)

**New Multi-Step Architecture**:

#### Step 1: Assistant Registration (Identity Layer)
```typescript
interface AssistantData {
  name: string;                   // Assistant name
  businessName: string;          // Business/company name
  role: AssistantRole;           // Receptionist, Support Agent, Sales Rep, Advanced CRM
  avatar: string;                // Selected avatar from predefined options
  language: string;              // Language selection
  locale: string;                // Locale/region selection
}

type AssistantRole = 'receptionist' | 'support_agent' | 'sales_rep' | 'advanced_crm';
```

**Role-Based Default Features**:
- **Receptionist**: Calls + Booking (basic features)
- **Support Agent**: Calls + Booking + Email Replies
- **Sales Rep**: Calls + Booking + CRM + Analytics
- **Advanced CRM**: All features unlocked

#### Step 2: Feature Selection (Plan-Dependent)
```typescript
interface Feature {
  id: string;
  name: string;
  description: string;
  icon: string;
  required: boolean;             // Always included with role
  available: boolean;            // Available with current plan
  locked: boolean;               // Requires Pro plan
}

interface SelectedFeatures {
  [featureId: string]: boolean;  // Feature toggle states
}
```

**Dynamic Feature Cards**:
- **Role-Based Defaults**: Each role preloads appropriate feature bundle
- **Plan-Aware Display**: Features show locked state with "PRO" badges for Basic users
- **Visual Indicators**: Enabled features highlighted, locked features grayed out
- **Feature Categories**: Calls, SMS, WhatsApp, Email, Booking, CRM, Analytics

#### Step 3: Voice & Behavior Setup
```typescript
interface VoiceSettings {
  voiceType: 'basic' | 'premium';
  voiceId: string;               // Specific voice selection
  personality: PersonalityPreset;
  customRules: ResponseRule[];   // Edge-case response rules
  knowledgeSources: KnowledgeSource[]; // Documents and URLs
}

interface ResponseRule {
  id: string;
  trigger: string;               // When to apply this rule
  response: string;              // Custom response text
}

interface KnowledgeSource {
  id: string;
  type: 'document' | 'url';
  name: string;
  content?: File;                // For uploaded files
  url?: string;                  // For URL sources
}
```

**Voice Selection**:
- **Basic Voices**: Standard quality included in all plans
- **Premium Voices**: High-quality voices for Pro users
- **Voice Preview**: Audio samples for voice selection
- **Personality Presets**: Friendly, Formal, Neutral, Custom

**Knowledge Base Integration**:
- **Document Upload**: PDF files for business knowledge (RAG system)
- **URL Sources**: Web pages and documents via URL
- **File Management**: Add, edit, remove knowledge sources
- **Validation**: File type and size checking

#### Live Preview Card (Persistent)
```typescript
interface PreviewData {
  avatar: string;
  name: string;
  role: AssistantRole;
  enabledFeatures: string[];
  lockedFeatures: string[];
  voice: string;
}
```

**Real-time Updates**:
- **Live Preview**: Updates as user progresses through steps
- **Feature Status**: Shows enabled/locked features with icons
- **Role Badge**: Displays selected role with appropriate styling
- **Voice Indicator**: Shows selected voice type

#### Context-Based State Management
```typescript
interface CreateAssistantContextType {
  // Step 1 data
  assistantData: AssistantData;
  setAssistantData: (data: AssistantData) => void;
  
  // Step 2 data
  selectedFeatures: SelectedFeatures;
  setSelectedFeatures: (features: SelectedFeatures) => void;
  
  // Step 3 data
  voiceSettings: VoiceSettings;
  setVoiceSettings: (settings: VoiceSettings) => void;
  
  // Helper functions
  getCurrentRole: () => AssistantRole;
  canUseFeature: (featureId: string) => boolean;
  getPreviewData: () => PreviewData;
}
```

**Stepper Navigation**:
- **Progress Indicator**: Visual stepper with step descriptions
- **Validation**: Each step validates before allowing progression
- **Back/Next**: Smooth navigation between steps
- **Form Persistence**: Data maintained across step navigation

**Backend Integration**:
```typescript
// Enhanced creation endpoint
POST /api/register/assistant
Content-Type: multipart/form-data

FormData includes:
- assistantData: JSON string of Step 1 data
- selectedFeatures: JSON string of Step 2 data  
- voiceSettings: JSON string of Step 3 data
- files[]: Knowledge source documents
```

**Success Flow**:
1. Multi-step form completion with validation
2. Comprehensive data submission with all steps
3. Loading state with progress indication
4. Backend processing (may take time for large files)
5. Success modal with assistant details and next steps
6. Navigation to dashboard with new assistant state

### 5. **Schedule Management Page** (`/schedule` route) - Appointment System

**Purpose**: Calendar interface for viewing and managing appointments
**Access**: Protected (requires authentication)

**Calendar Features**:

#### Multi-View Calendar
- **Day View**: Detailed hourly schedule for selected date
- **Week View**: 7-day overview with appointment blocks
- **Month View**: Monthly calendar with appointment indicators

#### Appointment Display
```typescript
interface Appointment {
  id: string;
  customerName: string;
  details?: string;
  date: string;           // ISO date format
  time: string;           // "HH:MM" format
  duration?: number;      // Minutes
  created_at: string;
}
```

#### Time Slot Management
```typescript
interface TimeSlot {
  id: string;
  date: string;
  time: string;
  isBooked: boolean;
}
```

#### Business Hours Integration
- **Configurable Hours**: Based on assistant settings (start_time, end_time)
- **Available Days**: Respects assistant's working days configuration
- **Slot Duration**: Customizable appointment lengths (15, 30, 60 minutes)

**Backend Dependencies**:
- `GET /api/assistants?user_id={id}` - Get user's assistants for dropdown
- `GET /api/bookings/{assistantId}?start_date={date}&end_date={date}` - Booking data and slot matrix
- `GET /api/slots/{assistantId}?date={date}` - Available time slots for specific date

**Real-time Features**:
- **Live Updates**: Polling for new bookings every 60 seconds
- **Conflict Prevention**: Real-time slot availability checking
- **Multi-assistant Support**: Switch between different assistants via dropdown

### 6. **Subscription Plans Page** (`/plans` route) - Payment Management

**Purpose**: Subscription selection and management interface
**Access**: Public with authentication-aware features

**Plan Structure**:

#### Basic Plan ($25/month)
```typescript
{
  id: 'basic',
  name: 'Basic',
  price: '$25',
  features: [
    '1 voice assistant',
    '📞 Voice calls & responses',
    '📚 Knowledge base integration',
    'Business hours support',
    'Today-only analytics',
    'Standard voice quality'
  ]
}
```

#### Pro Plan ($50/month)
```typescript
{
  id: 'pro', 
  name: 'Pro',
  price: '$50',
  features: [
    '3 voice assistants',
    '📞 Voice calls & responses', 
    '📚 Knowledge base integration',
    '💬 Chat/WhatsApp integration',
    '📅 Booking & scheduling',
    '👥 CRM integration',
    '📊 Advanced analytics (30 days)',
    'Priority support',
    'Premium voice quality'
  ]
}
```

#### Custom Plan
- **Calendly Integration**: Direct scheduling for enterprise needs
- **Custom Features**: Tailored solutions for large businesses
- **Contact Sales**: Integration with support calendar

**Subscription Management**:

#### Current Subscription Display
Shows user's current plan status with upgrade/downgrade options

#### Stripe Integration
```typescript
// Checkout session creation
const response = await fetch(`${API_BASE_URL}/stripe/create-checkout-session`, {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ plan_id: selectedPlan })
});

// Customer portal access
const response = await fetch(`${API_BASE_URL}/stripe/create-customer-portal-session`, {
  method: 'POST',
  credentials: 'include'
});
```

**Visual States**:
- **Current Plan Highlighting**: Active plan clearly marked with checkmark
- **Upgrade/Downgrade Options**: Available plan changes with clear CTAs
- **Feature Comparison**: Clear feature matrix display with icons
- **Loading States**: During payment processing with spinner feedback

### 7. **Navigation System** (`Navbar` component)

**Purpose**: Global navigation with authentication and theme management
**Responsive Design**: Mobile-first with hamburger menu

**Authentication-Aware Navigation**:

#### Unauthenticated State
- **Brand Logo**: Links to home page with VocalHost branding
- **Sign In Button**: Google OAuth initiation with FaGoogle icon
- **Public Links**: Plans page, Features (scroll-based navigation)
- **Theme Toggle**: Dark/light mode switching with sun/moon icons

#### Authenticated State
```typescript
interface NavbarUser {
  id: number;
  name: string;        // Real name from Google OAuth
  email: string;       // Google account email
}
```

**User Menu Dropdown**:
- **User Info Display**: Name and email with user icon
- **Dashboard Link**: Quick access to main interface
- **Create Assistant**: Direct creation access
- **Schedule**: Calendar view access
- **Manage Subscription**: Stripe customer portal integration
- **Sign Out**: Logout with session cleanup

**Mobile Navigation**:
- **Hamburger Menu**: Collapsible sidebar navigation (Bars3Icon/XMarkIcon)
- **Touch-Optimized**: Large tap targets for mobile (min 44px)
- **Smooth Animations**: Framer Motion transitions for menu states

## 🔐 Authentication & State Management

### AuthContext Implementation

**User State Management**:
```typescript
interface User {
  id: number;
  name: string;           // Real name from Google OAuth
  email: string;          // Google account email
  stripe_customer_id?: string;
  expiresAt?: number;     // Session expiration timestamp
}
```

**Session Persistence**:
- **localStorage**: User data cached with 30-minute expiration using `AUTH_STORAGE_KEY`
- **Automatic Logout**: Token expiration handling with periodic cleanup
- **Background Checking**: Check expiration every 60 seconds with timer

**Authentication Flow**:
1. **Initial Load**: Check localStorage for existing session and validate expiration
2. **OAuth Callback**: Process `?login=success` parameter from backend redirect
3. **Backend Validation**: Call `/api/auth/user/me` for complete user data
4. **Session Storage**: Store with calculated expiration timestamp
5. **Periodic Cleanup**: Background timer checks and clears expired sessions

### State Management Patterns

**Context Providers**:
- `AuthProvider`: User authentication, session management, and logout functionality
- `ThemeProvider`: Dark/light theme with localStorage persistence
- `CreateAssistantProvider`: Multi-step form state management with live preview updates

**Local State Management**:
- **Component State**: Page-specific data (assistants, bookings, subscriptions)
- **Loading States**: Comprehensive loading feedback with spinners and skeletons
- **Error Handling**: User-friendly error messages with retry options and clear CTAs

## 💳 Subscription & Payment Integration

### Stripe Checkout Integration

**Payment Flow**:
1. **Plan Selection**: User clicks subscribe button on plans page
2. **Authentication Check**: Verify user login status via AuthContext
3. **Checkout Session**: Create Stripe session with plan metadata
4. **Redirect**: Send user to Stripe Checkout hosted page
5. **Success Handling**: Return to dashboard with updated subscription status

**Customer Portal Integration**:
```typescript
const handleManageSubscription = async () => {
  const response = await fetch(`${API_BASE_URL}/stripe/create-customer-portal-session`, {
    method: 'POST',
    credentials: 'include'
  });
  
  const data = await response.json();
  window.open(data.url, '_blank');
};
```

### Subscription Status Display

**Plan-Based UI Rendering**:
- **Feature Gates**: Hide/show features based on user's current plan
- **Upgrade Prompts**: Contextual subscription upgrade suggestions with pricing
- **Usage Limits**: Visual indicators of plan limits (agents, features) with progress bars

**Real-time Subscription Updates**:
- **Webhook Processing**: Backend webhooks update subscription status automatically
- **UI Refresh**: Frontend polls for subscription changes on page focus
- **Immediate Feedback**: Subscription changes reflected instantly in navigation and dashboards

## 🌐 API Integration & Error Handling

### HTTP Client Configuration

**Base Configuration**:
```typescript
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// All requests include credentials for session handling
fetch(url, {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' }
});
```

**Error Handling Patterns**:
```typescript
try {
  const response = await fetch(endpoint);
  
  if (!response.ok) {
    if (response.status === 401) {
      // Redirect to login
      logout();
      navigate('/login');
    } else if (response.status === 403) {
      // Subscription limit reached
      setError('Subscription upgrade required');
    }
    throw new Error(`HTTP ${response.status}`);
  }
  
  return await response.json();
} catch (error) {
  setError('Operation failed. Please try again.');
}
```

### Real-time Data Management

**Polling Strategies**:
- **Dashboard**: Poll every 30 seconds for assistant updates
- **Schedule**: Poll every 60 seconds for new bookings
- **Analytics**: Update on page focus and navigation events

**State Synchronization**:
- **Cross-page Updates**: Navigation state carries new assistant data
- **Cache Management**: Smart caching with invalidation strategies
- **Optimistic Updates**: Immediate UI feedback for user actions

## 🎨 UI/UX Design System

### Responsive Design

**Breakpoint Strategy**:
- **Mobile First**: Default styles for mobile devices (320px+)
- **Tablet** (`sm:`): Enhanced layouts for tablet viewports (640px+)
- **Desktop** (`md:`, `lg:`): Full desktop experience (768px+, 1024px+)
- **Large Screens** (`xl:`, `2xl:`): Optimized for large displays (1280px+, 1536px+)

**Component Responsiveness**:
```typescript
// Responsive grid system
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {assistants.map(assistant => (
    <AssistantCard key={assistant.id} assistant={assistant} />
  ))}
</div>
```

### Theme System Implementation

**Dynamic Theme Application**:
```typescript
const themeClasses = {
  background: theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50',
  card: theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
  text: theme === 'dark' ? 'text-white' : 'text-gray-900',
  textMuted: theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
};
```

**Theme Persistence**:
- **localStorage**: Theme preference saved across sessions
- **System Preference**: Detect system dark/light mode preference
- **Smooth Transitions**: Animated theme changes with CSS transitions

### Animation System

**Page Transitions**:
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  {pageContent}
</motion.div>
```

**Interactive Elements**:
- **Hover Effects**: Subtle scale and color transitions (`hover:scale-105`)
- **Button Press**: Tactile feedback with scale animations (`whileTap={{ scale: 0.95 }}`)
- **Loading States**: Skeleton screens and progress indicators

### Button Text Readability System

**Comprehensive Button Overrides**:
The application includes extensive CSS overrides to ensure button text readability across all themes and color combinations.

**Key Features**:
- **White Text on Dark Backgrounds**: All buttons with dark/purple backgrounds force `color: #ffffff !important`
- **Comprehensive Coverage**: Covers all button states (hover, focus, active, disabled)
- **Theme Consistency**: Works across both light and dark themes
- **Gradient Support**: Special handling for gradient buttons with proper contrast

**CSS Override Patterns**:
```css
/* Primary gradient buttons - force white text */
.bg-gradient-to-r.from-primary-500.to-secondary-500,
.bg-gradient-to-r.from-primary-400.to-secondary-400 {
  color: #ffffff !important;
}

/* Any button with dark backgrounds - force white text */
button[class*="bg-primary"],
button[class*="bg-secondary"],
button[class*="bg-purple"],
button[class*="bg-pink"] {
  color: #ffffff !important;
}

/* Nested element coverage */
button[class*="bg-primary"] span,
button[class*="bg-primary"] div {
  color: #ffffff !important;
}
```

**Supported Button Types**:
- Primary/Secondary solid buttons (all shades 500-900)
- Gradient buttons (primary-to-secondary, purple-to-pink)
- Dark background buttons (slate, gray, zinc, neutral 800+)
- All interactive states (hover, focus, active, disabled)
- Nested elements (spans, divs within buttons)

**Benefits**:
- **Accessibility**: Ensures proper contrast ratios for all button text
- **Consistency**: Uniform text color across all dark button variants
- **Maintainability**: Centralized CSS overrides prevent individual component fixes
- **Theme Safety**: Works with existing color palette without modification

## 🔧 Environment Variables

The frontend expects these environment variables:
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
```

## 📱 Frontend UI Components

### Multi-Step Stepper Components

#### CreateAssistantContext
- **Purpose**: Centralized state management for multi-step assistant creation
- **Features**: Step data persistence, validation helpers, live preview updates
- **Usage**: Wraps entire CreateAssistant page for shared state access

#### Step Components
- **Step1Registration**: Assistant identity setup (name, business, role, avatar, language)
- **Step2Features**: Dynamic feature selection with plan-aware display
- **Step3VoiceBehavior**: Voice selection, personality, custom rules, knowledge sources
- **PreviewCard**: Live preview component with real-time updates

#### Stepper Navigation
- **Progress Indicator**: Visual stepper with step descriptions and completion status
- **Validation System**: Step-by-step validation before allowing progression
- **Smooth Transitions**: Framer Motion animations between steps

### Navigation Bar Updates
- **When Signed In**: Shows user name, email, Manage Subscription button, Sign Out
- **When Signed Out**: Shows "Sign in with Google" button
- **Mobile Menu**: Responsive design with all authentication options

### User Interface Elements
- **Google Sign-In Button**: Prominent placement in navbar and login page
- **User Info Display**: Name and email shown when authenticated
- **Manage Subscription**: Direct access to Stripe Customer Portal
- **Error Handling**: User-friendly error messages and feedback
- **Button Text Readability**: Comprehensive CSS overrides for proper contrast

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

## 🎯 Key User Flows

### New User Onboarding Journey
1. **Landing Page**: Value proposition and feature overview with clear CTAs
2. **Sign Up**: Google OAuth authentication with seamless redirect flow
3. **Plan Selection**: Choose subscription tier with feature comparison
4. **Assistant Creation**: Multi-step guided configuration with live preview:
   - **Step 1**: Assistant identity setup (name, business, role, avatar)
   - **Step 2**: Feature selection with plan-aware display and upgrade prompts
   - **Step 3**: Voice & behavior configuration with knowledge base setup
   - **Live Preview**: Real-time assistant preview throughout the process
5. **Dashboard**: View created assistant and analytics with usage tips

### Existing User Management Flow
1. **Dashboard**: View all assistants and performance metrics with quick actions
2. **Assistant Editing**: Update configuration and features with live preview
3. **Schedule Management**: View and manage appointments with calendar interface
4. **Subscription Management**: Upgrade/downgrade plans via Stripe with immediate effects

### Mobile User Experience
1. **Responsive Navigation**: Touch-optimized menu system with large tap targets
2. **Mobile Dashboard**: Card-based assistant management with swipe actions
3. **Quick Actions**: Streamlined mobile workflows with minimal taps
4. **Touch-Friendly Forms**: Optimized input interfaces with mobile keyboards

---

**Note**: This frontend is designed as a comprehensive SaaS application interface with subscription-aware features, real-time data management, and a professional user experience. It integrates deeply with the backend for authentication, subscription management, and business operations while maintaining a responsive, accessible, and performant user interface across all devices. The application follows modern React patterns and provides a scalable foundation for future feature expansion.
