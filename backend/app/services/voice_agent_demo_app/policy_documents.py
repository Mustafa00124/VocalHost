"""
Policy documents and RAG system for each business type
"""
from typing import Dict, List
import json

# Policy documents for each business type
POLICY_DOCUMENTS = {
    "restaurant": {
        "name": "Bella Vista Restaurant",
        "vision": "To provide exceptional dining experiences with authentic Italian cuisine in a warm, family-friendly atmosphere",
        "mission": "We create memorable moments through outstanding food, impeccable service, and genuine hospitality",
        "policies": {
            "reservations": {
                "booking_window": "Reservations can be made up to 30 days in advance",
                "cancellation": "Cancellations must be made at least 2 hours before reservation time",
                "no_show": "No-show reservations will be charged $25 per person",
                "group_size": "Groups of 8 or more require a $50 deposit per person",
                "modifications": "Reservation changes can be made up to 1 hour before the time"
            },
            "dining": {
                "dress_code": "Smart casual attire required. No shorts, flip-flops, or athletic wear",
                "children": "Children under 12 must be supervised at all times",
                "allergies": "Please inform us of any allergies when making reservations",
                "outside_food": "No outside food or beverages allowed",
                "smoking": "No smoking anywhere on premises including outdoor seating"
            },
            "service": {
                "gratuity": "18% gratuity automatically added to parties of 6 or more",
                "service_charge": "No additional service charges beyond gratuity",
                "complaints": "Any service issues should be reported to management immediately",
                "special_requests": "Special dietary needs accommodated with 24-hour notice"
            },
            "hours": {
                "monday_thursday": "5:00 PM - 10:00 PM",
                "friday_saturday": "5:00 PM - 11:00 PM", 
                "sunday": "4:00 PM - 9:00 PM",
                "holidays": "Special hours on major holidays - call for details"
            }
        },
        "faq": [
            "Do you take walk-ins? Yes, but reservations are strongly recommended",
            "Is there parking? Valet parking available for $10, street parking limited",
            "Do you have a kids menu? Yes, children's portions available for all pasta dishes",
            "Can I bring my own wine? Yes, corkage fee is $25 per bottle",
            "Do you accommodate large parties? Yes, private dining room available for up to 20 people"
        ]
    },
    
    "salon": {
        "name": "Glamour Studio",
        "vision": "To enhance natural beauty and boost confidence through professional hair, nail, and spa services",
        "mission": "We provide personalized beauty experiences using premium products and expert techniques",
        "policies": {
            "appointments": {
                "booking_window": "Appointments can be scheduled up to 60 days in advance",
                "cancellation": "24-hour notice required for cancellations or rescheduling",
                "late_arrival": "Arriving more than 15 minutes late may result in appointment cancellation",
                "no_show": "No-show appointments will be charged 50% of service cost",
                "modifications": "Appointment changes can be made up to 4 hours before scheduled time"
            },
            "services": {
                "consultation": "Free 15-minute consultation for new clients",
                "color_services": "Color corrections may require multiple sessions",
                "extensions": "Hair extensions require consultation and deposit",
                "nail_art": "Complex nail art designs may require additional time",
                "spa_treatments": "Spa services require 48-hour advance booking"
            },
            "products": {
                "retail": "Professional products available for purchase",
                "warranty": "30-day satisfaction guarantee on all retail products",
                "returns": "Unopened products can be returned within 14 days",
                "exchanges": "Product exchanges available with receipt"
            },
            "hours": {
                "monday_friday": "9:00 AM - 8:00 PM",
                "saturday": "8:00 AM - 6:00 PM",
                "sunday": "10:00 AM - 4:00 PM",
                "holidays": "Limited hours on major holidays"
            }
        },
        "faq": [
            "Do you use organic products? Yes, we offer organic and natural product lines",
            "Can I get a same-day appointment? Limited availability, call to check",
            "Do you do men's services? Yes, we offer full men's grooming services",
            "Is there a waiting area? Yes, comfortable seating with refreshments",
            "Do you offer bridal packages? Yes, comprehensive bridal beauty packages available"
        ]
    },
    
    "ecommerce": {
        "name": "StyleHub Online Store",
        "vision": "To be the premier destination for trendy, affordable fashion that empowers self-expression",
        "mission": "We make fashion accessible to everyone through quality products, competitive prices, and exceptional service",
        "policies": {
            "shipping": {
                "free_shipping": "Free shipping on orders over $75",
                "standard_shipping": "Standard shipping: 3-5 business days ($7.99)",
                "express_shipping": "Express shipping: 1-2 business days ($15.99)",
                "international": "International shipping available to select countries",
                "tracking": "All orders include tracking information"
            },
            "returns": {
                "return_window": "30-day return window from delivery date",
                "condition": "Items must be unworn, with tags, and in original packaging",
                "return_shipping": "Free return shipping for defective items",
                "refund_method": "Refunds processed to original payment method within 5-7 business days",
                "exchanges": "Exchanges available for different sizes/colors"
            },
            "payment": {
                "accepted_cards": "Visa, MasterCard, American Express, Discover",
                "paypal": "PayPal accepted for all orders",
                "apple_pay": "Apple Pay and Google Pay supported",
                "installments": "Buy now, pay later options available",
                "security": "All payments processed securely with SSL encryption"
            },
            "customer_service": {
                "hours": "24/7 online support, phone support 9 AM - 9 PM EST",
                "response_time": "Email responses within 2 hours during business hours",
                "live_chat": "Live chat available during business hours",
                "phone_support": "1-800-STYLE-HUB for immediate assistance"
            }
        },
        "faq": [
            "What sizes do you carry? We carry XS-3XL in most styles",
            "Do you have a size guide? Yes, detailed size charts available for each item",
            "Can I track my order? Yes, tracking information sent via email",
            "Do you offer student discounts? Yes, 10% off with valid student ID",
            "Is there a loyalty program? Yes, earn points on every purchase"
        ]
    },
    
    "dentist": {
        "name": "Bright Smile Dental Practice",
        "vision": "To provide comprehensive dental care that promotes lifelong oral health and beautiful smiles",
        "mission": "We deliver exceptional dental services with compassion, using advanced technology and evidence-based treatments",
        "policies": {
            "appointments": {
                "booking_window": "Appointments can be scheduled up to 90 days in advance",
                "cancellation": "48-hour notice required for cancellations",
                "emergency": "Emergency appointments available same day when possible",
                "no_show": "No-show appointments will be charged $50",
                "rescheduling": "Appointments can be rescheduled up to 24 hours in advance"
            },
            "insurance": {
                "accepted_plans": "We accept most major dental insurance plans",
                "verification": "Insurance benefits verified before treatment",
                "coverage": "Treatment plans provided with cost estimates",
                "payment_plans": "Flexible payment plans available for major procedures",
                "financing": "Third-party financing options available"
            },
            "treatment": {
                "consultation": "Comprehensive consultation for new patients",
                "treatment_plan": "Detailed treatment plan provided before any work",
                "consent": "Informed consent required for all procedures",
                "records": "Complete dental records maintained for all patients",
                "follow_up": "Follow-up care included with major procedures"
            },
            "hours": {
                "monday_thursday": "8:00 AM - 6:00 PM",
                "friday": "8:00 AM - 4:00 PM",
                "saturday": "9:00 AM - 2:00 PM (emergency only)",
                "sunday": "Closed",
                "emergency": "24/7 emergency line available"
            }
        },
        "faq": [
            "Do you accept new patients? Yes, we welcome new patients of all ages",
            "What should I bring to my first visit? Insurance card, ID, and list of current medications",
            "Do you offer sedation dentistry? Yes, various sedation options available",
            "Can I get a cleaning the same day? Depends on availability, call to check",
            "Do you treat children? Yes, we provide family dentistry for all ages"
        ]
    },
    
    "support": {
        "name": "TechSupport Solutions",
        "vision": "To provide world-class technical support that empowers users and resolves issues efficiently",
        "mission": "We deliver exceptional customer service through knowledgeable support, clear communication, and innovative solutions",
        "policies": {
            "support_tiers": {
                "tier_1": "Basic technical support for common issues",
                "tier_2": "Advanced technical support for complex problems",
                "tier_3": "Expert-level support for critical issues",
                "escalation": "Issues escalated based on complexity and impact",
                "response_time": "Tier 1: 2 hours, Tier 2: 4 hours, Tier 3: 1 hour"
            },
            "ticket_management": {
                "creation": "Tickets created via phone, email, or online portal",
                "tracking": "All tickets tracked with unique reference numbers",
                "updates": "Regular updates provided every 24 hours",
                "resolution": "Issues resolved within agreed SLA timeframes",
                "follow_up": "Follow-up calls made after resolution"
            },
            "service_levels": {
                "critical": "System down, business impact - 1 hour response",
                "high": "Major functionality affected - 4 hour response",
                "medium": "Minor issues, workarounds available - 24 hour response",
                "low": "General inquiries, feature requests - 72 hour response"
            },
            "hours": {
                "monday_friday": "6:00 AM - 10:00 PM EST",
                "saturday": "8:00 AM - 6:00 PM EST",
                "sunday": "10:00 AM - 4:00 PM EST",
                "holidays": "Reduced hours on major holidays",
                "emergency": "24/7 support for critical issues"
            }
        },
        "faq": [
            "How do I create a support ticket? Call, email, or use our online portal",
            "What information should I include? Describe the issue, steps to reproduce, and error messages",
            "Can I track my ticket status? Yes, use your ticket number in our tracking system",
            "Do you offer remote support? Yes, secure remote assistance available",
            "Is there a knowledge base? Yes, comprehensive self-help resources available"
        ]
    }
}

