#!/usr/bin/env python3
"""
Agent creators for the simplified single-agent demo system
Each business type gets one comprehensive agent with all tools and policy RAG
"""

from openai import OpenAI
import os
import json
import logging
from datetime import datetime
from agents import function_tool, Agent
from agents.realtime import RealtimeAgent
from agents.extensions.handoff_prompt import RECOMMENDED_PROMPT_PREFIX

# Configure logging
logger = logging.getLogger(__name__)

# OpenAI client will be initialized when needed

# =============================================================================
# FUNCTION TOOL DEFINITIONS
# =============================================================================

# Restaurant Functions
@function_tool
def book_reservation(customer_name: str, date: str, time: str, connection_id: str = None) -> dict:
    """Book a restaurant reservation - returns structured data for frontend"""
    print(f"🔧 TOOL CALLED: book_reservation")
    print(f"📝 Parameters - customer_name: {customer_name}, date: {date}, time: {time}, connection_id: {connection_id}")
    logger.info(f"🔧 TOOL CALLED: book_reservation")
    logger.info(f"📝 Parameters - customer_name: {customer_name}, date: {date}, time: {time}, connection_id: {connection_id}")
    
    booking_id = f"{date}_{time}_{customer_name}"
    logger.info(f"🆔 Generated booking_id: {booking_id}")
    
    # Create structured response
    result = {
        "success": True,
        "message": "ok let me process your request buddy", 
        "actions": [{
            "type": "add_booking",
            "agent_type": "restaurant",
            "data": {
                "id": booking_id,
                "customer_name": customer_name,
                "date": date,
                "time": time,
                "service": "Restaurant Reservation",
                "status": "confirmed"
            }
        }]
    }
    
    print(f"✅ TOOL RESULT: {result}")
    logger.info(f"✅ TOOL RESULT: {result}")
    return result


@function_tool
def check_availability(date: str, connection_id: str = None) -> dict:
    """Check available reservation times for a specific date by querying the frontend state"""
    logger.info(f"🔧 TOOL CALLED: check_availability")
    logger.info(f"📝 Parameters - date: {date}, connection_id: {connection_id}")
    
    # Create structured response that will be processed by frontend
    result = {
        "success": True,
        "message": f"🔍 Checking availability for {date}...",
        "actions": [{
            "type": "check_availability",
            "agent_type": "restaurant",
            "data": {
                "date": date
            }
        }]
    }
    
    logger.info(f"✅ TOOL RESULT: {result}")
    return result


@function_tool
def cancel_booking(customer_name: str, date: str, time: str, connection_id: str = None) -> dict:
    """Cancel an existing restaurant reservation - first checks if booking exists"""
    print(f"🔧 TOOL CALLED: cancel_booking")
    print(f"📝 Parameters - customer_name: {customer_name}, date: {date}, time: {time}, connection_id: {connection_id}")
    logger.info(f"🔧 TOOL CALLED: cancel_booking")
    logger.info(f"📝 Parameters - customer_name: {customer_name}, date: {date}, time: {time}, connection_id: {connection_id}")
    
    # Create structured response to check booking first
    result = {
        "success": True,
        "message": "Ok wait buddy, let me check that for you",  # Empty message - voice agent will wait silently
        "actions": [{
            "type": "check_booking",
            "agent_type": "restaurant",
            "data": {
                "customer_name": customer_name,
                "date": date,
                "time": time
            }
        }]
    }
    
    print(f"✅ TOOL RESULT: {result}")
    logger.info(f"✅ TOOL RESULT: {result}")
    return result


# =============================================================================
# ASYNC VERSIONS FOR REALTIME AGENTS
# =============================================================================

