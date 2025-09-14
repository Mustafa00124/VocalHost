"""
Demo voice agent routes using OpenAI Agents SDK
"""
from flask import Blueprint, jsonify, request
from flask_sock import Sock
import asyncio
import os
import json

demo_voice_bp = Blueprint('demo_voice', __name__)
sock = None

def setup_sock(sock_instance):
    global sock
    sock = sock_instance
    # Register the WebSocket route
    sock.route('/ws')(websocket_demo_endpoint)

# Initialize demo agent
try:
    from app.services.voice_agent_demo_app.demo_agent import demo_agent
    DEMO_AGENT_AVAILABLE = True
except Exception as e:
    print(f"Warning: Demo agent not available: {e}")
    DEMO_AGENT_AVAILABLE = False
    demo_agent = None

def websocket_demo_endpoint(ws):
    """WebSocket endpoint for demo voice agent"""
    print("🌐 WebSocket connection attempt received!")
    print(f"🌐 Demo agent available: {DEMO_AGENT_AVAILABLE}")
    
    if not DEMO_AGENT_AVAILABLE:
        print("❌ Demo agent not available, rejecting connection")
        ws.send(json.dumps({
            "type": "error",
            "message": "Demo agent not available. Check API key configuration."
        }))
        return
    
    print("✅ Demo agent available, processing connection...")
    
    # Run the async handler in a new event loop
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(demo_agent.handle_websocket_connection(ws))
    except Exception as e:
        print(f"Error in WebSocket handler: {e}")
        try:
            ws.send(json.dumps({
                "type": "error",
                "message": f"WebSocket error: {str(e)}"
            }))
        except:
            pass
    finally:
        loop.close()

@demo_voice_bp.route('/chat', methods=['POST'])
def chat_with_agent():
    """Chat with the demo agent via HTTP"""
    if not DEMO_AGENT_AVAILABLE:
        return jsonify({
            "status": "error",
            "message": "Demo agent not available. Check API key configuration."
        }), 500
    
    data = request.get_json()
    if not data or 'message' not in data or 'agent_type' not in data:
        return jsonify({
            "status": "error",
            "message": "Missing required fields: message, agent_type"
        }), 400
    
    message = data['message']
    agent_type = data['agent_type']
    session_id = data.get('session_id', 'default')
    
    try:
        # Get the voice agent for the specified type
        if agent_type not in demo_agent.agent_ecosystems:
            return jsonify({
                "status": "error",
                "message": f"Invalid agent type: {agent_type}"
            }), 400
        
        voice_agent = demo_agent.agent_ecosystems[agent_type]["voice"]
        
        # For now, let's use a simple text-based approach
        # We'll simulate the agent response
        response = f"Hello! I'm the {agent_type} assistant. You said: '{message}'. How can I help you today?"
        
        return jsonify({
            "status": "success",
            "response": response,
            "agent_type": agent_type,
            "session_id": session_id
        })
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return jsonify({
            "status": "error",
            "message": f"Chat error: {str(e)}"
        }), 500

@demo_voice_bp.route('/status')
def get_demo_status():
    """Get demo agent status"""
    if not DEMO_AGENT_AVAILABLE:
        return jsonify({
            "error": "Demo agent not available",
            "api_key_configured": bool(os.getenv("OPENAI_API_KEY")),
            "sdk_available": False
        })
    
    return jsonify(demo_agent.get_status())

@demo_voice_bp.route('/tools')
def get_available_tools():
    """Get available tools"""
    if not DEMO_AGENT_AVAILABLE:
        return jsonify({
            "error": "Demo agent not available",
            "tools": [],
            "categories": {}
        })
    
    # Tools are defined directly in demo_agent.py using @function_tool decorators
    return jsonify({
        "tools": ["book_appointment", "cancel_appointment", "add_customer", "add_to_cart", "get_restaurant_policies", "get_salon_policies", "get_ecommerce_policies", "get_dentist_policies", "get_support_policies"],
        "categories": {
            "calendar": ["book_appointment", "cancel_appointment"],
            "crm": ["add_customer"],
            "shopping": ["add_to_cart"],
            "policies": ["get_restaurant_policies", "get_salon_policies", "get_ecommerce_policies", "get_dentist_policies", "get_support_policies"]
        },
        "note": "Multi-agent system with voice, tools, and policy agents for each business type"
    })

@demo_voice_bp.route('/agents')
def get_available_agents():
    """Get available agent types and their ecosystems"""
    if not DEMO_AGENT_AVAILABLE:
        return jsonify({
            "error": "Demo agent not available",
            "agent_types": []
        })
    
    return jsonify({
        "agent_types": ["restaurant", "salon", "ecommerce", "dentist", "support"],
        "ecosystem_structure": {
            "voice_agent": "Handles greetings, conversation, and voice interaction",
            "tools_agent": "Handles all tool operations (booking, CRM, shopping) - no voice",
            "policy_agent": "Provides policy information and RAG knowledge - no voice"
        },
        "note": "Each agent type has a complete ecosystem of specialized agents"
    })