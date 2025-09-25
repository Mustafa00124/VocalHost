#!/usr/bin/env python3
"""
Working WebSocket endpoint for RealtimeVoiceAgent (Flask-Sock)
"""

import json
import logging
import struct
import asyncio
import base64
from flask import Blueprint
from flask_sock import Sock

logger = logging.getLogger(__name__)
realtime_ws_bp = Blueprint("realtime_ws", __name__)

def init_realtime_websocket(sock: Sock):
    @sock.route("/ws")
    def websocket_endpoint(ws):
        logger.info("🔌 Client connected to /ws")

        async def handle_session():
            # Create a fresh RealtimeRunner for this WebSocket connection
            from agents.realtime import RealtimeRunner
            from ..services.demo_app_agents.agent_creators import create_restaurant_realtime_agent
            import uuid
            
            # Create a unique session ID to avoid conflicts
            session_id = str(uuid.uuid4())
            logger.info(f"🎤 Creating session {session_id}")
            
            # Add a small delay to ensure any previous connections are fully closed
            await asyncio.sleep(0.1)
            
            logger.info("🎤 Creating RealtimeAgent")
            agent = create_restaurant_realtime_agent()
            logger.info("🎤 Creating RealtimeRunner")
            runner = RealtimeRunner(
                starting_agent=agent,
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
            logger.info("🎤 RealtimeRunner created with full config")
            
            # Store session context for proper cleanup
            session_context = None
            forward_task = None
            
            try:
                logger.info("🎤 Running RealtimeRunner")
                session_context = await runner.run()
                logger.info("🎤 Session context created")
                
                # Follow official server.py pattern exactly
                session = await session_context.__aenter__()
                logger.info("🎤 Session entered")
                logger.info("🎤 Session ID: %s", session_id)
                
                # Debug session connection
                logger.info(f"🎤 Session type: {type(session)}")
                logger.info(f"🎤 Session attributes: {dir(session)}")
                if hasattr(session, 'model'):
                    logger.info(f"🎤 Session model: {type(session.model)}")
                    if hasattr(session.model, '_websocket'):
                        logger.info(f"🎤 Model WebSocket: {session.model._websocket}")
                else:
                    logger.warning("⚠️ Session has no model attribute")
                
                # Task 1: forward events from model → client
                async def forward_events():
                    logger.info("🎤 Starting to listen for AI events...")
                    event_count = 0
                    try:
                        # Add a timeout to see if we get any events at all
                        import asyncio
                        logger.info("🎤 Waiting for AI events (timeout: 30 seconds)...")
                        
                        async for event in session:
                            event_count += 1
                            logger.info(f"🎤 Received AI event #{event_count}: {event.type}")
                            try:
                                if event.type == "audio":
                                    logger.info(f"🎤 Forwarding AI audio to client (size: {len(event.audio.data)})")
                                    try:
                                        ws.send(json.dumps({
                                            "type": "audio",
                                            "data": base64.b64encode(event.audio.data).decode("utf-8")
                                        }))
                                        logger.info("🎤 AI audio sent successfully to client")
                                    except Exception as send_error:
                                        logger.error(f"❌ Error sending AI audio: {send_error}")
                                else:
                                    logger.info(f"🎤 Forwarding AI event to client: {event.type}")
                                    try:
                                        ws.send(json.dumps({"type": event.type}))
                                        logger.info(f"🎤 AI event '{event.type}' sent successfully to client")
                                    except Exception as send_error:
                                        logger.error(f"❌ Error sending AI event: {send_error}")
                            except Exception as e:
                                logger.error(f"❌ Error processing event: {e}")
                                break
                    except Exception as e:
                        logger.error(f"❌ Error in forward_events loop: {e}")
                    logger.info(f"🎤 AI event loop ended. Total events received: {event_count}")

                # Start forwarding events in background
                forward_task = asyncio.create_task(forward_events())
                logger.info("🎤 Forwarding events started")
                
                # Task 2: handle client messages → model
                try:
                    while True:
                        raw = ws.receive()
                        if not raw:
                            break

                        try:
                            msg = json.loads(raw)
                        except json.JSONDecodeError:
                            ws.send(json.dumps({"type": "error", "error": "Invalid JSON"}))
                            continue

                        mtype = msg.get("type")
                        if mtype == "audio":
                            int16_data = msg.get("data", [])
                            if int16_data:
                                # Debug audio data
                                logger.info(f"🎤 Audio data received: {len(int16_data)} samples")
                                
                                # Check audio volume/quality
                                if len(int16_data) > 0:
                                    max_amplitude = max(abs(x) for x in int16_data)
                                    avg_amplitude = sum(abs(x) for x in int16_data) / len(int16_data)
                                    logger.info(f"🎤 Audio quality: max={max_amplitude}, avg={avg_amplitude:.2f}")
                                
                                audio_bytes = struct.pack(f"{len(int16_data)}h", *int16_data)
                                logger.info(f"🎤 Sending {len(audio_bytes)} bytes to RealtimeAgent")
                                
                                try:
                                    await session.send_audio(audio_bytes)
                                    logger.info(f"🎤 Successfully sent {len(int16_data)} samples to RealtimeAgent")
                                except Exception as e:
                                    logger.error(f"❌ Error sending audio to RealtimeAgent: {e}")
                            else:
                                logger.warning("⚠️ Empty audio data received")
                        else:
                            logger.info(f"ℹ️ Ignored unsupported message type: {mtype}")

                except Exception as e:
                    logger.error(f"❌ WebSocket error: {e}")
                finally:
                    if forward_task:
                        forward_task.cancel()
                    logger.info("🔌 Client disconnected")
                        
            except Exception as e:
                logger.error(f"❌ RealtimeRunner error: {e}")
            finally:
                # CRITICAL: Proper cleanup like the official server.py example
                if session_context:
                    try:
                        logger.info("🎤 Cleaning up session context...")
                        await session_context.__aexit__(None, None, None)
                        logger.info("🎤 Session context cleaned up successfully")
                    except Exception as cleanup_error:
                        logger.error(f"❌ Error during session cleanup: {cleanup_error}")
                else:
                    logger.info("🎤 No session context to clean up")
        # Run async handler inside sync Flask-Sock context
        asyncio.run(handle_session())


