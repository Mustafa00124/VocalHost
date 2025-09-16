"""
Text-based demo agent using OpenAI Agents SDK with multi-agent routing
"""
import os
import json
import logging
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from agents import Agent, Runner, function_tool, SQLiteSession
from .agent_creators import create_chat_agent, create_policy_agent, create_tool_agent
from .websocket_handler import websocket_handler

# Load environment variables from .env file with override
load_dotenv(override=True)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Tool definitions (same as voice agent)
@function_tool
def book_appointment(
    customer_name: str,
    service: str,
    date: str,
    time: str
) -> str:
    """Book an appointment for a customer - only requires name, service, date, and time"""
    try:
        # Broadcast calendar update to frontend
        message = {
            "type": "calendar_update",
            "action": "add_booking",
            "agent_type": "salon",
            "data": {
                "time": time,
                "date": date,
                "customer_name": customer_name,
                "id": f"{date}_{time}_{customer_name}",
                "service": service
            }
        }
        websocket_handler.broadcast_message(message)
        return f"✅ Appointment booked for {customer_name} - {service} on {date} at {time}. We'll call you to confirm the details closer to your appointment date."
    except Exception as e:
        return f"✅ Appointment booked for {customer_name} - {service} on {date} at {time}. (Note: Calendar update failed: {str(e)})"

@function_tool
def check_availability(service: str, date: str) -> str:
    """Check availability for a specific service and date in January 2025"""
    # Convert various date formats to January 2025 format
    if "january" in date.lower() or "jan" in date.lower():
        month_year = "January 2025"
    elif "wednesday" in date.lower() or "wed" in date.lower():
        month_year = "January 2025"
    elif "thursday" in date.lower() or "thu" in date.lower():
        month_year = "January 2025"
    elif "friday" in date.lower() or "fri" in date.lower():
        month_year = "January 2025"
    elif "saturday" in date.lower() or "sat" in date.lower():
        month_year = "January 2025"
    elif "sunday" in date.lower() or "sun" in date.lower():
        month_year = "January 2025"
    elif "monday" in date.lower() or "mon" in date.lower():
        month_year = "January 2025"
    elif "tuesday" in date.lower() or "tue" in date.lower():
        month_year = "January 2025"
    else:
        month_year = "January 2025"
    
    return f"📅 Available times for {service} on {date} in {month_year}: 9:00 AM, 11:00 AM, 2:00 PM, 4:00 PM"

@function_tool
def cancel_booking(customer_name: str, date: str, time: str) -> str:
    """Cancel an existing booking"""
    try:
        # Broadcast calendar update to frontend
        message = {
            "type": "calendar_update",
            "action": "remove_booking",
            "agent_type": "salon",  # This would need to be dynamic based on business type
            "data": {
                "time": time,
                "date": date,
                "customer_name": customer_name,
                "id": f"{date}_{time}_{customer_name}",
                "service": "Cancelled"
            }
        }
        websocket_handler.broadcast_message(message)
        return f"❌ Booking cancelled for {customer_name} on {date} at {time}. You will receive a confirmation email shortly."
    except Exception as e:
        return f"❌ Booking cancelled for {customer_name} on {date} at {time}. (Note: Calendar update failed: {str(e)})"

@function_tool
def modify_booking(customer_name: str, old_date: str, old_time: str, new_date: str, new_time: str) -> str:
    """Modify an existing booking"""
    try:
        # First cancel the old booking
        cancel_message = {
            "type": "calendar_update",
            "action": "remove_booking",
            "agent_type": "salon",
            "data": {
                "time": old_time,
                "date": old_date,
                "customer_name": customer_name,
                "id": f"{old_date}_{old_time}_{customer_name}",
                "service": "Modified"
            }
        }
        websocket_handler.broadcast_message(cancel_message)
        
        # Then add the new booking
        add_message = {
            "type": "calendar_update",
            "action": "add_booking",
            "agent_type": "salon",
            "data": {
                "time": new_time,
                "date": new_date,
                "customer_name": customer_name,
                "id": f"{new_date}_{new_time}_{customer_name}",
                "service": "Modified Appointment"
            }
        }
        websocket_handler.broadcast_message(add_message)
        return f"🔄 Booking modified for {customer_name} from {old_date} at {old_time} to {new_date} at {new_time}. You will receive a confirmation email shortly."
    except Exception as e:
        return f"🔄 Booking modified for {customer_name} from {old_date} at {old_time} to {new_date} at {new_time}. (Note: Calendar update failed: {str(e)})"

