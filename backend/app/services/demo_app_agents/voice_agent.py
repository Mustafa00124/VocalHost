#!/usr/bin/env python3
"""
Minimal Realtime Voice Agent
Using OpenAI's Realtime API with a restaurant agent
"""

import asyncio
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

    async def run(self):
        session = await self.runner.run()
        async with session:
            print("🎤 Session started! Listening for events...")
            async for event in session:
                etype = event.type
                if etype == "agent_start":
                    print("🤖 Agent started speaking")
                elif etype == "agent_end":
                    print("🤖 Agent finished speaking")
                elif etype == "tool_start":
                    print(f"🛠️ Tool started: {event.tool.name}")
                elif etype == "tool_end":
                    print(f"🛠️ Tool ended: {event.tool.name}, output={event.output}")
                elif etype == "audio":
                    print(f"🔊 Got audio chunk ({len(event.audio)} bytes)")
                elif etype == "audio_end":
                    print("🔊 Audio finished")
                elif etype == "audio_interrupted":
                    print("⏸️ Audio interrupted")
                elif etype == "history_added":
                    print("📜 History item added")
                elif etype == "history_updated":
                    print("📜 History updated")
                elif etype == "error":
                    print(f"❌ Error: {event.error}")
                else:
                    print(f"ℹ️ Unknown event: {etype}")

# Global instance (so routes can import it)
realtime_voice_agent = RealtimeVoiceAgent()