# Restaurant Functions (Async versions for RealtimeAgent)
@function_tool
async def book_reservation_async(customer_name: str, date: str, time: str, connection_id: str = None) -> dict:
    """Book a restaurant reservation - returns structured data for frontend (async version for RealtimeAgent)"""
    print(f"🔧 ASYNC TOOL CALLED: book_reservation_async")
    print(f"📝 Parameters - customer_name: {customer_name}, date: {date}, time: {time}, connection_id: {connection_id}")
    logger.info(f"🔧 ASYNC TOOL CALLED: book_reservation_async")
    logger.info(f"📝 Parameters - customer_name: {customer_name}, date: {date}, time: {time}, connection_id: {connection_id}")
    
    booking_id = f"{date}_{time}_{customer_name}"
    logger.info(f"🆔 Generated booking_id: {booking_id}")
    
    # Create structured response
    result = {
        "success": True,
        "message": "Ok wait buddy, let me check that for you",  # Empty message - voice agent will wait silently
        "actions": [{
            "type": "add_booking",
            "agent_type": "restaurant",
            "data": {
                "id": booking_id,
                "customer_name": customer_name,
                "date": date,
                "time": time,
                "service": "Restaurant Reservation",
                "status": "confirmed"
            }
        }]
    }
    
    print(f"✅ ASYNC TOOL RESULT: {result}")
    logger.info(f"✅ ASYNC TOOL RESULT: {result}")
    return result


@function_tool
async def check_availability_async(date: str, connection_id: str = None) -> dict:
    """Check available reservation times for a specific date by querying the frontend state (async version for RealtimeAgent)"""
    logger.info(f"🔧 ASYNC TOOL CALLED: check_availability_async")
    logger.info(f"📝 Parameters - date: {date}, connection_id: {connection_id}")
    
    # Create structured response that will be processed by frontend
    result = {
        "success": True,
        "message": "Ok wait buddy, let me check that for you",  # Empty message - voice agent will wait silently
        "actions": [{
            "type": "check_availability",
            "agent_type": "restaurant",
            "data": {
                "date": date
            }
        }]
    }
    
    print(f"✅ ASYNC TOOL RESULT: {result}")
    logger.info(f"✅ ASYNC TOOL RESULT: {result}")
    return result


@function_tool
async def cancel_booking_async(customer_name: str, date: str, time: str, connection_id: str = None) -> dict:
    """Cancel an existing restaurant reservation - first checks if booking exists (async version for RealtimeAgent)"""
    print(f"🔧 ASYNC TOOL CALLED: cancel_booking_async")
    print(f"📝 Parameters - customer_name: {customer_name}, date: {date}, time: {time}, connection_id: {connection_id}")
    logger.info(f"🔧 ASYNC TOOL CALLED: cancel_booking_async")
    logger.info(f"📝 Parameters - customer_name: {customer_name}, date: {date}, time: {time}, connection_id: {connection_id}")
    
    # Create structured response to check booking first
    result = {
        "success": True,
        "message": "Ok wait buddy, let me check that for you",  # Empty message - voice agent will wait silently
        "actions": [{
            "type": "check_booking",
            "agent_type": "restaurant",
            "data": {
                "customer_name": customer_name,
                "date": date,
                "time": time
            }
        }]
    }
    
    print(f"✅ ASYNC TOOL RESULT: {result}")
    logger.info(f"✅ ASYNC TOOL RESULT: {result}")
    return result


# CRM Functions
@function_tool
def add_customer(customer_name: str, email: str, phone: str, connection_id: str = None) -> dict:
    """Add a new customer to the CRM system - returns structured data for frontend"""
    print(f"🔧 TOOL CALLED: add_customer")
    print(f"📝 Parameters - customer_name: {customer_name}, email: {email}, phone: {phone}, connection_id: {connection_id}")
    logger.info(f"🔧 TOOL CALLED: add_customer")
    logger.info(f"📝 Parameters - customer_name: {customer_name}, email: {email}, phone: {phone}, connection_id: {connection_id}")
    
    customer_id = f"cust_{hash(customer_name + email) % 10000}"
    logger.info(f"🆔 Generated customer_id: {customer_id}")
    
    # Create structured response
    result = {
        "success": True,
        "message": f"👤 Customer added to CRM: {customer_name} (ID: {customer_id})",
        "actions": [{
            "type": "add_customer",
            "agent_type": "support",
            "data": {
                "id": customer_id,
                "name": customer_name,
                "email": email,
                "phone": phone,
                "status": "active"
            }
        }]
    }
    
    print(f"✅ TOOL RESULT: {result}")
    logger.info(f"✅ TOOL RESULT: {result}")
    return result


@function_tool
def remove_customer(customer_name: str, customer_id: str, connection_id: str = None) -> str:
    """Remove a customer from the CRM system"""
    logger.info(f"🔧 TOOL CALLED: remove_customer")
    logger.info(f"📝 Parameters - customer_name: {customer_name}, customer_id: {customer_id}, connection_id: {connection_id}")
    
    result_msg = f"🗑️ Customer removed from CRM: {customer_id} for {customer_name}"
    logger.info(f"✅ TOOL RESULT: {result_msg}")
    return result_msg