@function_tool
def list_bookings(customer_name: str) -> str:
    """List all bookings for a customer"""
    # In a real app, this would query a database
    return f"📋 Bookings for {customer_name}:\n- Wednesday 2:00 PM: Hair Cut\n- Friday 11:00 AM: Manicure\n- Next Monday 3:00 PM: Facial"

@function_tool
def get_menu() -> str:
    """Get the current menu"""
    return "🍽️ Today's Menu:\n- Appetizers: Caesar Salad, Soup of the Day\n- Mains: Grilled Salmon, Chicken Parmesan, Vegetarian Pasta\n- Desserts: Tiramisu, Chocolate Cake"

@function_tool
def make_reservation(
    customer_name: str,
    date: str,
    time: str
) -> str:
    """Make a restaurant reservation - only requires name, date, and time"""
    try:
        # Broadcast calendar update to frontend
        message = {
            "type": "calendar_update",
            "action": "add_booking",
            "agent_type": "restaurant",
            "data": {
                "time": time,
                "date": date,
                "customer_name": customer_name,
                "id": f"{date}_{time}_{customer_name}",
                "service": "Restaurant Reservation"
            }
        }
        websocket_handler.broadcast_message(message)
        return f"🍽️ Reservation confirmed for {customer_name} on {date} at {time}. We'll call you to confirm the details closer to your reservation date."
    except Exception as e:
        return f"🍽️ Reservation confirmed for {customer_name} on {date} at {time}. (Note: Calendar update failed: {str(e)})"

@function_tool
def get_store_hours() -> str:
    """Get store operating hours"""
    return "🕒 Store Hours:\nMonday-Friday: 9:00 AM - 8:00 PM\nSaturday: 10:00 AM - 6:00 PM\nSunday: 12:00 PM - 5:00 PM"

@function_tool
def process_order(
    customer_name: str,
    items: str
) -> str:
    """Process an e-commerce order - only requires name and items"""
    return f"🛒 Order processed for {customer_name}:\nItems: {items}\nWe'll contact you shortly to confirm payment and shipping details."

@function_tool
def track_order(order_id: str) -> str:
    """Track an existing order"""
    return f"📦 Order {order_id} status: Shipped - Expected delivery: 2-3 business days"

@function_tool
def get_product_info(product_name: str) -> str:
    """Get information about a specific product"""
    return f"📱 Product: {product_name}\nPrice: $299.99\nIn Stock: Yes\nDescription: High-quality product with excellent reviews"

@function_tool
def schedule_dental_appointment(
    patient_name: str,
    procedure: str,
    date: str,
    time: str
) -> str:
    """Schedule a dental appointment - only requires name, procedure, date, and time"""
    try:
        # Broadcast calendar update to frontend
        message = {
            "type": "calendar_update",
            "action": "add_booking",
            "agent_type": "dentist",
            "data": {
                "time": time,
                "date": date,
                "customer_name": patient_name,
                "id": f"{date}_{time}_{patient_name}",
                "service": procedure
            }
        }
        websocket_handler.broadcast_message(message)
        return f"🦷 Dental appointment scheduled for {patient_name} - {procedure} on {date} at {time}. We'll call you to confirm insurance and other details."
    except Exception as e:
        return f"🦷 Dental appointment scheduled for {patient_name} - {procedure} on {date} at {time}. (Note: Calendar update failed: {str(e)})"