def get_policy_document(agent_type: str) -> Dict:
    """Get policy document for specific agent type"""
    return POLICY_DOCUMENTS.get(agent_type, {})

def search_policies(agent_type: str, query: str) -> str:
    """Search policies for specific agent type based on query"""
    if agent_type not in POLICY_DOCUMENTS:
        return "No policy information available for this agent type."
    
    doc = POLICY_DOCUMENTS[agent_type]
    query_lower = query.lower()
    
    # Search through different sections
    results = []
    
    # Search in policies
    for category, policies in doc.get("policies", {}).items():
        for policy_name, policy_text in policies.items():
            if any(keyword in policy_text.lower() for keyword in query_lower.split()):
                results.append(f"**{category.replace('_', ' ').title()} - {policy_name.replace('_', ' ').title()}:**\n{policy_text}")
    
    # Search in FAQ
    for faq_item in doc.get("faq", []):
        if any(keyword in faq_item.lower() for keyword in query_lower.split()):
            results.append(f"**FAQ:** {faq_item}")
    
    # Search in vision/mission
    if any(keyword in doc.get("vision", "").lower() for keyword in query_lower.split()):
        results.append(f"**Vision:** {doc['vision']}")
    
    if any(keyword in doc.get("mission", "").lower() for keyword in query_lower.split()):
        results.append(f"**Mission:** {doc['mission']}")
    
    if results:
        return f"Based on {doc['name']} policies:\n\n" + "\n\n".join(results)
    else:
        return f"No specific policy information found for '{query}' at {doc['name']}. Please contact us for more details."

