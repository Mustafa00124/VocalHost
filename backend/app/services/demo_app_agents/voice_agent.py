#!/usr/bin/env python3
"""
Realtime Voice Agent using OpenAI's Realtime API
Voice conversations with tool use and state management.
"""

import asyncio
import os
import logging
import ssl
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Disable SSL verification for httpx (used by OpenAI SDK)
import httpx
_old_init = httpx.Client.__init__
def _patched_init(self, *args, **kwargs):
    kwargs['verify'] = False
    return _old_init(self, *args, **kwargs)
httpx.Client.__init__ = _patched_init

from agents import set_default_openai_key, OpenAIConversationsSession
from agents.realtime import RealtimeAgent, RealtimeRunner

# Import our shared tools and configurations
from .agent_creators import create_restaurant_realtime_agent, get_business_config

# Load env
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RealtimeVoiceAgent:
    """Realtime voice agent using OpenAI's Realtime API with tool support"""

    def __init__(self):
        logger.info("🎤 Initializing RealtimeVoiceAgent...")

        self.api_key = self._load_api_key()
        if not self.api_key:
            raise ValueError("OpenAI API key not found. Please set OPENAI_KEY environment variable.")

        set_default_openai_key(self.api_key)
        
        # Set environment variable for OpenAIConversationsSession
        os.environ["OPENAI_API_KEY"] = self.api_key
        
        # Bypass SSL verification for development
        ssl._create_default_https_context = ssl._create_unverified_context
        os.environ["PYTHONHTTPSVERIFY"] = "0"

        # Create the restaurant agent for voice
        self.agent: RealtimeAgent | None = None
        self._create_restaurant_agent()

        # Active sessions per connection
        self._sessions: Dict[str, Any] = {}
        self._runners: Dict[str, RealtimeRunner] = {}

        logger.info("🎉 Successfully initialized RealtimeVoiceAgent")

    def _load_api_key(self) -> Optional[str]:
        api_key = os.getenv("OPENAI_KEY")
        if api_key:
            logger.info(f"🔑 API key loaded: {api_key[:10]}...")
        return api_key

    def _create_restaurant_agent(self):
        """Create the restaurant RealtimeAgent with tools"""
        logger.info("🏗️ Creating restaurant RealtimeAgent...")
        
        # Create RealtimeAgent directly using the dedicated creator
        self.agent = create_restaurant_realtime_agent()
        
        logger.info("✅ Restaurant RealtimeAgent created successfully")

    async def start_session(self, connection_id: str, agent_type: str = "restaurant") -> bool:
        """Start a new realtime voice session for a connection"""
        try:
            logger.info(f"🎤 START_SESSION CALLED for connection {connection_id}, agent_type: {agent_type}")
            print(f"🎤 START_SESSION CALLED for connection {connection_id}, agent_type: {agent_type}")
            print(f"🔍 Current sessions count: {len(self._sessions)}")
            print(f"🔍 Current runners count: {len(self._runners)}")
            
            if connection_id in self._sessions:
                logger.warning(f"Session already exists for connection {connection_id}")
                print(f"Session already exists for connection {connection_id}")
                return False

            if agent_type != "restaurant" or self.agent is None:
                logger.error(f"Agent type {agent_type} not supported or agent is None")
                print(f"Agent type {agent_type} not supported or agent is None")
                print(f"🔍 Agent is None: {self.agent is None}")
                return False

            logger.info(f"🎤 Starting REAL Realtime API session for connection {connection_id}")
            print(f"🎤 Starting REAL Realtime API session for connection {connection_id}")

            # Create RealtimeRunner with proper voice configuration
            logger.info(f"🏗️ Creating RealtimeRunner...")
            print(f"🏗️ Creating RealtimeRunner...")
            print(f"🔍 Agent name: {self.agent.name if self.agent else 'None'}")
            print(f"🔍 Agent tools count: {len(self.agent.tools) if self.agent else 0}")
            print(f"🏗️ Creating RealtimeRunner...")
            
            runner = RealtimeRunner(
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

            logger.info(f"✅ RealtimeRunner created successfully")
            print(f"✅ RealtimeRunner created successfully")
            print(f"🔍 Runner type: {type(runner).__name__}")
            print(f"🔍 Runner config: {runner.config}")

            # Start the REAL RealtimeRunner session
            logger.info(f"🚀 Starting RealtimeRunner.run()...")
            print(f"🚀 Starting RealtimeRunner.run()...")
            print(f"🔍 About to call runner.run() for connection {connection_id}")
            
            try:
                session = await runner.run()
                logger.info(f"✅ RealtimeRunner.run() completed successfully")
                print(f"✅ RealtimeRunner.run() completed successfully")
                print(f"🔍 Session type: {type(session).__name__}")
                print(f"🔍 Session object: {session}")
            except Exception as e:
                logger.error(f"❌ RealtimeRunner.run() failed: {str(e)}")
                print(f"❌ RealtimeRunner.run() failed: {str(e)}")
                print(f"❌ Exception type: {type(e).__name__}")
                raise
            
            # Store session and runner
            self._sessions[connection_id] = session
            self._runners[connection_id] = runner

            logger.info(f"✅ REAL Realtime API session started for connection {connection_id}")
            logger.info(f"🎯 Session type: {type(session).__name__}")
            logger.info(f"🎯 Runner type: {type(runner).__name__}")
            print(f"✅ REAL Realtime API session started for connection {connection_id}")
            print(f"🎯 Session type: {type(session).__name__}")
            print(f"🎯 Runner type: {type(runner).__name__}")
            
            # Trigger greeting message using Realtime API events
            logger.info(f"🎤 Triggering greeting message using Realtime API events...")
            print(f"🎤 Triggering greeting message using Realtime API events...")
            try:
                # Send Realtime API events to trigger greeting
                import uuid
                
                # 1. Create conversation item with greeting text
                conversation_item_event = {
                    "event_id": f"event_{uuid.uuid4()}",
                    "type": "conversation.item.create",
                    "item": {
                        "type": "text",
                        "content": "Hello! I am VocalHost, your AI restaurant assistant. How can I help you today?"
                    }
                }
                
                # 2. Create response to trigger speech
                response_event = {
                    "event_id": f"event_{uuid.uuid4()}",
                    "type": "response.create"
                }
                
                # Send events to RealtimeRunner
                if hasattr(runner, 'send_event'):
                    await runner.send_event(conversation_item_event)
                    await runner.send_event(response_event)
                    logger.info(f"✅ Greeting events sent to RealtimeRunner")
                    print(f"✅ Greeting events sent to RealtimeRunner")
                elif hasattr(runner, 'input_event'):
                    await runner.input_event(conversation_item_event)
                    await runner.input_event(response_event)
                    logger.info(f"✅ Greeting events input to RealtimeRunner")
                    print(f"✅ Greeting events input to RealtimeRunner")
                else:
                    logger.warning(f"⚠️ RealtimeRunner doesn't have send_event or input_event method")
                    print(f"⚠️ RealtimeRunner doesn't have send_event or input_event method")
                    logger.warning(f"⚠️ Available methods: {[method for method in dir(runner) if not method.startswith('_')]}")
                    print(f"⚠️ Available methods: {[method for method in dir(runner) if not method.startswith('_')]}")
                    
            except Exception as greeting_error:
                logger.error(f"❌ Error sending greeting events: {str(greeting_error)}")
                print(f"❌ Error sending greeting events: {str(greeting_error)}")
            
            return True

        except Exception as e:
            logger.error(f"❌ Failed to start REAL Realtime session for {connection_id}: {str(e)}")
            logger.error(f"❌ Error details: {str(e)}", exc_info=True)
            print(f"❌ Failed to start REAL Realtime session for {connection_id}: {str(e)}")
            print(f"❌ Error details: {str(e)}")
            return False

    async def end_session(self, connection_id: str) -> bool:
        """End a realtime voice session for a connection"""
        try:
            if connection_id not in self._sessions:
                logger.warning(f"No session found for connection {connection_id}")
                return False

            logger.info(f"🔻 Ending voice session for connection {connection_id}")

            # Close the session
            session = self._sessions[connection_id]
            await session.aclose()

            # Clean up
            del self._sessions[connection_id]
            del self._runners[connection_id]

            logger.info(f"✅ Voice session ended for connection {connection_id}")
            return True

        except Exception as e:
            logger.error(f"❌ Failed to end voice session for {connection_id}: {str(e)}")
            return False

    async def get_session(self, connection_id: str) -> Optional[Any]:
        """Get the session for a connection"""
        return self._sessions.get(connection_id)

    async def process_audio_event(self, connection_id: str, event_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Process audio events from the frontend"""
        try:
            logger.info(f"🎤 Processing audio event for connection {connection_id}: {event_data.get('type', 'unknown')}")
            print(f"🎤 Processing audio event for connection {connection_id}: {event_data.get('type', 'unknown')}")
            print(f"📊 Event data keys: {list(event_data.keys())}")
            print(f"📝 Full event data: {event_data}")
            
            session = self._sessions.get(connection_id)
            if not session:
                logger.error(f"No session found for connection {connection_id}")
                print(f"No session found for connection {connection_id}")
                print(f"🔍 Available sessions: {list(self._sessions.keys())}")
                return None

            # Handle different event types
            event_type = event_data.get("type")
            logger.info(f"🔍 Processing event type: {event_type}")
            print(f"🔍 Processing event type: {event_type}")
            print(f"🔍 Session type: {type(session).__name__}")
            
            if event_type == "audio_data":
                # Process real audio data from microphone
                audio_data = event_data.get("audio_data")
                audio_format = event_data.get("format", "pcm16")
                
                logger.info(f"🎵 Sending REAL audio to RealtimeSession for connection {connection_id}, format: {audio_format}, size: {len(audio_data) if audio_data else 0} bytes")
                
                # Send audio data to the RealtimeSession
                try:
                    # Use the session's send_audio method
                    await session.send_audio(audio_data)
                    logger.info(f"✅ Audio sent to RealtimeSession successfully")
                except Exception as audio_error:
                    logger.error(f"❌ Error sending audio to RealtimeSession: {str(audio_error)}")
                
                return {"status": "processed", "audio_size": len(audio_data) if audio_data else 0}
            
            elif event_type == "interrupt":
                # Handle interrupt signal
                try:
                    await session.interrupt()
                    logger.info(f"✅ Interrupt sent to RealtimeSession for {connection_id}")
                except Exception as interrupt_error:
                    logger.error(f"❌ Error sending interrupt: {str(interrupt_error)}")
                return {"status": "interrupted"}
            
            elif event_type == "commit_audio":
                # Force close the current input audio turn
                try:
                    await session.send_event({"type": "input_audio_buffer.commit"})
                    logger.info(f"✅ Audio commit sent to RealtimeSession for {connection_id}")
                except Exception as commit_error:
                    logger.error(f"❌ Error committing audio: {str(commit_error)}")
                return {"status": "audio_committed"}
            
            elif event_type == "image":
                # Handle image upload
                data_url = event_data.get("data_url")
                prompt_text = event_data.get("text", "Please describe this image.")
                
                if data_url:
                    try:
                        # Send image message to the session
                        await session.send_message({
                            "type": "message",
                            "role": "user", 
                            "content": [
                                {"type": "input_image", "image_url": data_url, "detail": "high"},
                                {"type": "input_text", "text": prompt_text}
                            ]
                        })
                        logger.info(f"✅ Image sent to RealtimeSession for {connection_id}")
                    except Exception as image_error:
                        logger.error(f"❌ Error sending image: {str(image_error)}")
                    return {"status": "image_sent"}
                else:
                    return {"status": "error", "message": "No data_url provided"}
            
            elif event_type == "audio_end":
                logger.info(f"🔚 Audio ended for connection {connection_id}")
                return {"status": "audio_ended"}
            
            else:
                logger.warning(f"Unknown event type: {event_type}")
                return {"status": "unknown_event"}

        except Exception as e:
            logger.error(f"❌ Error processing audio event for {connection_id}: {str(e)}")
            return {"status": "error", "message": str(e)}

    async def get_session_events(self, connection_id: str):
        """Generator to yield events from a session"""
        try:
            session = self._sessions.get(connection_id)
            if not session:
                logger.error(f"No session found for connection {connection_id}")
                return

            logger.info(f"🎧 Starting RealtimeSession event loop for connection {connection_id}")
            logger.info(f"🎯 Session type: {type(session).__name__}")
            print(f"🎧 Starting RealtimeSession event loop for connection {connection_id}")
            print(f"🎯 Session type: {type(session).__name__}")
            
            # Use the RealtimeSession directly
            try:
                event_count = 0
                async for event in session:
                    event_count += 1
                    try:
                        # Process different event types from RealtimeSession
                        event_type = getattr(event, 'type', 'unknown')
                        
                        logger.info(f"🎧 RealtimeSession event #{event_count} received: {event_type}")
                        print(f"🎧 RealtimeSession event #{event_count} received: {event_type}")
                        print(f"🔍 Event type: {type(event).__name__}")
                        print(f"🔍 Event attributes: {[attr for attr in dir(event) if not attr.startswith('_')]}")
                        
                        if event_type == "agent_start":
                            agent_name = getattr(event, 'agent', {}).get('name', 'Unknown Agent')
                            logger.info(f"🤖 Agent started: {agent_name}")
                            yield {
                                "type": "agent_start",
                                "agent_name": agent_name,
                                "connection_id": connection_id
                            }
                        
                        elif event_type == "agent_end":
                            agent_name = getattr(event, 'agent', {}).get('name', 'Unknown Agent')
                            logger.info(f"🤖 Agent ended: {agent_name}")
                            yield {
                                "type": "agent_end", 
                                "agent_name": agent_name,
                                "connection_id": connection_id
                            }
                        
                        elif event_type == "tool_start":
                            tool_name = getattr(event, 'tool', {}).get('name', 'Unknown Tool')
                            logger.info(f"🔧 Tool started: {tool_name}")
                            yield {
                                "type": "tool_start",
                                "tool_name": tool_name,
                                "connection_id": connection_id
                            }
                        
                        elif event_type == "tool_end":
                            tool_name = getattr(event, 'tool', {}).get('name', 'Unknown Tool')
                            output = getattr(event, 'output', {})
                            logger.info(f"🔧 Tool ended: {tool_name}")
                            yield {
                                "type": "tool_end",
                                "tool_name": tool_name,
                                "output": output,
                                "connection_id": connection_id
                            }
                        
                        elif event_type == "audio":
                            # Stream audio data to frontend
                            audio_data = getattr(event, 'audio', b'')
                            logger.info(f"🎵 Audio streaming: {len(audio_data)} bytes")
                            yield {
                                "type": "audio",
                                "audio": audio_data,
                                "connection_id": connection_id
                            }
                        
                        elif event_type == "audio_end":
                            logger.info("🔚 Audio ended")
                            yield {
                                "type": "audio_end",
                                "connection_id": connection_id
                            }
                        
                        elif event_type == "audio_interrupted":
                            logger.info("⏸️ Audio interrupted")
                            yield {
                                "type": "audio_interrupted",
                                "connection_id": connection_id
                            }
                        
                        elif event_type == "history_updated":
                            history = getattr(event, 'history', [])
                            logger.info(f"📚 History updated: {len(history)} items")
                            yield {
                                "type": "history_updated",
                                "history": [item.model_dump(mode="json") for item in history] if hasattr(history[0], 'model_dump') else history,
                                "connection_id": connection_id
                            }
                        
                        elif event_type == "history_added":
                            item = getattr(event, 'item', None)
                            logger.info(f"📚 History item added")
                            yield {
                                "type": "history_added",
                                "item": item.model_dump(mode="json") if hasattr(item, 'model_dump') else item,
                                "connection_id": connection_id
                            }
                        
                        elif event_type == "error":
                            error_msg = getattr(event, 'error', 'Unknown error')
                            logger.error(f"❌ RealtimeSession error: {error_msg}")
                            yield {
                                "type": "error",
                                "error": str(error_msg),
                                "connection_id": connection_id
                            }
                        
                        else:
                            logger.debug(f"🔍 Unknown event type: {event_type}")
                            
                    except Exception as e:
                        logger.error(f"❌ Error processing event: {str(e)}")
                        yield {
                            "type": "error",
                            "error": f"Event processing error: {str(e)}",
                            "connection_id": connection_id
                        }
                        
            except Exception as context_error:
                logger.error(f"❌ Error in RealtimeSession event loop: {str(context_error)}")
                yield {
                    "type": "error",
                    "error": f"RealtimeSession error: {str(context_error)}",
                    "connection_id": connection_id
                }

        except Exception as e:
            logger.error(f"❌ Error in session event loop for {connection_id}: {str(e)}")
            yield {
                "type": "error",
                "error": f"Session error: {str(e)}",
                "connection_id": connection_id
            }

    def get_available_agents(self) -> list:
        """Get list of available agent types"""
        return ["restaurant"]

    def is_session_active(self, connection_id: str) -> bool:
        """Check if a session is active for a connection"""
        return connection_id in self._sessions


# Create a global instance
realtime_voice_agent = RealtimeVoiceAgent()
