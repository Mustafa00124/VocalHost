"""
Multi-agent demo system - Simplified version for testing
"""
import os
import asyncio
import json
from typing import Dict, Any, Optional
from .websocket_handler import websocket_handler

# Import OpenAI Agents SDK
from agents.realtime import RealtimeAgent, RealtimeRunner, RealtimeSession, realtime_handoff
from agents import function_tool

# Define tools using SDK decorators
@function_tool
async def book_appointment(agent_type: str, time: str, date: str, customer_name: str) -> str:
    """Book an appointment slot"""
    try:
        message = {
            "type": "calendar_update",
            "action": "add_booking",
            "agent_type": agent_type,
            "data": {
                "time": time,
                "date": date,
                "customer_name": customer_name,
                "id": f"{date}_{time}_{customer_name}"
            }
        }
        websocket_handler.broadcast_message(message)
        return f"Successfully booked {customer_name} for {time} on {date}"
    except Exception as e:
        return f"Error booking appointment: {str(e)}"

@function_tool
async def cancel_appointment(agent_type: str, booking_id: str) -> str:
    """Cancel an existing appointment"""
    try:
        message = {
            "type": "calendar_update",
            "action": "cancel_booking",
            "agent_type": agent_type,
            "data": {"booking_id": booking_id}
        }
        websocket_handler.broadcast_message(message)
        return f"Successfully cancelled appointment {booking_id}"
    except Exception as e:
        return f"Error cancelling appointment: {str(e)}"

@function_tool
async def add_customer(agent_type: str, name: str, email: str, phone: str = "", notes: str = "") -> str:
    """Add a new customer to CRM"""
    try:
        message = {
            "type": "crm_update",
            "action": "add_customer",
            "agent_type": agent_type,
            "data": {
                "name": name,
                "email": email,
                "phone": phone,
                "notes": notes,
                "id": f"customer_{name}_{email}"
            }
        }
        websocket_handler.broadcast_message(message)
        return f"Successfully added customer {name} ({email})"
    except Exception as e:
        return f"Error adding customer: {str(e)}"

@function_tool
async def add_to_cart(agent_type: str, product_id: str, product_name: str, price: float, quantity: int = 1, size: str = "M", color: str = "Default") -> str:
    """Add item to shopping cart"""
    try:
        message = {
            "type": "cart_update",
            "action": "add_item",
            "agent_type": agent_type,
            "data": {
                "product_id": product_id,
                "product_name": product_name,
                "price": price,
                "quantity": quantity,
                "size": size,
                "color": color,
                "item_id": f"{product_id}_{size}_{color}"
            }
        }
        websocket_handler.broadcast_message(message)
        return f"Added {quantity}x {product_name} ({size}, {color}) to cart for ${price * quantity:.2f}"
    except Exception as e:
        return f"Error adding to cart: {str(e)}"

# Tool specialist agent (no voice, handles all tool calls)
@function_tool
async def get_restaurant_policies() -> str:
    """Get restaurant policies and information"""
    return """Restaurant Policies:
    - Reservations can be made up to 30 days in advance
    - Cancellations must be made at least 2 hours before reservation
    - We accommodate parties of 1-12 people
    - Dress code: Smart casual
    - We offer vegetarian, vegan, and gluten-free options
    - Happy hour: 4-6 PM daily with 20% off drinks"""

@function_tool
async def get_salon_policies() -> str:
    """Get salon policies and information"""
    return """Salon Policies:
    - Appointments can be booked up to 60 days in advance
    - 24-hour cancellation policy required
    - We offer hair, nails, massage, and spa services
    - First-time clients get 15% off
    - We use only professional-grade products
    - Walk-ins welcome based on availability"""

@function_tool
async def get_ecommerce_policies() -> str:
    """Get e-commerce policies and information"""
    return """E-commerce Policies:
    - Free shipping on orders over $50
    - 30-day return policy for unworn items
    - International shipping available
    - Size guide available for all clothing items
    - Customer service available 24/7
    - Secure payment processing guaranteed"""

@function_tool
async def get_dentist_policies() -> str:
    """Get dental practice policies and information"""
    return """Dental Practice Policies:
    - Appointments can be scheduled up to 90 days in advance
    - 24-hour cancellation policy required to avoid fees
    - We accept most major insurance plans including Delta Dental
    - New patient consultations are complimentary
    - Emergency appointments available same-day when possible
    - Payment plans available for major procedures
    - We follow strict sterilization and safety protocols"""

