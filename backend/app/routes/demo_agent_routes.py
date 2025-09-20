from flask import Blueprint, request, jsonify
import asyncio
import logging
import json
from ..services.voice_agent_demo_app.demo_agent_sdk import demo_agent

# Configure logging
logger = logging.getLogger(__name__)

# Create blueprint
demo_agent_bp = Blueprint('demo_agent', __name__)

@demo_agent_bp.route("/chat", methods=["POST"])
def chat_endpoint():
    try:
        # Log incoming request
        data = request.get_json(force=True)
        print("🚀 CHAT ENDPOINT - Incoming request")
        print(f"📥 Frontend payload: {data}")
        logger.info("🚀 CHAT ENDPOINT - Incoming request")
        logger.info(f"📥 Frontend payload: {data}")
        
        user_message = data.get("message", "")
        agent_type = data.get("agentType", "restaurant")
        session_id = data.get("sessionId", "default")
        connection_id = data.get("connectionId")  # optional, for lock management

        print(f"📝 Parsed data - Message: '{user_message}', Agent: {agent_type}, Session: {session_id}, Connection: {connection_id}")
        logger.info(f"📝 Parsed data - Message: '{user_message}', Agent: {agent_type}, Session: {session_id}, Connection: {connection_id}")

        if not user_message.strip():
            print("❌ Empty message received")
            logger.warning("❌ Empty message received")
            return jsonify({
                "type": "error",
                "message": "Empty message"
            }), 400

        # Run the async agent call in sync Flask context
        print("🤖 Calling demo_agent.process_message...")
        logger.info("🤖 Calling demo_agent.process_message...")
        agent_response = asyncio.run(
            demo_agent.process_message(
                message=user_message,
                agent_type=agent_type,
                session_id=session_id,
                connection_id=connection_id
            )
        )

        # Extract message and actions from agent response
        if isinstance(agent_response, dict):
            message = agent_response.get("message", "")
            actions = agent_response.get("actions", [])
        else:
            # Fallback for string response
            message = str(agent_response)
            actions = []

        print(f"📤 Backend response: {message[:100]}...")
        print(f"📦 Actions: {actions}")
        logger.info(f"📤 Backend response: {message[:100]}...")
        logger.info(f"📦 Actions: {actions}")

        response_data = {
            "type": "agent_response",
            "message": message,
            "agent_type": agent_type,
            "session_id": session_id,
            "actions": actions
        }
        
        logger.info(f"📦 Final response payload: {response_data}")
        return jsonify(response_data)

    except Exception as e:
        logger.error(f"❌ CHAT ENDPOINT ERROR: {str(e)}", exc_info=True)
        return jsonify({
            "type": "error",
            "message": f"Error: {str(e)}"
        }), 500


@demo_agent_bp.route("/greeting", methods=["GET"])
def greeting_endpoint():
    try:
        agent_type = request.args.get("agentType", "restaurant")
        logger.info(f"🎯 GREETING ENDPOINT - Agent type: {agent_type}")
        
        greeting = asyncio.run(demo_agent.get_greeting(agent_type))
        
        response_data = {
            "type": "greeting",
            "message": greeting,
            "agent_type": agent_type
        }
        
        logger.info(f"📤 Greeting response: {response_data}")
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"❌ GREETING ENDPOINT ERROR: {str(e)}", exc_info=True)
        return jsonify({
            "type": "error",
            "message": f"Error: {str(e)}"
        }), 500


@demo_agent_bp.route("/availability-tool-result", methods=["POST"])
def availability_tool_result_endpoint():
    """Endpoint for frontend to send availability tool results back to backend"""
    try:
        data = request.get_json(force=True)
        print("🔧 AVAILABILITY TOOL RESULT ENDPOINT - Incoming request")
        print(f"📥 Tool result payload: {data}")
        logger.info("🔧 AVAILABILITY TOOL RESULT ENDPOINT - Incoming request")
        logger.info(f"📥 Tool result payload: {data}")
        
        tool_name = data.get("tool_name")
        output = data.get("output")
        agent_type = data.get("agent_type", "restaurant")
        session_id = data.get("session_id", "chat-session")
        connection_id = data.get("connection_id")
        date = data.get("date", "")
        
        if not tool_name or not output:
            return jsonify({
                "type": "error",
                "message": "tool_name and output are required"
            }), 400
        
        print(f"📤 Tool result received: {tool_name} for {agent_type} on {date}")
        print(f"📊 Output: {output}")
        logger.info(f"📤 Tool result received: {tool_name} for {agent_type} on {date}")
        logger.info(f"📊 Output: {output}")
        
        # Feed the tool result back into the agent conversation
        # Create a message that simulates the tool returning its result
        tool_result_message = f"Tool {tool_name} completed successfully. Result: {json.dumps(output)}"
        
        print(f"🔄 Feeding tool result back to agent: {tool_result_message}")
        logger.info(f"🔄 Feeding tool result back to agent: {tool_result_message}")
        
        # Process the tool result through the agent to get a natural language response
        agent_response = asyncio.run(
            demo_agent.process_message(
                message=tool_result_message,
                agent_type=agent_type,
                session_id=session_id,
                connection_id=connection_id
            )
        )
        
        # Extract message and actions from agent response
        if isinstance(agent_response, dict):
            message = agent_response.get("message", "")
            actions = agent_response.get("actions", [])
        else:
            # Fallback for string response
            message = str(agent_response)
            actions = []
        
        print(f"📤 Agent response to tool result: {message[:100]}...")
        print(f"📦 New actions from tool result: {actions}")
        logger.info(f"📤 Agent response to tool result: {message[:100]}...")
        logger.info(f"📦 New actions from tool result: {actions}")
        
        response_data = {
            "type": "agent_response",
            "message": message,
            "agent_type": agent_type,
            "session_id": session_id,
            "actions": actions
        }
        
        logger.info(f"📦 Final tool result response payload: {response_data}")
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"❌ AVAILABILITY TOOL RESULT ENDPOINT ERROR: {str(e)}", exc_info=True)
        return jsonify({
            "type": "error",
            "message": f"Error: {str(e)}"
        }), 500