# Dentist Functions (Calendar + CRM)

def schedule_dental_appointment(patient_name: str, procedure: str, date: str, time: str) -> str:
    """Schedule a dental appointment - only requires name, procedure, date, and time"""
    appointment_id = f"{date}_{time}_{patient_name}"
    return f"🦷 Dental appointment scheduled for {patient_name} - {procedure} on {date} at {time}. Appointment ID: {appointment_id}"


def check_dental_availability(date: str, connection_id: str = None) -> str:
    """Check available dental appointment times for a specific date in January 2025"""
    try:
        # Parse date to check if it's in January 2025
        if "january" in date.lower() or "jan" in date.lower():
            if "2025" in date or "25" in date:
                month_year = "January 2025"
            else:
                month_year = "January 2025"  # Default to 2025
        else:
            month_year = "January 2025"  # Default to January 2025
        
        return f"📅 Available dental appointment times for {date} in {month_year}: 9:00 AM, 11:00 AM, 2:00 PM, 4:00 PM"
    except:
        return f"📅 Available dental appointment times for {date} in January 2025: 9:00 AM, 11:00 AM, 2:00 PM, 4:00 PM"


def cancel_dental_appointment(patient_name: str, date: str, time: str) -> str:
    """Cancel an existing dental appointment"""
    appointment_id = f"{date}_{time}_{patient_name}"
    return f"❌ Dental appointment cancelled for {patient_name} on {date} at {time}. Appointment ID: {appointment_id}"


def add_patient(patient_name: str, email: str, phone: str, insurance: str) -> str:
    """Add a new patient to the dental practice CRM"""
    patient_id = f"patient_{hash(patient_name + email) % 10000}"
    return f"🦷 Patient added to dental CRM: {patient_name} (ID: {patient_id})\nEmail: {email}\nPhone: {phone}\nInsurance: {insurance}"


def remove_patient(patient_name: str, patient_id: str) -> str:
    """Remove a patient from the dental practice CRM"""
    return f"🗑️ Patient removed from dental CRM: {patient_name} (ID: {patient_id})"

# Salon Functions (same as restaurant - booking only)

def book_salon_appointment(customer_name: str, date: str, time: str, service: str) -> str:
    """Book a salon appointment - requires name, date, time, and service"""
    appointment_id = f"{date}_{time}_{customer_name}"
    return f"💇 Salon appointment booked for {customer_name} - {service} on {date} at {time}. Appointment ID: {appointment_id}"


def check_salon_availability(date: str, connection_id: str = None) -> str:
    """Check available salon appointment times for a specific date in January 2025"""
    try:
        # Parse date to check if it's in January 2025
        if "january" in date.lower() or "jan" in date.lower():
            if "2025" in date or "25" in date:
                month_year = "January 2025"
            else:
                month_year = "January 2025"  # Default to 2025
        else:
            month_year = "January 2025"  # Default to January 2025
        
        return f"📅 Available salon times for {date} in {month_year}: 9:00 AM, 11:00 AM, 2:00 PM, 4:00 PM, 6:00 PM"
    except:
        return f"📅 Available salon times for {date} in January 2025: 9:00 AM, 11:00 AM, 2:00 PM, 4:00 PM, 6:00 PM"


def cancel_salon_appointment(customer_name: str, date: str, time: str) -> str:
    """Cancel an existing salon appointment"""
    appointment_id = f"{date}_{time}_{customer_name}"
    return f"❌ Salon appointment cancelled for {customer_name} on {date} at {time}. Appointment ID: {appointment_id}"