@function_tool
async def get_support_policies() -> str:
    """Get customer support policies and information"""
    return """Customer Support Policies:
    - 24/7 support available via chat, phone, and email
    - Response time: < 2 hours for high priority, < 24 hours for standard
    - We support all major browsers and devices
    - Data security and privacy are our top priorities
    - Free account recovery and password reset services
    - Escalation to senior support for complex issues
    - Satisfaction guarantee on all support interactions"""

# Agent configurations with specialized greetings and instructions
AGENT_CONFIGS = {
    "restaurant": {
        "name": "Restaurant Assistant",
        "greeting": "Hello! I'm your AI assistant for Bella Vista Restaurant. I can help you with reservations, customer information, and dining inquiries. How may I assist you today?",
        "instructions": """You are a friendly restaurant assistant for Bella Vista Restaurant. You can help customers with:
        - Making reservations and bookings
        - Managing customer information
        - Answering questions about our menu and policies
        - Providing restaurant information
        
        Always be warm, professional, and helpful. Confirm important details before making changes.
        If you need to perform specific actions like booking or adding customers, hand off to the tool specialist agent.""",
        "tools": [get_restaurant_policies]
    },
    "salon": {
        "name": "Salon Assistant", 
        "greeting": "Hello! I'm your AI assistant for Glamour Salon. I can help you with appointments, services, and customer care. How can I help you today?",
        "instructions": """You are a friendly salon assistant for Glamour Salon. You can help customers with:
        - Booking appointments for hair, nails, massage, and spa services
        - Managing customer profiles and preferences
        - Recommending services and products
        - Answering questions about our policies
        
        Always be warm, professional, and helpful. Confirm appointment details.
        If you need to perform specific actions like booking or adding customers, hand off to the tool specialist agent.""",
        "tools": [get_salon_policies]
    },
    "ecommerce": {
        "name": "E-commerce Assistant",
        "greeting": "Hello! I'm your AI assistant for StyleHub Store. I can help you with shopping, orders, and customer support. How can I assist you today?",
        "instructions": """You are a friendly e-commerce assistant for StyleHub Store. You can help customers with:
        - Adding items to shopping cart
        - Managing customer accounts
        - Product recommendations
        - Order information and policies
        
        Always be helpful and professional. Confirm order details.
        If you need to perform specific actions like adding to cart or managing customers, hand off to the tool specialist agent.""",
        "tools": [get_ecommerce_policies]
    },
    "dentist": {
        "name": "Dental Assistant",
        "greeting": "Hello! I'm your AI assistant for Bright Smile Dental. I can help you with appointments, patient records, and dental services. How may I assist you today?",
        "instructions": """You are a friendly dental assistant for Bright Smile Dental. You can help patients with:
        - Scheduling dental appointments
        - Managing patient information
        - Answering questions about procedures and policies
        - Providing dental practice information
        
        Always be warm, professional, and reassuring. Confirm appointment details carefully.
        If you need to perform specific actions like booking or updating patient records, hand off to the tool specialist agent.""",
        "tools": [get_dentist_policies]
    },
    "support": {
        "name": "Customer Support Assistant",
        "greeting": "Hello! I'm your AI assistant for customer support. I can help you with technical issues, account questions, and support tickets. How can I help you today?",
        "instructions": """You are a helpful customer support assistant. You can help customers with:
        - Technical support and troubleshooting
        - Account management and billing questions
        - Support ticket creation and tracking
        - Product information and policies
        
        Always be patient, professional, and solution-oriented. Escalate complex issues when needed.
        If you need to perform specific actions like creating tickets or updating accounts, hand off to the tool specialist agent.""",
        "tools": [get_support_policies]
    }
}

# Create specialized agents for each business type
def create_voice_agent(agent_type: str) -> RealtimeAgent:
    """Create voice agent for specific business type"""
    config = AGENT_CONFIGS[agent_type]
    return RealtimeAgent(
        name=f"{config['name']} (Voice)",
        instructions=config["instructions"],
        tools=config["tools"]
        # Voice is enabled by default in RealtimeAgent
    )

def create_tool_specialist_agent(agent_type: str) -> RealtimeAgent:
    """Create tool specialist agent (no voice) for specific business type"""
    config = AGENT_CONFIGS[agent_type]
    return RealtimeAgent(
        name=f"{config['name']} (Tools)",
        instructions=f"""You are a tool specialist for {config['name']}. You handle all tool operations:
        - Booking appointments and reservations
        - Managing customer information
        - Adding items to cart
        - Any other system operations
        
        You work silently in the background. Always execute tools efficiently and return clear results.""",
        tools=[book_appointment, cancel_appointment, add_customer, add_to_cart]
        # No voice - silent operation
    )

