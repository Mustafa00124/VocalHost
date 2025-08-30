# TODO – Subscription Gated Agents Platform

## Pending Work

- [ ] **Improve Agent Creation Flow (Frontend + Backend)**  
  - Enhance the “Create Assistant” tab with more detailed options.  
  - Show available add-ons (Voice, Chat/WhatsApp, Booking, CRM, Analytics).  
  - Validate against user’s subscription plan before enabling add-ons.  

- [ ] **Enforce Single Active Subscription per User**  
  - Fix bug where users can create multiple Stripe subscriptions.  
  - Ensure only one active subscription exists per user at a time.  
  - Update checkout session + webhook logic to enforce this.  

- [ ] **Backend: Add Routes for Integrations**  
  - **WhatsApp (Twilio)**: API routes to handle inbound/outbound WhatsApp chat.  
  - **CRM**: Placeholder routes + models for storing customer data, notes, etc.  

- [ ] **Optional Improvements**  
  - Add helper functions for subscription gating (`can_create_agent`, `can_use_addon`).  
  - Provide admin/testing tools to simulate subscription changes without real payments.  