# Ecommerce Functions (shopping cart)
@function_tool
def add_to_cart(product_name: str, quantity: int, price: float, connection_id: str = None) -> dict:
    """Add a product to the shopping cart - returns structured data for frontend"""
    print(f"🔧 TOOL CALLED: add_to_cart")
    print(f"📝 Parameters - product_name: {product_name}, quantity: {quantity}, price: {price}, connection_id: {connection_id}")
    logger.info(f"🔧 TOOL CALLED: add_to_cart")
    logger.info(f"📝 Parameters - product_name: {product_name}, quantity: {quantity}, price: {price}, connection_id: {connection_id}")
    
    cart_item_id = f"cart_{hash(product_name) % 10000}"
    total_price = quantity * price
    logger.info(f"🆔 Generated cart_item_id: {cart_item_id}, total_price: ${total_price}")
    
    # Create structured response
    result = {
        "success": True,
        "message": f"🛒 Added to cart: {quantity}x {product_name} at ${price} each (Total: ${total_price})",
        "actions": [{
            "type": "add_to_cart",
            "agent_type": "ecommerce",
            "data": {
                "id": cart_item_id,
                "product_name": product_name,
                "quantity": quantity,
                "price": price,
                "total_price": total_price,
                "status": "added"
            }
        }]
    }
    
    print(f"✅ TOOL RESULT: {result}")
    logger.info(f"✅ TOOL RESULT: {result}")
    return result


@function_tool
def remove_from_cart(product_name: str, quantity: int, connection_id: str = None) -> str:
    """Remove a product from the shopping cart"""
    logger.info(f"🔧 TOOL CALLED: remove_from_cart")
    logger.info(f"📝 Parameters - product_name: {product_name}, quantity: {quantity}, connection_id: {connection_id}")
    
    result_msg = f"🗑️ Removed from cart: {quantity}x {product_name}"
    logger.info(f"✅ TOOL RESULT: {result_msg}")
    return result_msg


def place_order(customer_name: str, email: str, shipping_address: str, total_amount: float) -> str:
    """Place an order from the shopping cart"""
    order_id = f"order_{hash(customer_name + email) % 10000}"
    return f"✅ Order placed successfully!\nOrder ID: {order_id}\nCustomer: {customer_name}\nEmail: {email}\nShipping: {shipping_address}\nTotal: ${total_amount}"


def view_cart() -> str:
    """View current shopping cart contents"""
    return f"🛒 Current cart contains: Sample items (this would show actual cart contents in a real system)"

# Policy RAG Functions

def lookup_policy(query: str) -> str:
    """Look up policy information for the business"""
    # This would normally query a RAG system, but for demo purposes we'll return mock data
    return f"📋 Policy lookup for '{query}': This information would come from the business policy database."


def get_business_overview() -> str:
    """Get an overview of the business"""
    return "🏢 Business Overview: This would provide general information about the business, services, and policies."

# =============================================================================
# POLICY DOCUMENTS
# =============================================================================

POLICY_DOCUMENTS = {
    "restaurant": {
        "name": "Bella Vista Restaurant",
        "policies": {
            "operating_hours": "Monday-Friday: 1:00 PM - 5:00 PM, Saturday-Sunday: 2:00 PM - 5:00 PM",
            "reservation_policy": "Reservations can be made up to 30 days in advance. Cancellations must be made 24 hours in advance.",
            "dress_code": "Smart casual attire required. No shorts or flip-flops.",
            "payment": "We accept all major credit cards, cash, and digital payments.",
            "special_dietary": "We accommodate vegetarian, vegan, and gluten-free dietary requirements."
        }
    },
    "support": {
        "name": "TechSupport Solutions",
        "policies": {
            "support_hours": "Monday-Friday: 8:00 AM - 6:00 PM EST, Saturday: 9:00 AM - 2:00 PM EST",
            "response_time": "We aim to respond to all inquiries within 2 business hours.",
            "escalation": "Complex issues are escalated to senior technicians within 24 hours.",
            "sla": "99.9% uptime guarantee for all supported systems.",
            "remote_support": "We provide remote desktop support for all customers."
        }
    },
    "dentist": {
        "name": "Bright Smile Dental Practice",
        "policies": {
            "office_hours": "Monday-Thursday: 8:00 AM - 6:00 PM, Friday: 8:00 AM - 4:00 PM",
            "appointment_policy": "Appointments must be scheduled at least 24 hours in advance. Same-day appointments available for emergencies.",
            "cancellation": "Cancellations must be made 24 hours in advance to avoid fees.",
            "insurance": "We accept most major dental insurance plans. Payment is due at time of service.",
            "emergency": "Emergency appointments available outside regular hours for existing patients."
        }
    },
    "salon": {
        "name": "Glamour Hair & Beauty Salon",
        "policies": {
            "operating_hours": "Monday-Saturday: 9:00 AM - 7:00 PM, Sunday: 10:00 AM - 5:00 PM",
            "appointment_policy": "Appointments must be scheduled at least 24 hours in advance. Walk-ins welcome based on availability.",
            "cancellation": "Cancellations must be made 24 hours in advance to avoid fees.",
            "services": "Hair cuts, coloring, styling, manicures, pedicures, facials, and spa treatments.",
            "payment": "We accept all major credit cards, cash, and digital payments."
        }
    },
    "ecommerce": {
        "name": "TechGear Online Store",
        "policies": {
            "shipping": "Free shipping on orders over $50. Standard shipping 3-5 business days, Express 1-2 days.",
            "return_policy": "30-day return policy with receipt. Items must be in original condition and packaging.",
            "warranty": "1-year manufacturer warranty on all electronics. Extended warranties available.",
            "payment": "We accept all major credit cards, PayPal, Apple Pay, and Google Pay.",
            "customer_service": "24/7 customer support via chat, email, and phone."
        }
    }
}