def create_policy_agent(agent_type: str) -> RealtimeAgent:
    """Create policy agent with RAG knowledge (no voice)"""
    config = AGENT_CONFIGS[agent_type]
    return RealtimeAgent(
        name=f"{config['name']} (Policy)",
        instructions=f"""You are a policy specialist for {config['name']}. You provide:
        - Detailed policy information
        - Business rules and guidelines
        - Service information
        - FAQ responses
        
        You work silently in the background. Provide accurate, detailed information when asked.""",
        tools=config["tools"]
        # No voice - silent operation
    )

class DemoVoiceAgent:
    """Multi-agent system using OpenAI Agents SDK"""
    
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_KEY", "")
        if not self.api_key:
            raise ValueError("OpenAI API key is required. Set OPENAI_API_KEY or OPENAI_KEY environment variable.")
        
        self.active_sessions: Dict[str, RealtimeSession] = {}
        self.current_agent_type: Dict[str, str] = {}  # Track agent type per session
        
        # Create all specialized agents for each business type
        self.agent_ecosystems = {}
        for agent_type in AGENT_CONFIGS.keys():
            self.agent_ecosystems[agent_type] = {
                "voice": create_voice_agent(agent_type),
                "tools": create_tool_specialist_agent(agent_type),
                "policy": create_policy_agent(agent_type)
            }
            
            # Set up handoffs between agents
            voice_agent = self.agent_ecosystems[agent_type]["voice"]
            tools_agent = self.agent_ecosystems[agent_type]["tools"]
            policy_agent = self.agent_ecosystems[agent_type]["policy"]
            
            # Voice agent can hand off to tools and policy agents
            voice_agent.handoffs = [
                realtime_handoff(tools_agent, "I need to perform a system action like booking or adding a customer"),
                realtime_handoff(policy_agent, "I need detailed policy information or business rules")
            ]
            
            # Tools and policy agents can hand back to voice agent
            tools_agent.handoffs = [realtime_handoff(voice_agent, "Task completed, returning to conversation")]
            policy_agent.handoffs = [realtime_handoff(voice_agent, "Information provided, returning to conversation")]
        
    async def handle_websocket_connection(self, ws):
        """Handle new WebSocket connection using SDK"""
        connection_id = websocket_handler.add_connection(ws)
        
        try:
            # Start with restaurant agent by default
            agent_type = "restaurant"
            self.current_agent_type[connection_id] = agent_type
            
            # Create session with voice agent
            voice_agent = self.agent_ecosystems[agent_type]["voice"]
            runner = RealtimeRunner(voice_agent)
            session_context = await runner.run()
            session = await session_context.__aenter__()
            self.active_sessions[connection_id] = session
            
            # Send initial greeting
            await self._send_greeting(connection_id, agent_type)
            
            # Start event processing
            asyncio.create_task(self._process_events(connection_id, session, ws))
            
            # Handle incoming messages
            while True:
                data = await ws.receive()
                message = json.loads(data)
                await self._handle_message(connection_id, message, session)
                
        except Exception as e:
            print(f"Error in WebSocket connection {connection_id}: {e}")
        finally:
            # Clean up
            if connection_id in self.active_sessions:
                await self.active_sessions[connection_id].close()
                del self.active_sessions[connection_id]
            if connection_id in self.current_agent_type:
                del self.current_agent_type[connection_id]
            websocket_handler.remove_connection(connection_id)
    
    async def _send_greeting(self, connection_id: str, agent_type: str):
        """Send specialized greeting for the selected agent type"""
        config = AGENT_CONFIGS[agent_type]
        greeting_message = {
            "type": "greeting",
            "agent_type": agent_type,
            "agent_name": config["name"],
            "message": config["greeting"]
        }
        await websocket_handler.send_message(connection_id, greeting_message)
    
    async def _process_events(self, connection_id: str, session: RealtimeSession, ws):
        """Process events from the SDK session"""
        try:
            async for event in session:
                event_data = self._serialize_event(event)
                await ws.send(json.dumps(event_data))
        except Exception as e:
            print(f"Error processing events for {connection_id}: {e}")
    
    def _serialize_event(self, event) -> Dict[str, Any]:
        """Serialize SDK events for frontend"""
        base_event = {"type": event.type}
        
        if event.type == "agent_start":
            base_event["agent"] = event.agent.name
        elif event.type == "agent_end":
            base_event["agent"] = event.agent.name
        elif event.type == "handoff":
            base_event["from"] = event.from_agent.name
            base_event["to"] = event.to_agent.name
        elif event.type == "tool_start":
            base_event["tool"] = event.tool.name
        elif event.type == "tool_end":
            base_event["tool"] = event.tool.name
            base_event["output"] = str(event.output)
        elif event.type == "audio":
            import base64
            base_event["audio"] = base64.b64encode(event.audio.data).decode("utf-8")
        elif event.type == "history_updated":
            base_event["history"] = [item.model_dump(mode="json") for item in event.history]
        elif event.type == "error":
            base_event["error"] = str(event.error) if hasattr(event, "error") else "Unknown error"
            
        return base_event
    
    async def _handle_message(self, connection_id: str, message: Dict[str, Any], session: RealtimeSession):
        """Handle incoming messages"""
        message_type = message.get("type")
        
        try:
            if message_type == "audio":
                # Handle audio input
                import base64
                import struct
                int16_data = message.get("data", [])
                if not int16_data:
                    await websocket_handler.send_message(connection_id, {
                        "type": "error",
                        "message": "No audio data provided"
                    })
                    return
                
                audio_bytes = struct.pack(f"{len(int16_data)}h", *int16_data)
                await session.send_audio(audio_bytes)
                
            elif message_type == "text":
                # Handle text input
                text = message.get("text", "")
                if not text.strip():
                    await websocket_handler.send_message(connection_id, {
                        "type": "error",
                        "message": "Empty text message"
                    })
                    return
                
                await session.send_message(text)
                
            elif message_type == "set_agent_type":
                # Switch agent type - create new session with new agent ecosystem
                agent_type = message.get("agent_type", "restaurant")
                if agent_type not in self.agent_ecosystems:
                    await websocket_handler.send_message(connection_id, {
                        "type": "error",
                        "message": f"Unknown agent type: {agent_type}. Available: {list(self.agent_ecosystems.keys())}"
                    })
                    return
                
                # Close current session
                if connection_id in self.active_sessions:
                    await self.active_sessions[connection_id].close()
                    del self.active_sessions[connection_id]
                
                # Create new session with new agent type
                self.current_agent_type[connection_id] = agent_type
                voice_agent = self.agent_ecosystems[agent_type]["voice"]
                runner = RealtimeRunner(voice_agent)
                session_context = await runner.run()
                new_session = await session_context.__aenter__()
                self.active_sessions[connection_id] = new_session
                
                # Send greeting for new agent type
                await self._send_greeting(connection_id, agent_type)
                
                # Restart event processing for new session
                asyncio.create_task(self._process_events(connection_id, new_session, websocket_handler.active_connections[connection_id]))
                
                await websocket_handler.send_message(connection_id, {
                    "type": "agent_type_set",
                    "agent_type": agent_type,
                    "message": f"Switched to {agent_type} agent ecosystem"
                })
            else:
                await websocket_handler.send_message(connection_id, {
                    "type": "error",
                    "message": f"Unknown message type: {message_type}"
                })
                
        except Exception as e:
            print(f"Error handling message {message_type}: {e}")
            await websocket_handler.send_message(connection_id, {
                "type": "error",
                "message": f"Error processing {message_type}: {str(e)}"
            })
    
    def get_status(self) -> Dict[str, Any]:
        """Get global agent status"""
        return {
            "active_sessions": len(self.active_sessions),
            "available_agent_types": list(self.agent_ecosystems.keys()),
            "active_connections": len(websocket_handler.active_connections),
            "agent_ecosystems": {
                agent_type: {
                    "voice_agent": ecosystem["voice"].name,
                    "tools_agent": ecosystem["tools"].name,
                    "policy_agent": ecosystem["policy"].name
                }
                for agent_type, ecosystem in self.agent_ecosystems.items()
            }
        }
    
    def get_session_status(self, connection_id: str) -> Dict[str, Any]:
        """Get status of specific session"""
        if connection_id not in self.active_sessions:
            return {"active": False}
        
        try:
            current_agent_type = self.current_agent_type.get(connection_id, "unknown")
            return {
                "active": True,
                "agent_type": current_agent_type,
                "agent_name": self.active_sessions[connection_id]._current_agent.name,
                "available_agents": list(self.agent_ecosystems[current_agent_type].keys()) if current_agent_type in self.agent_ecosystems else []
            }
        except AttributeError:
            return {
                "active": True,
                "agent_type": self.current_agent_type.get(connection_id, "unknown"),
                "agent_name": "Unknown"
            }

# Global demo agent instance
demo_agent = DemoVoiceAgent()