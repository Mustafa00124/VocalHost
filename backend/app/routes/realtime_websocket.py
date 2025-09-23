#!/usr/bin/env python3
"""
Simplest WebSocket endpoint for realtime voice agent.
"""

import asyncio
import json
import logging
import struct
from flask import Blueprint
from flask_sock import Sock
from ..services.demo_app_agents.voice_agent import realtime_voice_agent

logger = logging.getLogger(__name__)

# Blueprint
realtime_ws_bp = Blueprint("realtime_ws", __name__)


def init_realtime_websocket(sock: Sock):
    @sock.route("/ws")
    async def websocket_endpoint(ws):
        logger.info("🔌 WebSocket connected")

        # Send initial greeting
        await ws.send(json.dumps({
            "type": "session_started",
            "message": "Voice agent connected! Say hello to start a conversation."
        }))

        # Start the voice agent in background
        async def run_agent():
            try:
                await realtime_voice_agent.run()
            except Exception as e:
                logger.error(f"❌ Agent error: {e}")
                await ws.send(json.dumps({
                    "type": "error", 
                    "error": f"Agent error: {e}"
                }))

        agent_task = asyncio.create_task(run_agent())

        try:
            while True:
                data = await ws.receive()
                if not data:
                    break

                try:
                    message = json.loads(data)
                except json.JSONDecodeError:
                    await ws.send(json.dumps({"type": "error", "error": "Invalid JSON"}))
                    continue

                mtype = message.get("type")
                logger.info(f"📩 Received message: {mtype}")

                if mtype == "audio":
                    # For now, just acknowledge audio receipt
                    audio_data = message.get("data", [])
                    if audio_data:
                        logger.info(f"🎤 Received audio: {len(audio_data)} samples")
                        await ws.send(json.dumps({
                            "type": "audio_ack", 
                            "received": len(audio_data),
                            "message": "Audio received (not processed yet)"
                        }))
                    else:
                        await ws.send(json.dumps({"type": "error", "error": "Empty audio data"}))

                elif mtype == "interrupt":
                    logger.info("🛑 Interrupt received")
                    await ws.send(json.dumps({"type": "interrupt_ack"}))

                elif mtype == "commit_audio":
                    logger.info("📤 Commit audio received")
                    await ws.send(json.dumps({"type": "commit_audio_ack"}))

                else:
                    # Forward unknown messages
                    logger.info(f"🔄 Forwarding message: {mtype}")
                    await ws.send(json.dumps({
                        "type": "message_ack", 
                        "received_type": mtype,
                        "message": "Message received (not processed yet)"
                    }))

        except Exception as e:
            logger.error(f"❌ WebSocket error: {e}")
        finally:
            agent_task.cancel()
            logger.info("🔌 WebSocket disconnected")
