"""
Text-based demo agent using OpenAI Agents SDK
"""
import os
import json
import logging
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from agents import Agent, Runner, function_tool

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
    time: str,
    phone: str,
    notes: str = ""
) -> str:
    """Book an appointment for a customer"""
    return f"✅ Appointment booked for {customer_name} - {service} on {date} at {time}. Phone: {phone}. Notes: {notes}"

@function_tool
def check_availability(service: str, date: str) -> str:
    """Check availability for a specific service and date"""
    return f"📅 Available times for {service} on {date}: 9:00 AM, 11:00 AM, 2:00 PM, 4:00 PM"

@function_tool
def get_menu() -> str:
    """Get the current menu"""
    return "🍽️ Today's Menu:\n- Appetizers: Caesar Salad, Soup of the Day\n- Mains: Grilled Salmon, Chicken Parmesan, Vegetarian Pasta\n- Desserts: Tiramisu, Chocolate Cake"

@function_tool
def make_reservation(
    customer_name: str,
    party_size: int,
    date: str,
    time: str,
    phone: str,
    special_requests: str = ""
) -> str:
    """Make a restaurant reservation"""
    return f"🍽️ Reservation confirmed for {customer_name} - Party of {party_size} on {date} at {time}. Phone: {phone}. Special requests: {special_requests}"

@function_tool
def get_store_hours() -> str:
    """Get store operating hours"""
    return "🕒 Store Hours:\nMonday-Friday: 9:00 AM - 8:00 PM\nSaturday: 10:00 AM - 6:00 PM\nSunday: 12:00 PM - 5:00 PM"

@function_tool
def process_order(
    customer_name: str,
    items: str,
    total_amount: float,
    payment_method: str,
    shipping_address: str
) -> str:
    """Process an e-commerce order"""
    return f"🛒 Order processed for {customer_name}:\nItems: {items}\nTotal: ${total_amount}\nPayment: {payment_method}\nShipping to: {shipping_address}"

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
    time: str,
    phone: str,
    insurance_info: str = ""
) -> str:
    """Schedule a dental appointment"""
    return f"🦷 Dental appointment scheduled for {patient_name} - {procedure} on {date} at {time}. Phone: {phone}. Insurance: {insurance_info}"

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
    description: str,
    priority: str = "medium"
) -> str:
    """Create a customer support ticket"""
    return f"🎫 Support ticket created for {customer_name}:\nIssue: {issue_type}\nDescription: {description}\nPriority: {priority}\nTicket ID: SUPPORT-{hash(description) % 10000}"

@function_tool
def check_ticket_status(ticket_id: str) -> str:
    """Check the status of a support ticket"""
    return f"🎫 Ticket {ticket_id} status: In Progress - Assigned to agent Sarah. Expected resolution: 24-48 hours"

@function_tool
def escalate_ticket(ticket_id: str, reason: str) -> str:
    """Escalate a support ticket to higher priority"""
    return f"🚨 Ticket {ticket_id} escalated to senior support. Reason: {reason}. Priority updated to HIGH."

# Agent configurations
AGENT_CONFIGS = {
    "restaurant": {
        "name": "Restaurant Assistant",
        "greeting": "🍽️ Welcome to our restaurant! I can help you make reservations, check our menu, or answer any questions about our dining experience.",
        "instructions": """You are a friendly restaurant assistant. Help customers with:
        - Making reservations
        - Checking menu items
        - Providing store hours
        - Answering questions about the restaurant
        
        Be warm, professional, and helpful. Always confirm details before booking.""",
        "tools": [make_reservation, get_menu, get_store_hours]
    },
    "salon": {
        "name": "Salon Assistant", 
        "greeting": "💇‍♀️ Welcome to our salon! I can help you book appointments, check availability, or answer questions about our services.",
        "instructions": """You are a professional salon assistant. Help customers with:
        - Booking appointments for hair, nails, spa services
        - Checking availability
        - Providing service information
        - Managing appointment changes
        
        Be friendly, professional, and detail-oriented.""",
        "tools": [book_appointment, check_availability, get_store_hours]
    },
    "ecommerce": {
        "name": "E-commerce Assistant",
        "greeting": "🛒 Welcome to our online store! I can help you with orders, product information, shipping, and any questions about our products.",
        "instructions": """You are a helpful e-commerce assistant. Help customers with:
        - Processing orders
        - Tracking shipments
        - Product information
        - Returns and exchanges
        - Payment questions
        
        Be efficient, helpful, and always confirm order details.""",
        "tools": [process_order, track_order, get_product_info, get_store_hours]
    },
    "dentist": {
        "name": "Dental Assistant",
        "greeting": "🦷 Welcome to our dental practice! I can help you schedule appointments, check insurance, or answer questions about our dental services.",
        "instructions": """You are a professional dental assistant. Help patients with:
        - Scheduling dental appointments
        - Checking insurance coverage
        - Providing information about procedures
        - Managing appointment changes
        
        Be professional, caring, and thorough with medical information.""",
        "tools": [schedule_dental_appointment, check_dental_insurance, get_dental_services, get_store_hours]
    },
    "support": {
        "name": "Customer Support",
        "greeting": "🎫 Welcome to customer support! I'm here to help you with any technical issues, account questions, or general inquiries.",
        "instructions": """You are a knowledgeable customer support agent. Help customers with:
        - Technical troubleshooting
        - Account issues
        - Billing questions
        - General inquiries
        - Creating support tickets
        
        Be patient, thorough, and always try to resolve issues completely.""",
        "tools": [create_support_ticket, check_ticket_status, escalate_ticket]
    }
}

