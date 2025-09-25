#!/usr/bin/env python3
"""
Minimal Realtime Voice Agent
Using OpenAI's Realtime API with a restaurant agent
"""

import logging
import os
from dotenv import load_dotenv
from agents import set_default_openai_key
from agents.realtime import RealtimeRunner
from .agent_creators import create_restaurant_realtime_agent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RealtimeVoiceAgent:
    def __init__(self):
        logger.info("🎤 Initializing RealtimeVoiceAgent...")

        # Load environment variables
        load_dotenv()
        api_key = os.getenv("OPENAI_KEY")
        if not api_key:
            raise ValueError("❌ OPENAI_KEY not found in .env")

        # Set API key globally for SDK
        set_default_openai_key(api_key)
        os.environ["OPENAI_API_KEY"] = api_key

        # Create the restaurant agent
        self.agent = create_restaurant_realtime_agent()

        # Runner configuration
        logger.info("🎤 Creating RealtimeRunner...")
        self.runner = RealtimeRunner(
            starting_agent=self.agent,
            config={
                "model_settings": {
                    "model_name": "gpt-realtime",
                    "voice": "ash",
                    "modalities": ["audio"],
                    "input_audio_format": "pcm16",
                    "output_audio_format": "pcm16",
                    "input_audio_transcription": {"model": "gpt-4o-mini-transcribe"},
                    "turn_detection": {"type": "semantic_vad", "interrupt_response": True},
                }
            }
        )
        logger.info("✅ RealtimeVoiceAgent ready")

    async def create_session(self):
        """
        Create and return a new realtime session.
        The caller (e.g. WebSocket endpoint) is responsible for:
          - async with session
          - async for event in session
        """
        session = await self.runner.run()
        return session


# Global instance (so routes can import it)
# realtime_voice_agent = RealtimeVoiceAgent()