@function_tool
def check_dental_insurance(patient_name: str, insurance_provider: str) -> str:
    """Check dental insurance coverage"""
    return f"🏥 Insurance verification for {patient_name} with {insurance_provider}: Coverage confirmed for routine cleaning and basic procedures"

@function_tool
def get_dental_services() -> str:
    """Get available dental services"""
    return "🦷 Available Services:\n- Routine Cleaning ($150)\n- Filling ($200)\n- Root Canal ($800)\n- Crown ($1200)\n- Teeth Whitening ($300)"

@function_tool
def create_support_ticket(
    customer_name: str,
    issue_type: str,
    description: str
) -> str:
    """Create a customer support ticket - only requires name, issue type, and description"""
    return f"🎫 Support ticket created for {customer_name}:\nIssue: {issue_type}\nDescription: {description}\nTicket ID: SUPPORT-{hash(description) % 10000}\nWe'll contact you within 24 hours to resolve this issue."

@function_tool
def check_ticket_status(ticket_id: str) -> str:
    """Check the status of a support ticket"""
    return f"🎫 Ticket {ticket_id} status: In Progress - Assigned to agent Sarah. Expected resolution: 24-48 hours"

@function_tool
def escalate_ticket(ticket_id: str, reason: str) -> str:
    """Escalate a support ticket to higher priority"""
    return f"🚨 Ticket {ticket_id} escalated to senior support. Reason: {reason}. Priority updated to HIGH."

# Agent configurations - Lightweight chat agents
AGENT_CONFIGS = {
    "restaurant": {
        "name": "Restaurant Assistant",
        "greeting": "🍽️ Welcome to Bella Vista Restaurant! I can help you with reservations, menu questions, or any dining inquiries. How can I assist you today?",
        "emoji": "🍽️"
    },
    "salon": {
        "name": "Salon Assistant", 
        "greeting": "💇‍♀️ Welcome to Glamour Studio! I can help you book appointments, check our services, or answer any beauty-related questions. How can I help you today?",
        "emoji": "💇‍♀️"
    },
    "ecommerce": {
        "name": "E-commerce Assistant",
        "greeting": "🛒 Welcome to StyleHub Online Store! I can help you with orders, product information, shipping, or any shopping questions. How can I assist you today?",
        "emoji": "🛒"
    },
    "dentist": {
        "name": "Dental Assistant",
        "greeting": "🦷 Welcome to Bright Smile Dental Practice! I can help you schedule appointments, check insurance, or answer dental health questions. How can I help you today?",
        "emoji": "🦷"
    },
    "support": {
        "name": "Customer Support",
        "greeting": "🎫 Welcome to TechSupport Solutions! I'm here to help you with technical issues, account questions, or any support needs. How can I assist you today?",
        "emoji": "🎫"
    }
}