class DemoTextAgent:
    """Text-based demo agent using OpenAI Agents SDK with multi-agent routing"""
    
    def __init__(self):
        logger.info("🚀 Initializing DemoTextAgent with multi-agent routing...")
        
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
        
        # Create specialist agent instances
        logger.info("🤖 Creating specialist agent instances...")
        self.specialist_agents = {}
        for agent_type, config in AGENT_CONFIGS.items():
            logger.info(f"  📝 Creating {agent_type} specialist agent...")
            try:
                self.specialist_agents[agent_type] = Agent(
                    name=config["name"],
                    instructions=config["instructions"],
                    tools=config["tools"]
                )
                logger.info(f"  ✅ {agent_type} specialist agent created successfully")
            except Exception as e:
                logger.error(f"  ❌ Failed to create {agent_type} specialist agent: {e}")
                raise
        
        # Create triage agent for routing
        logger.info("🎯 Creating triage agent for multi-agent routing...")
        try:
            self.triage_agent = Agent(
                name="Triage Agent",
                instructions="""You are a triage agent that routes customer requests to the appropriate specialist agent.

Available specialist agents:
- restaurant: For dining reservations, menu questions, restaurant services
- salon: For beauty appointments, salon services, hair/nail bookings  
- ecommerce: For online shopping, product orders, shipping, returns
- dentist: For dental appointments, oral health, dental procedures
- support: For technical issues, account problems, general customer service

Analyze the customer's request and determine which specialist agent should handle it. 
Respond with just the agent type (e.g., "restaurant", "salon", "ecommerce", "dentist", "support").

If the request is unclear or could be handled by multiple agents, choose the most appropriate one based on context.""",
                handoffs=list(self.specialist_agents.values())
            )
            logger.info("✅ Triage agent created successfully")
        except Exception as e:
            logger.error(f"❌ Failed to create triage agent: {e}")
            raise
        
        # Keep backward compatibility
        self.agents = self.specialist_agents
        
        logger.info(f"🎉 Successfully initialized multi-agent system:")
        logger.info(f"  🎯 1 triage agent for routing")
        logger.info(f"  🤖 {len(self.specialist_agents)} specialist agents: {list(self.specialist_agents.keys())}")
    
    async def process_text_message(self, message: str, agent_type: str = None, session_id: str = "default") -> str:
        """Process a text message using intelligent multi-agent routing"""
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
                    result = await Runner.run(self.triage_agent, message)
                    logger.info(f"✅ Triage agent completed, final agent: {result.current_agent.name if hasattr(result, 'current_agent') else 'Unknown'}")
                    return result.final_output
                
                # If specific agent_type requested, use that agent directly
                elif agent_type in self.specialist_agents:
                    logger.info(f"🤖 Using specialist agent: {agent_type}")
                    agent = self.specialist_agents[agent_type]
                    logger.info(f"🚀 Calling Runner.run() with specialist agent...")
                    result = await Runner.run(agent, message)
                    logger.info(f"✅ Specialist agent completed successfully")
                    logger.info(f"📝 Response length: {len(result.final_output) if result.final_output else 0} characters")
                    return result.final_output
                
                else:
                    logger.error(f"❌ Invalid agent type '{agent_type}'. Available: {list(self.specialist_agents.keys())}")
                    return f"Error: Invalid agent type '{agent_type}'. Available types: {list(self.specialist_agents.keys())}"
                
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
        return list(AGENT_CONFIGS.keys())
    
    def get_agent_info(self, agent_type: str) -> dict:
        """Get information about a specific agent"""
        if agent_type in AGENT_CONFIGS:
            config = AGENT_CONFIGS[agent_type]
            return {
                "name": config["name"],
                "greeting": config["greeting"],
                "tools": [tool.__name__ for tool in config["tools"]]
            }
        return None
    
    def get_status(self) -> dict:
        """Get status of the text agent"""
        return {
            "api_key_loaded": bool(self.api_key),
            "available_agents": len(self.agents),
            "agent_types": list(self.agents.keys())
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