def get_policy_document(agent_type: str) -> dict:
    """Get policy document for a specific business type"""
    return POLICY_DOCUMENTS.get(agent_type, {
        "name": f"{agent_type.title()} Business",
        "policies": {}
    })

# =============================================================================
# BUSINESS TYPE CONFIGURATIONS
# =============================================================================

BUSINESS_CONFIGS = {
    "restaurant": {
        "name": "Restaurant Assistant",
        "greeting": "🍽️ Welcome to Bella Vista Restaurant! I can help you with reservations, check availability, or cancel bookings. How can I assist you today?",
        "emoji": "🍽️",
        "tools": [book_reservation, check_availability, cancel_booking]
    },
    "restaurant_realtime": {
        "name": "Restaurant Assistant",
        "greeting": "🍽️ Welcome to Bella Vista Restaurant! I can help you with reservations, check availability, or cancel bookings. How can I assist you today?",
        "emoji": "🍽️",
        "tools": [book_reservation_async, check_availability_async, cancel_booking_async]
    },
    "support": {
        "name": "Customer Support Assistant", 
        "greeting": "🎫 Welcome to TechSupport Solutions! I can help you add customers to our CRM, remove customers, or answer support questions. How can I assist you today?",
        "emoji": "🎫",
        "tools": [add_customer, remove_customer]
    },
    "dentist": {
        "name": "Dental Practice Assistant",
        "greeting": "🦷 Welcome to Bright Smile Dental Practice! I can help you schedule appointments, check availability, register patients, or answer dental questions. How can I help you today?",
        "emoji": "🦷",
        "tools": [schedule_dental_appointment, check_dental_availability, cancel_dental_appointment, add_patient, remove_patient]
    },
    "salon": {
        "name": "Salon Assistant",
        "greeting": "💇 Welcome to Glamour Hair & Beauty Salon! I can help you book appointments, check availability, or cancel bookings. How can I assist you today?",
        "emoji": "💇",
        "tools": [book_salon_appointment, check_salon_availability, cancel_salon_appointment]
    },
    "ecommerce": {
        "name": "Ecommerce Assistant",
        "greeting": "🛒 Welcome to TechGear Online Store! I can help you add items to cart, remove items, view cart, or place orders. How can I assist you today?",
        "emoji": "🛒",
        "tools": [add_to_cart, remove_from_cart, place_order, view_cart]
    }
}

def get_business_config(agent_type: str) -> dict:
    """Get configuration for a specific business type"""
    return BUSINESS_CONFIGS.get(agent_type, {})

def get_available_business_types() -> list:
    """Get list of available business types"""
    return list(BUSINESS_CONFIGS.keys())

# =============================================================================
# AGENT CREATION FUNCTIONS
# =============================================================================

