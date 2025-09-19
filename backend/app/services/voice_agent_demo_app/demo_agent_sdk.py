#!/usr/bin/env python3
"""
Demo Agent using Agents SDK Agent with @function_tool decorators
Text-based chat with tool use and optional memory.
"""

import asyncio
import os
import logging
import ssl
from typing import Optional
from dotenv import load_dotenv

# Disable SSL verification for httpx (used by OpenAI SDK)
import httpx
_old_init = httpx.Client.__init__
def _patched_init(self, *args, **kwargs):
    kwargs['verify'] = False
    return _old_init(self, *args, **kwargs)
httpx.Client.__init__ = _patched_init

from agents import set_default_openai_key, OpenAIConversationsSession, Agent, Runner

# Import our agent creators
from .agent_creators import create_restaurant_agent, get_business_config

# Load env
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DemoAgent:
    """Demo text agent using Agents SDK Agent with proper @function_tool decorators

    Simplified to a single restaurant agent for now.
    """

    def __init__(self):
        logger.info("🚀 Initializing DemoRealtimeAgent...")

        self.api_key = self._load_api_key()
        if not self.api_key:
            raise ValueError("OpenAI API key not found. Please set OPENAI_KEY environment variable.")

        set_default_openai_key(self.api_key)
        
        # Set environment variable for OpenAIConversationsSession
        os.environ["OPENAI_API_KEY"] = self.api_key
        
        # Bypass SSL verification for development
        ssl._create_default_https_context = ssl._create_unverified_context
        os.environ["PYTHONHTTPSVERIFY"] = "0"

        # Create only the restaurant agent for now
        self.agent: Agent | None = None
        self._create_restaurant_agent_only()

        # Memory session (OpenAI-hosted, remembers context automatically)
        # Initialize after API key is set
        self.session = OpenAIConversationsSession()

        # Serialize turns per connection to avoid overlapping responses
        self._locks: dict[str, asyncio.Lock] = {}

        logger.info("🎉 Successfully initialized DemoRealtimeAgent")
        logger.info(f"  🏢 Restaurant agent created successfully")

    def _load_api_key(self) -> Optional[str]:
        api_key = os.getenv("OPENAI_KEY")
        if api_key:
            logger.info(f"🔑 API key loaded: {api_key[:10]}...")
        return api_key

    def _create_restaurant_agent_only(self):
        """Create only the Restaurant Agent instance."""
        self.agent = create_restaurant_agent()



    async def close_session(self, connection_id: str) -> None:
        """Close and remove a session for a given WS connection if it exists."""
        # For now, we just log the session close since we're using OpenAIConversationsSession
        logger.info(f"🔻 Session closed for {connection_id}")

    async def process_message(
        self,
        message: str,
        agent_type: str,
        session_id: str = "default",
        connection_id: str = None,
    ) -> dict:
        """
        Process a message using the appropriate RealtimeAgent for text-only demo.
        Uses RealtimeRunner with event handling and OpenAIConversationsSession for memory.
        """
        print(f"🚀 PROCESS_MESSAGE START - User: '{message}'")
        logger.info(f"🚀 PROCESS_MESSAGE START - User: '{message}', Agent: {agent_type}, Session: {session_id}")
        
        if agent_type != "restaurant" or self.agent is None:
            error_msg = "Sorry, I don't have that agent. Available agent: restaurant"
            logger.error(f"❌ AGENT NOT FOUND: {error_msg}")
            return error_msg

        # Acquire per-connection lock to serialize turns
        lock = self._locks.get(connection_id)
        if lock is None:
            lock = asyncio.Lock()
            self._locks[connection_id] = lock

        async with lock:
            logger.info(f"📤 Running Agent for [{connection_id}] with input: '{message}'")
            logger.info(f"🤖 Agent type: {type(self.agent).__name__}")
            logger.info(f"🔧 Available tools: {[tool.name for tool in self.agent.tools] if hasattr(self.agent, 'tools') else 'No tools found'}")
            
            # Optional: tie runs to a memory session if desired
            result = await Runner.run(self.agent, input=message, session=self.session)
            
            # Log detailed result information
            logger.info(f"🔍 Agent result type: {type(result)}")
            logger.info(f"🔍 Agent result attributes: {dir(result)}")
            
            if hasattr(result, 'messages'):
                logger.info(f"📝 Agent messages count: {len(result.messages) if result.messages else 0}")
                for i, msg in enumerate(result.messages or []):
                    logger.info(f"📝 Message {i}: {type(msg).__name__} - {str(msg)[:200]}...")
            
            if hasattr(result, 'tool_calls'):
                logger.info(f"🔧 Tool calls made: {len(result.tool_calls) if result.tool_calls else 0}")
            
            if hasattr(result, 'tool_results'):
                logger.info(f"🔧 Tool results: {len(result.tool_results) if result.tool_results else 0}")
            
            assistant_response = result.final_output or ""

            # Extract tool results for structured actions
            actions = []
            
            # Check for tool results in new_items
            if hasattr(result, 'new_items') and result.new_items:
                for item in result.new_items:
                    # Look for ToolCallOutputItem which contains the actual tool output
                    if hasattr(item, 'type') and item.type == 'tool_call_output_item':
                        if hasattr(item, 'output') and isinstance(item.output, dict):
                            tool_output = item.output
                            if 'actions' in tool_output:
                                actions.extend(tool_output.get('actions', []))
                                print(f"✅ Extracted {len(tool_output.get('actions', []))} actions from tool output")
                                logger.info(f"✅ Extracted {len(tool_output.get('actions', []))} actions from tool output")

        if not assistant_response:
            assistant_response = "⚠️ No response received from the agent."
            logger.warning("⚠️ NO ASSISTANT RESPONSE RECEIVED")

        logger.info(f"✅ FINAL RESPONSE: {assistant_response[:100]}...")
        logger.info(f"📦 Extracted actions: {actions}")
        
        return {
            "message": assistant_response,
            "actions": actions
        }

    async def get_greeting(self, agent_type: str) -> str:
        config = get_business_config(agent_type)
        return config.get("greeting", "🍽️ Welcome! I can help you book tables or check availability.")

    def get_available_agents(self) -> list:
        return ["restaurant"]

    def get_restaurant_agent(self) -> Agent:
        return self.agent


# Create a global instance
demo_agent = DemoAgent()