def get_business_info(agent_type: str) -> str:
    """Get general business information for agent type"""
    if agent_type not in POLICY_DOCUMENTS:
        return "No business information available."
    
    doc = POLICY_DOCUMENTS[agent_type]
    return f"""
**{doc['name']}**
**Vision:** {doc['vision']}
**Mission:** {doc['mission']}

**Business Hours:**
{format_hours(doc.get('policies', {}).get('hours', {}))}

**Key Policies:**
{format_key_policies(doc.get('policies', {}))}
"""

def format_hours(hours_dict: Dict) -> str:
    """Format business hours for display"""
    if not hours_dict:
        return "Hours not specified"
    
    formatted = []
    for key, value in hours_dict.items():
        if key != "holidays":
            day_name = key.replace("_", " ").title()
            formatted.append(f"{day_name}: {value}")
    
    if "holidays" in hours_dict:
        formatted.append(f"Holidays: {hours_dict['holidays']}")
    
    return "\n".join(formatted)

def format_key_policies(policies_dict: Dict) -> str:
    """Format key policies for display"""
    if not policies_dict:
        return "No policies available"
    
    formatted = []
    for category, policies in policies_dict.items():
        if category != "hours":  # Skip hours as they're handled separately
            category_name = category.replace("_", " ").title()
            formatted.append(f"**{category_name}:**")
            for policy_name, policy_text in list(policies.items())[:2]:  # Show first 2 policies
                policy_display = policy_name.replace("_", " ").title()
                formatted.append(f"  • {policy_display}: {policy_text}")
            if len(policies) > 2:
                formatted.append(f"  • ... and {len(policies) - 2} more policies")
            formatted.append("")
    
    return "\n".join(formatted)
