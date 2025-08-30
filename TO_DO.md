# TODO – Subscription Gated Agents Platform

## Phase 1: Core Subscription Gating + Dashboard
- [ ] **Frontend: Add My Agents Dashboard page**  
  - Accessible after login.  
  - Fetch agents from backend (`/api/my-agents`).  
  - Show agent name, type(s), Twilio number, and active/suspended status.  

- [ ] **Frontend: Add Agent Creation Form (with add-on selectors)**  
  - Fields: Agent name, business info, knowledge base upload.  
  - Add-on toggles (Voice, Chat/WhatsApp, Booking, CRM, Analytics).  
  - Validate options based on subscription plan.  

- [ ] **Frontend: Display Plan Limits + Upgrade CTA**  
  - Show allowed agents/features depending on plan (Basic vs Pro).  
  - Add “Upgrade Plan” button → opens Stripe Customer Portal.  

- [ ] **Backend: Extend User model with plan + feature flags**  
  - Add fields: `plan` (`basic`/`pro`), `subscription_status` (`active`/`inactive`).  
  - Optional: `max_agents`, `allowed_addons` JSON for flexibility.  

- [ ] **Backend: Update plan + status from Stripe webhook**  
  - On `customer.subscription.updated`: set user plan + active status.  
  - On `customer.subscription.deleted` or `invoice.payment_failed`: mark inactive.  

- [ ] **Backend: Enforce plan limits on Agent Creation API**  
  - Basic: 1 agent max, Voice/Chat only.  
  - Pro: 3 agents max, all add-ons allowed.  
  - Return error if over limit.  

- [ ] **Backend: Add /api/my-agents endpoint**  
  - Returns all agents owned by logged-in user with fields:  
    ```json
    {
      "agent_name": "Receptionist Alex",
      "twilio_number": "+12345551234",
      "status": "active",
      "features": ["voice", "knowledge_base"]
    }
    ```  

- [ ] **Backend: Enforce subscription status in Twilio call handling**  
  - If agent owner is active → allow AI logic.  
  - If inactive → return TwiML message (“This assistant is unavailable”).  

---

## Phase 2: Add-on UI (placeholders first)
- [ ] **Frontend: Add Voice Add-on toggle in Agent form**  
- [ ] **Frontend: Add Chat/WhatsApp Add-on toggle in Agent form**  
- [ ] **Frontend: Add Booking Add-on toggle in Agent form**  
- [ ] **Frontend: Add CRM Add-on toggle in Agent form**  
- [ ] **Frontend: Add Usage Analytics placeholder (Pro only)**  

---

## Phase 3: Add-on Backend Implementations
- [ ] **Backend: Enforce add-on availability in API**  
  - Block features not allowed by current plan.  

- [ ] **Backend: Implement Booking add-on logic (if incomplete)**  
  - Validate against plan (Basic ❌, Pro ✅).  

- [ ] **Backend: Add CRM module (future)**  
  - Database + API endpoints for managing customer data.  

- [ ] **Backend: Add Analytics collection (Pro only)**  
  - Track calls/chats per agent.  
  - Return usage stats in `/api/my-agents`.  

---

## Phase 4: Infrastructure & Cleanup
- [ ] **Infra: Define plan tiers**  
  - Basic = 1 agent, Voice/Chat only.  
  - Pro = 3 agents, Voice/Chat + Booking + CRM + Analytics.  

- [ ] **Infra: Add feature gating helper functions**  
  - `can_create_agent(user)`  
  - `can_use_addon(user, addon)`  

- [ ] **Infra: Add .env keys for new services as needed**  
  - Example: CRM integrations, analytics storage, etc.  