class DemoTextAgent:
    """Text-based demo agent using OpenAI Agents SDK with multi-agent routing"""
    
    def __init__(self):
        logger.info("🚀 Initializing DemoTextAgent with multi-agent ecosystem...")
        
        # Debug API key loading
        openai_key = os.getenv("OPENAI_API_KEY")
        openai_key_alt = os.getenv("OPENAI_KEY")
        logger.info(f"🔍 OPENAI_API_KEY found: {bool(openai_key)}")
        logger.info(f"🔍 OPENAI_KEY found: {bool(openai_key_alt)}")
        
        self.api_key = openai_key or openai_key_alt or ""
        if not self.api_key:
            logger.error("❌ No OpenAI API key found!")
            raise ValueError("OpenAI API key not found. Please set OPENAI_API_KEY or OPENAI_KEY environment variable.")
        
        logger.info(f"🔑 Text agent API key loaded: {self.api_key[:10]}...")
        
        # Initialize session storage for conversation memory
        self.sessions: Dict[str, SQLiteSession] = {}
        logger.info("💾 Session memory initialized")
        
        # Create multi-agent ecosystem for each business type
        logger.info("🏗️ Creating multi-agent ecosystem...")
        self.agent_ecosystems = {}
        
        for agent_type, config in AGENT_CONFIGS.items():
            logger.info(f"  🏢 Creating ecosystem for {agent_type}...")
            try:
                # Create the three specialized agents
                chat_agent = create_chat_agent(agent_type)
                policy_agent = create_policy_agent(agent_type)
                tool_agent = create_tool_agent(agent_type)
                
                # Set up handoffs
                chat_agent.handoffs = [
                    policy_agent,  # For policy questions
                    tool_agent     # For tool execution
                ]
                
                # Policy and tool agents hand back to chat
                policy_agent.handoffs = [chat_agent]
                tool_agent.handoffs = [chat_agent]
                
                self.agent_ecosystems[agent_type] = {
                    "chat": chat_agent,
                    "policy": policy_agent,
                    "tool": tool_agent
                }
                
                logger.info(f"  ✅ {agent_type} ecosystem created successfully")
            except Exception as e:
                logger.error(f"  ❌ Failed to create {agent_type} ecosystem: {e}")
                raise
        
        # Create triage agent for routing between business types
        logger.info("🎯 Creating triage agent for business type routing...")
        try:
            self.triage_agent = Agent(
                name="Triage Agent",
                instructions="""You are a triage agent that routes customer requests to the appropriate business type.

Available business types:
- restaurant: For dining reservations, menu questions, restaurant services
- salon: For beauty appointments, salon services, hair/nail bookings  
- ecommerce: For online shopping, product orders, shipping, returns
- dentist: For dental appointments, oral health, dental procedures
- support: For technical issues, account problems, general customer service

Analyze the customer's request and determine which business type should handle it. 
Respond with just the business type (e.g., "restaurant", "salon", "ecommerce", "dentist", "support").

If the request is unclear or could be handled by multiple business types, choose the most appropriate one based on context.""",
                handoffs=[agent["chat"] for agent in self.agent_ecosystems.values()]
            )
            logger.info("✅ Triage agent created successfully")
        except Exception as e:
            logger.error(f"❌ Failed to create triage agent: {e}")
            raise
        
        # Keep backward compatibility
        self.agents = {agent_type: ecosystem["chat"] for agent_type, ecosystem in self.agent_ecosystems.items()}
        
        logger.info(f"🎉 Successfully initialized multi-agent ecosystem:")
        logger.info(f"  🎯 1 triage agent for business routing")
        logger.info(f"  🏢 {len(self.agent_ecosystems)} business ecosystems")
        logger.info(f"  🤖 {len(self.agent_ecosystems) * 3} total agents (chat, policy, tool per business)")
    
    def get_session(self, session_id: str) -> SQLiteSession:
        """Get or create a session for the given session_id"""
        if session_id not in self.sessions:
            self.sessions[session_id] = SQLiteSession(session_id)
            logger.info(f"💾 Created new session: {session_id}")
        return self.sessions[session_id]
    
    async def process_text_message(self, message: str, agent_type: str = None, session_id: str = "default") -> str:
        """Process a text message using intelligent multi-agent routing with user feedback"""
        logger.info(f"💬 Processing message: '{message[:50]}...' with agent_type: {agent_type}, session_id: {session_id}")
        
        try:
            # Set the API key as environment variable
            original_key = os.getenv("OPENAI_API_KEY")
            logger.info(f"🔧 Setting OPENAI_API_KEY environment variable...")
            os.environ["OPENAI_API_KEY"] = self.api_key
            
            try:
                # If no agent_type specified, use triage agent for intelligent routing
                if agent_type is None or agent_type == "auto":
                    logger.info("🎯 Using triage agent for intelligent routing...")
                    
                    # Get session for conversation memory
                    session = self.get_session(session_id)
                    logger.info(f"💾 Using session: {session_id}")
                    
                    result = await Runner.run(self.triage_agent, message, session=session)
                    logger.info(f"✅ Triage agent completed, final agent: {result.current_agent.name if hasattr(result, 'current_agent') else 'Unknown'}")
                    return result.final_output
                
                # If specific agent_type requested, use that agent's chat agent
                elif agent_type in self.agent_ecosystems:
                    logger.info(f"🤖 Using {agent_type} chat agent...")
                    chat_agent = self.agent_ecosystems[agent_type]["chat"]
                    
                    # Get session for conversation memory
                    session = self.get_session(session_id)
                    logger.info(f"💾 Using session: {session_id}")
                    
                    logger.info(f"🚀 Calling Runner.run() with chat agent and session...")
                    result = await Runner.run(chat_agent, message, session=session)
                    logger.info(f"✅ Chat agent completed successfully")
                    logger.info(f"📝 Response length: {len(result.final_output) if result.final_output else 0} characters")
                    return result.final_output
                
                else:
                    logger.error(f"❌ Invalid agent type '{agent_type}'. Available: {list(self.agent_ecosystems.keys())}")
                    return f"Error: Invalid agent type '{agent_type}'. Available types: {list(self.agent_ecosystems.keys())}"
                
            finally:
                # Restore original API key
                logger.info(f"🔄 Restoring original API key...")
                if original_key:
                    os.environ["OPENAI_API_KEY"] = original_key
                elif "OPENAI_API_KEY" in os.environ:
                    del os.environ["OPENAI_API_KEY"]
            
        except Exception as e:
            logger.error(f"❌ Error processing text message: {e}")
            logger.error(f"❌ Exception type: {type(e).__name__}")
            import traceback
            logger.error(f"❌ Traceback: {traceback.format_exc()}")
            return f"I apologize, but I encountered an error processing your message: {str(e)}"
    
    async def process_text_message_with_routing(self, message: str, session_id: str = "default") -> str:
        """Process a text message with automatic multi-agent routing"""
        logger.info(f"🎯 Processing message with intelligent routing: '{message[:50]}...'")
        return await self.process_text_message(message, agent_type=None, session_id=session_id)
    
    def get_greeting(self, agent_type: str) -> str:
        """Get greeting message for agent type"""
        if agent_type in AGENT_CONFIGS:
            return AGENT_CONFIGS[agent_type]["greeting"]
        return "Hello! How can I help you today?"
    
    def get_available_agents(self) -> list:
        """Get list of available agent types"""
        return list(self.agent_ecosystems.keys())
    
    def get_agent_info(self, agent_type: str) -> dict:
        """Get information about a specific agent"""
        if agent_type in AGENT_CONFIGS:
            config = AGENT_CONFIGS[agent_type]
            return {
                "name": config["name"],
                "greeting": config["greeting"],
                "emoji": config.get("emoji", "🤖"),
                "ecosystem": "Multi-agent (chat, policy, tool)",
                "capabilities": [
                    "Customer conversation",
                    "Policy information lookup", 
                    "Tool execution",
                    "Intelligent handoffs"
                ]
            }
        return None
    
    def get_status(self) -> dict:
        """Get status of the text agent"""
        return {
            "api_key_loaded": bool(self.api_key),
            "available_agents": len(self.agent_ecosystems),
            "agent_types": list(self.agent_ecosystems.keys()),
            "ecosystem_type": "Multi-agent with handoffs",
            "total_agents": len(self.agent_ecosystems) * 3,  # chat, policy, tool per business
            "features": [
                "Intelligent routing",
                "Policy lookup with RAG",
                "Tool execution",
                "User feedback during handoffs"
            ]
        }
    
    def get_session_status(self, session_id: str) -> dict:
        """Get status for a specific session"""
        return {
            "session_id": session_id,
            "status": "active",
            "agent_type": "text"
        }

# Global instance
text_agent = DemoTextAgent()