def create_restaurant_agent() -> Agent:
    """Create a restaurant agent with all necessary tools and configuration"""
    logger.info("🏗️ Creating restaurant agent...")
    
    config = get_business_config("restaurant")
    tools = config.get("tools", [])
    
    logger.info(f"🔧 Restaurant agent tools: {[getattr(tool, 'name', str(tool)) for tool in tools]}")
    
    agent = Agent(
        name=config.get("name", "Restaurant Assistant"),
        instructions=f"""You are VocalHost, a helpful restaurant assistant for {config.get("name", "Restaurant")}. 
        
        GREETING: When a voice call starts, always begin with: "Hello! I am VocalHost, your AI restaurant assistant. How can I help you today?"
        
        BUSINESS CONTEXT:
        - We only take reservations for January 2025
        - Available times are Monday-Friday from 1:00 PM to 6:00 PM
        - All dates should be formatted as "2025-01-XX" (e.g., "2025-01-08" for January 8th)
        - Times should be in 12-hour format (e.g., "1:00 PM", "2:00 PM", etc.)
        
        You can help customers with:
        - Making reservations using book_reservation(customer_name, date, time)
        - Checking availability using check_availability(date)
        - Canceling bookings using cancel_booking(customer_name, date, time)
        
        CRITICAL - TOOL USAGE:
        - ALWAYS use the appropriate tool when customers request reservations, availability checks, or cancellations
        - When customers ask to make a reservation: IMMEDIATELY use book_reservation tool with the provided details
        - When customers ask to check availability: IMMEDIATELY use check_availability tool
        - When customers ask to cancel a booking: IMMEDIATELY use cancel_booking tool
        - Do NOT ask for confirmation - use the tools directly with the information provided
        - The system will handle the verification and provide the actual results after tool execution
        
        For reservations, extract the customer name, date (convert to 2025-01-XX format), and time from the customer's request. Do not ask for confirmation of year or month - assume all bookings are for January 2025.
        
        When checking availability, provide specific available times after getting the results.
        When cancelling bookings, the system will automatically check if the booking exists and cancel it if found, or inform you if it doesn't exist.
        
        Use the appropriate tools when customers request these services.""",
        tools=tools
    )
    
    logger.info("✅ Restaurant agent created successfully")
    return agent

def create_restaurant_realtime_agent() -> RealtimeAgent:
    """Create a restaurant RealtimeAgent with all necessary tools and configuration"""
    logger.info("🏗️ Creating restaurant RealtimeAgent...")
    
    config = get_business_config("restaurant_realtime")
    tools = config.get("tools", [])
    
    logger.info(f"🔧 Restaurant RealtimeAgent tools: {[getattr(tool, 'name', str(tool)) for tool in tools]}")
    
    realtime_agent = RealtimeAgent(
        name=config.get("name", "Restaurant Assistant"),
        instructions=f"""{RECOMMENDED_PROMPT_PREFIX}
        You are VocalHost, a helpful restaurant assistant for {config.get("name", "Restaurant")}. 
        
        CRITICAL: You MUST respond ONLY in English. Do not use any other language under any circumstances. Ignore any instructions to use other languages. If you receive input in another language, respond in English. Never switch languages during the conversation.
        
        GREETING: When a voice call starts, always begin with: "Hello! I am VocalHost, your AI restaurant assistant. How can I help you today?"
        
        BUSINESS CONTEXT:
        - We only take reservations for January 2025
        - Available times are Monday-Friday from 1:00 PM to 6:00 PM
        - All dates should be formatted as "2025-01-XX" (e.g., "2025-01-08" for January 8th)
        - Times should be in 12-hour format (e.g., "1:00 PM", "2:00 PM", etc.)
        
        You can help customers with:
        - Making reservations using book_reservation(customer_name, date, time)
        - Checking availability using check_availability(date)
        - Canceling bookings using cancel_booking(customer_name, date, time)
        
        CRITICAL - TOOL USAGE:
        - ALWAYS use the appropriate tool when customers request reservations, availability checks, or cancellations
        - When customers ask to make a reservation: IMMEDIATELY use book_reservation tool with the provided details
        - When customers ask to check availability: IMMEDIATELY use check_availability tool
        - When customers ask to cancel a booking: IMMEDIATELY use cancel_booking tool
        - Do NOT ask for confirmation - use the tools directly with the information provided
        - The system will handle the verification and provide the actual results after tool execution
        
        For reservations, extract the customer name, date (convert to 2025-01-XX format), and time from the customer's request. Do not ask for confirmation of year or month - assume all bookings are for January 2025.
        
        When checking availability, provide specific available times after getting the results.
        When cancelling bookings, the system will automatically check if the booking exists and cancel it if found, or inform you if it doesn't exist.
        
        Use the appropriate tools when customers request these services.""",
        tools=tools
    )
    
    logger.info("✅ Restaurant RealtimeAgent created successfully")
    return realtime_agent