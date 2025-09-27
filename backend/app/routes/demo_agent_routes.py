from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Any
import asyncio
import logging
import json
from ..services.demo_app_agents.text_agent import demo_agent

# Configure logging
logger = logging.getLogger(__name__)

# Create router
demo_agent_router = APIRouter(prefix="/api", tags=["demo"])

# Pydantic models for request/response
class ChatRequest(BaseModel):
    message: str
    agentType: str = "restaurant"
    sessionId: str = "default"
    connectionId: Optional[str] = None

class ToolResultRequest(BaseModel):
    tool_name: str
    output: dict
    agent_type: str = "restaurant"
    session_id: str = "chat-session"
    connection_id: Optional[str] = None
    date: str = ""
    customer_name: Optional[str] = None
    time: Optional[str] = None

class AgentResponse(BaseModel):
    type: str
    message: str
    agent_type: str
    session_id: str
    actions: List[Any] = []

@demo_agent_router.post("/chat", response_model=AgentResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        # Log incoming request
        print("🚀 CHAT ENDPOINT - Incoming request")
        print(f"📥 Frontend payload: {request.dict()}")
        logger.info("🚀 CHAT ENDPOINT - Incoming request")
        logger.info(f"📥 Frontend payload: {request.dict()}")
        
        user_message = request.message
        agent_type = request.agentType
        session_id = request.sessionId
        connection_id = request.connectionId

        print(f"📝 Parsed data - Message: '{user_message}', Agent: {agent_type}, Session: {session_id}, Connection: {connection_id}")
        logger.info(f"📝 Parsed data - Message: '{user_message}', Agent: {agent_type}, Session: {session_id}, Connection: {connection_id}")

        if not user_message.strip():
            print("❌ Empty message received")
            logger.warning("❌ Empty message received")
            raise HTTPException(status_code=400, detail="Empty message")

        # Run the async agent call
        print("🤖 Calling demo_agent.process_message...")
        logger.info("🤖 Calling demo_agent.process_message...")
        agent_response = await demo_agent.process_message(
            message=user_message,
            agent_type=agent_type,
            session_id=session_id,
            connection_id=connection_id
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

        response_data = AgentResponse(
            type="agent_response",
            message=message,
            agent_type=agent_type,
            session_id=session_id,
            actions=actions
        )
        
        logger.info(f"📦 Final response payload: {response_data.dict()}")
        return response_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ CHAT ENDPOINT ERROR: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@demo_agent_router.get("/greeting")
async def greeting_endpoint(agentType: str = Query("restaurant", alias="agentType")):
    try:
        agent_type = agentType
        logger.info(f"🎯 GREETING ENDPOINT - Agent type: {agent_type}")
        
        greeting = await demo_agent.get_greeting(agent_type)
        
        response_data = {
            "type": "greeting",
            "message": greeting,
            "agent_type": agent_type
        }
        
        logger.info(f"📤 Greeting response: {response_data}")
        return response_data
        
    except Exception as e:
        logger.error(f"❌ GREETING ENDPOINT ERROR: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@demo_agent_router.post("/availability-tool-result", response_model=AgentResponse)
async def availability_tool_result_endpoint(request: ToolResultRequest):
    """Endpoint for frontend to send availability tool results back to backend"""
    try:
        print("🔧 AVAILABILITY TOOL RESULT ENDPOINT - Incoming request")
        print(f"📥 Tool result payload: {request.dict()}")
        logger.info("🔧 AVAILABILITY TOOL RESULT ENDPOINT - Incoming request")
        logger.info(f"📥 Tool result payload: {request.dict()}")
        
        tool_name = request.tool_name
        output = request.output
        agent_type = request.agent_type
        session_id = request.session_id
        connection_id = request.connection_id
        date = request.date
        
        if not tool_name or not output:
            raise HTTPException(status_code=400, detail="tool_name and output are required")
        
        print(f"📤 Tool result received: {tool_name} for {agent_type} on {date}")
        print(f"📊 Output: {output}")
        logger.info(f"📤 Tool result received: {tool_name} for {agent_type} on {date}")
        logger.info(f"📊 Output: {output}")
        
        # Handle different tool result types
        if tool_name == 'check_booking':
            # Handle booking verification result from frontend
            success = output.get('success', False)
            cancelled = output.get('cancelled', False)
            message = output.get('message', '')
            
            if success and cancelled:
                # Booking was successfully cancelled in frontend
                customer_name = request.customer_name or ''
                booking_date = request.date
                booking_time = request.time or ''
                
                print(f"✅ Booking successfully cancelled in frontend for {customer_name} on {booking_date} at {booking_time}")
                logger.info(f"✅ Booking successfully cancelled in frontend for {customer_name} on {booking_date} at {booking_time}")
                
                # Create success message for agent
                tool_result_message = f"Booking cancellation successful. {message} Please confirm to the customer that their reservation has been cancelled."
            else:
                # Booking not found or cancellation failed
                customer_name = request.customer_name or ''
                booking_date = request.date
                booking_time = request.time or ''
                
                print(f"❌ Booking not found or cancellation failed for {customer_name} on {booking_date} at {booking_time}")
                logger.info(f"❌ Booking not found or cancellation failed for {customer_name} on {booking_date} at {booking_time}")
                
                # Create not found message for agent
                tool_result_message = f"Booking cancellation failed. {message} Please inform the customer that no such booking exists."
        else:
            # Handle other tool results (like check_availability)
            tool_result_message = f"Tool {tool_name} completed successfully. Result: {json.dumps(output)}"
        
        print(f"🔄 Feeding tool result back to agent: {tool_result_message}")
        logger.info(f"🔄 Feeding tool result back to agent: {tool_result_message}")
        
        # Process the tool result through the agent to get a natural language response
        agent_response = await demo_agent.process_message(
            message=tool_result_message,
            agent_type=agent_type,
            session_id=session_id,
            connection_id=connection_id
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
        
        response_data = AgentResponse(
            type="agent_response",
            message=message,
            agent_type=agent_type,
            session_id=session_id,
            actions=actions
        )
        
        logger.info(f"📦 Final tool result response payload: {response_data.dict()}")
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ AVAILABILITY TOOL RESULT ENDPOINT ERROR: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")