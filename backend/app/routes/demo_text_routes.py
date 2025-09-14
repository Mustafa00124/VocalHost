"""
Text-based demo agent routes using OpenAI Agents SDK
"""
from flask import Blueprint, jsonify, request
import asyncio
import os
import json
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

demo_text_bp = Blueprint('demo_text', __name__)

# Initialize text agent
logger.info("🔄 Initializing text agent...")
try:
    from app.services.voice_agent_demo_app.demo_text_agent import text_agent
    TEXT_AGENT_AVAILABLE = True
    logger.info("✅ Text agent imported successfully")
    logger.info(f"🔑 Text agent API key status: {bool(text_agent.api_key)}")
    logger.info(f"🤖 Available agents: {list(text_agent.agents.keys()) if hasattr(text_agent, 'agents') else 'None'}")
except Exception as e:
    logger.error(f"❌ Failed to import text agent: {e}")
    import traceback
    logger.error(f"❌ Traceback: {traceback.format_exc()}")
    TEXT_AGENT_AVAILABLE = False
    text_agent = None

@demo_text_bp.route('/chat', methods=['POST'])
def chat_with_agent():
    """Chat with the text agent via HTTP"""
    if not TEXT_AGENT_AVAILABLE:
        return jsonify({
            "status": "error",
            "message": "Text agent not available. Check API key configuration."
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
        # Process the message using the text agent
        response = asyncio.run(text_agent.process_text_message(
            message=message,
            agent_type=agent_type,
            session_id=session_id
        ))
        
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

@demo_text_bp.route('/greeting', methods=['POST'])
def get_greeting():
    """Get greeting message for agent type"""
    if not TEXT_AGENT_AVAILABLE:
        return jsonify({
            "status": "error",
            "message": "Text agent not available. Check API key configuration."
        }), 500
    
    data = request.get_json()
    if not data or 'agent_type' not in data:
        return jsonify({
            "status": "error",
            "message": "Missing required field: agent_type"
        }), 400
    
    agent_type = data['agent_type']
    
    try:
        greeting = text_agent.get_greeting(agent_type)
        
        return jsonify({
            "status": "success",
            "greeting": greeting,
            "agent_type": agent_type
        })
        
    except Exception as e:
        print(f"Error getting greeting: {e}")
        return jsonify({
            "status": "error",
            "message": f"Greeting error: {str(e)}"
        }), 500

@demo_text_bp.route('/status')
def get_text_status():
    """Get text agent status"""
    if not TEXT_AGENT_AVAILABLE:
        return jsonify({
            "status": "error",
            "message": "Text agent not available",
            "api_key_configured": bool(os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_KEY")),
            "sdk_available": False
        }), 500
    
    return jsonify({
        "status": "ok",
        **text_agent.get_status()
    })

@demo_text_bp.route('/session/<session_id>')
def get_session_status(session_id):
    """Get status for specific session"""
    if not TEXT_AGENT_AVAILABLE:
        return jsonify({
            "status": "error",
            "message": "Text agent not available"
        }), 500
    
    return jsonify(text_agent.get_session_status(session_id))

@demo_text_bp.route('/agents')
def get_available_agents():
    """Get available agent types"""
    if not TEXT_AGENT_AVAILABLE:
        return jsonify({
            "status": "error",
            "message": "Text agent not available",
            "agents": []
        }), 500
    
    return jsonify({
        "status": "success",
        "agents": text_agent.get_available_agents(),
        "agent_configs": {
            agent_type: text_agent.get_agent_info(agent_type)
            for agent_type in text_agent.get_available_agents()
        }
    })

@demo_text_bp.route('/chat/auto', methods=['POST'])
def chat_with_auto_routing():
    """Chat with automatic multi-agent routing"""
    logger.info("🎯 Auto-routing chat endpoint called")
    
    if not TEXT_AGENT_AVAILABLE:
        logger.error("❌ Text agent not available")
        return jsonify({
            "status": "error",
            "message": "Text agent not available. Check API key configuration."
        }), 500
    
    data = request.get_json()
    logger.info(f"📥 Received data: {data}")
    
    if not data or 'message' not in data:
        logger.error("❌ Missing required fields")
        return jsonify({
            "status": "error",
            "message": "Missing required field: message"
        }), 400
    
    message = data['message']
    session_id = data.get('session_id', 'default')
    
    logger.info(f"🎯 Auto-routing: message='{message[:50]}...', session_id='{session_id}'")
    
    try:
        # Process the message with automatic routing
        logger.info("🚀 Calling text_agent.process_text_message_with_routing()...")
        response = asyncio.run(text_agent.process_text_message_with_routing(
            message=message,
            session_id=session_id
        ))
        logger.info(f"✅ Auto-routing response received: {len(response) if response else 0} characters")
        
        return jsonify({
            "status": "success",
            "response": response,
            "routing": "auto",
            "session_id": session_id
        })
        
    except Exception as e:
        logger.error(f"❌ Error in auto-routing chat endpoint: {e}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        return jsonify({
            "status": "error",
            "message": f"Error processing message: {str(e)}"
        }), 500
