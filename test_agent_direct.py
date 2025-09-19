#!/usr/bin/env python3
"""
Text-only Realtime Agent with OpenAI Conversations Session Memory
This example:
- Uses RealtimeAgent in text-only mode (modalities=["text"])
- Runs with RealtimeRunner (no audio)
- Persists conversation history automatically using OpenAIConversationsSession
"""

import asyncio
import os
import logging
from typing import Optional

from dotenv import load_dotenv

# Agents SDK imports
from agents import set_default_openai_key
from agents.realtime import RealtimeAgent, RealtimeRunner
from agents import OpenAIConversationsSession

# Import your function tools (decorated with @function_tool)
from .agent_creators import (
    book_reservation, check_availability, cancel_booking,
    add_customer, remove_customer, add_to_cart, remove_from_cart
)

# Load env
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DemoAgentDirect:
    def __init__(self):
        logger.info("🚀 Initializing TextRealtimeAgentWithMemory...")

        self.api_key = self._load_api_key()
        if not self.api_key:
            raise ValueError("OpenAI API key not found. Please set OPENAI_KEY environment variable.")

        set_default_openai_key(self.api_key)

        # Create a single text agent
        self.agent = RealtimeAgent(
            name="Assistant",
            instructions="You are a helpful assistant. Keep responses concise and conversational.",
            tools=[book_reservation, check_availability, cancel_booking,
                   add_customer, remove_customer, add_to_cart, remove_from_cart]
        )

        # Attach memory session (OpenAI-hosted)
        self.session = OpenAIConversationsSession()
        logger.info("💾 Using OpenAI Conversations Session for memory.")

    def _load_api_key(self) -> Optional[str]:
        api_key = os.getenv("OPENAI_KEY")
        if api_key:
            logger.info(f"🔑 API key loaded: {api_key[:10]}...")
        return api_key

    async def chat(self):
        """
        Run an interactive text chat with memory.
        Each input is remembered by the agent across turns.
        """
        runner = RealtimeRunner(
            starting_agent=self.agent,
            config={
                "model_settings": {
                    "model_name": "gpt-realtime",   # realtime text model
                    "modalities": ["text"],        # text-only
                }
            }
        )

        # Start session
        session = await runner.run()

        async with session:
            print("=== Text Realtime Agent (with memory) ===")
            print("Type 'exit' to quit.\n")

            while True:
                user_input = input("You: ")
                if user_input.strip().lower() in {"exit", "quit"}:
                    print("👋 Ending session.")
                    break

                # Send user input to the agent with memory
                result = await runner.run(
                    self.agent,
                    user_input,
                    session=self.session,   # memory-enabled session
                )

                # Print the agent's final response
                print(f"Assistant: {result.final_output}")


# Entrypoint
if __name__ == "__main__":
    agent = DemoAgentDirect()
    asyncio.run(agent.chat())
