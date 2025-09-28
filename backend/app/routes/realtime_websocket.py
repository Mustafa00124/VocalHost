#!/usr/bin/env python3
"""
FastAPI WebSocket endpoint for RealtimeVoiceAgent using official OpenAI pattern
"""

import asyncio
import base64
import json
import logging
import struct
from contextlib import asynccontextmanager
from typing import TYPE_CHECKING, Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from agents.realtime import RealtimeRunner, RealtimeSession, RealtimeSessionEvent
from agents.realtime.config import RealtimeUserInputMessage
from agents.realtime.model_inputs import RealtimeModelSendRawMessage
from typing_extensions import assert_never

# Import the restaurant agent creator
from ..services.demo_app_agents.agent_creators import create_restaurant_realtime_agent

logger = logging.getLogger(__name__)
realtime_router = APIRouter(tags=["realtime"])


class RealtimeWebSocketManager:
    def __init__(self):
        self.active_sessions: dict[str, RealtimeSession] = {}
        self.session_contexts: dict[str, Any] = {}
        self.websockets: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.websockets[session_id] = websocket
        logger.info(f"🔌 WebSocket accepted for session: {session_id}")

        # Create restaurant agent using your existing creator
        logger.info(f"🔌 Creating restaurant agent for session: {session_id}")
        agent = create_restaurant_realtime_agent()
        logger.info(f"🔌 Agent created: {agent.name}")
        logger.info(f"🔧 Agent tools: {[getattr(tool, 'name', str(tool)) for tool in agent.tools]}")
        logger.info(f"🔧 Agent tools count: {len(agent.tools)}")
        
        runner = RealtimeRunner(
            starting_agent=agent,
            # config={
            #     "model_settings": {
            #         "model_name": "gpt-realtime",
            #         "voice": "alloy",
            #         "modalities": ["audio", "text"],
            #         "input_audio_format": "pcm16",
            #         "output_audio_format": "pcm16",
            #         "input_audio_transcription": {
            #             "model": "gpt-4o-transcribe",
            #             "language": "en"
            #         },
            #         "language": "en",
            #         "turn_detection": {
            #             "type": "server_vad",
            #             "create_response": True,  # CRITICAL: Enable response generation
            #             "threshold": 0.3,  # Lower threshold for better detection
            #             "silence_duration_ms": 1000,  # Longer silence duration
            #             "prefix_padding_ms": 500,  # More padding
            #             "eagerness": "medium"  # Add eagerness setting
            #         },
            #         "eagerness": "high",
            #     }
            # }
        )
        logger.info(f"🔌 RealtimeRunner created for session: {session_id}")
        
        session_context = await runner.run()
        logger.info(f"🔌 Session context created for session: {session_id}")
        
        session = await session_context.__aenter__()
        logger.info(f"🔌 Session entered for session: {session_id}")
        
        self.active_sessions[session_id] = session
        self.session_contexts[session_id] = session_context
        logger.info(f"🔌 Session stored for session: {session_id}")

        # Start event processing task
        logger.info(f"🔌 Starting event processing task for session: {session_id}")
        asyncio.create_task(self._process_events(session_id))
        

    async def disconnect(self, session_id: str):
        if session_id in self.session_contexts:
            await self.session_contexts[session_id].__aexit__(None, None, None)
            del self.session_contexts[session_id]
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
        if session_id in self.websockets:
            del self.websockets[session_id]

    async def send_audio(self, session_id: str, audio_bytes: bytes):
        if session_id in self.active_sessions:
            logger.info(f"🔌 Sending audio to session {session_id}, bytes: {len(audio_bytes)}")
            await self.active_sessions[session_id].send_audio(audio_bytes)
            logger.info(f"🔌 Audio sent to session {session_id}")
        else:
            logger.error(f"🔌 No active session found for {session_id}")

    async def send_client_event(self, session_id: str, event: dict[str, Any]):
        """Send a raw client event to the underlying realtime model."""
        session = self.active_sessions.get(session_id)
        if not session:
            return
        await session.model.send_event(
            RealtimeModelSendRawMessage(
                message={
                    "type": event["type"],
                    "other_data": {k: v for k, v in event.items() if k != "type"},
                }
            )
        )

    async def send_user_message(self, session_id: str, message: RealtimeUserInputMessage):
        """Send a structured user message via the higher-level API (supports input_image)."""
        session = self.active_sessions.get(session_id)
        if not session:
            return
        await session.send_message(message)  # delegates to RealtimeModelSendUserInput path

    async def interrupt(self, session_id: str) -> None:
        """Interrupt current model playback/response for a session."""
        session = self.active_sessions.get(session_id)
        if not session:
            return
        await session.interrupt()

    async def _process_events(self, session_id: str):
        try:
            logger.info(f"🔌 Starting event processing for session: {session_id}")
            session = self.active_sessions[session_id]
            websocket = self.websockets[session_id]
            logger.info(f"🔌 Session and websocket found for: {session_id}")

            async for event in session:
                logger.info(f"🔌 EVENT RECEIVED: {event.type}")
                if event.type == "tool_start":
                    logger.info(f"🔧 TOOL START: {event.tool.name if hasattr(event, 'tool') else 'Unknown tool'}")
                elif event.type == "tool_end":
                    logger.info(f"🔧 TOOL END: {event.tool.name if hasattr(event, 'tool') else 'Unknown tool'}")
                    logger.info(f"🔧 TOOL OUTPUT: {event.output if hasattr(event, 'output') else 'No output'}")
                elif event.type == "audio":
                    logger.info(f"🔌 AUDIO EVENT RECEIVED! Audio data length: {len(event.audio.data) if hasattr(event, 'audio') and event.audio else 'No audio data'}")
                elif event.type == "agent_start":
                    logger.info(f"🔌 AGENT STARTED: {event.agent.name}")
                elif event.type == "agent_end":
                    logger.info(f"🔌 AGENT ENDED: {event.agent.name}")
                elif event.type == "error":
                    logger.error(f"🔌 ERROR EVENT: {event.error}")
                
                event_data = await self._serialize_event(event)
                logger.info(f"🔌 WebSocket sending event: {event.type}")
                await websocket.send_text(json.dumps(event_data))
        except Exception as e:
            logger.error(f"Error processing events for session {session_id}: {e}")
            # If there's an error, try to clean up
            if session_id in self.session_contexts:
                await self.session_contexts[session_id].__aexit__(None, None, None)
                del self.session_contexts[session_id]
            if session_id in self.active_sessions:
                del self.active_sessions[session_id]
            if session_id in self.websockets:
                del self.websockets[session_id]

    async def _serialize_event(self, event: RealtimeSessionEvent) -> dict[str, Any]:
        base_event: dict[str, Any] = {
            "type": event.type,
        }

        if event.type == "agent_start":
            base_event["agent"] = event.agent.name
        elif event.type == "agent_end":
            base_event["agent"] = event.agent.name
        elif event.type == "handoff":
            base_event["from"] = event.from_agent.name
            base_event["to"] = event.to_agent.name
        elif event.type == "tool_start":
            base_event["tool"] = event.tool.name
        elif event.type == "tool_end":
            base_event["tool"] = event.tool.name
            base_event["output"] = event.output
        elif event.type == "audio":
            base_event["audio"] = base64.b64encode(event.audio.data).decode("utf-8")
        elif event.type == "audio_interrupted":
            pass
        elif event.type == "audio_end":
            pass
        elif event.type == "history_updated":
            base_event["history"] = [item.model_dump(mode="json") for item in event.history]
        elif event.type == "history_added":
            # Provide the added item so the UI can render incrementally.
            try:
                base_event["item"] = event.item.model_dump(mode="json")
            except Exception:
                base_event["item"] = None
        elif event.type == "guardrail_tripped":
            base_event["guardrail_results"] = [
                {"name": result.guardrail.name} for result in event.guardrail_results
            ]
        elif event.type == "raw_model_event":
            base_event["raw_model_event"] = {
                "type": event.data.type,
            }
            # logger.info(f"🔌 Raw model event details: {event.data.type}")
        elif event.type == "error":
            base_event["error"] = str(event.error) if hasattr(event, "error") else "Unknown error"
        elif event.type == "input_audio_timeout_triggered":
            pass
        else:
            assert_never(event)

        return base_event


manager = RealtimeWebSocketManager()


@realtime_router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    logger.info(f"🔌 WebSocket attempted")
    await manager.connect(websocket, session_id)
    logger.info(f"🔌 WebSocket connected: {session_id}")
    image_buffers: dict[str, dict[str, Any]] = {}
    try:
        while True:
            logger.info(f"🔌 WebSocket receiving data")
            data = await websocket.receive_text()
            message = json.loads(data)
            logger.info(f"🔌 WebSocket received message")
            
            if message["type"] == "audio":
                # Convert int16 array to bytes
                int16_data = message["data"]
                audio_bytes = struct.pack(f"{len(int16_data)}h", *int16_data)
                await manager.send_audio(session_id, audio_bytes)
                logger.info(f"🔌 WebSocket sent audio")
            elif message["type"] == "commit_audio":
                # Force close the current input audio turn
                await manager.send_client_event(session_id, {"type": "input_audio_buffer.commit"})
                logger.info(f"🔌 WebSocket sent commit audio")
            elif message["type"] == "interrupt":
                await manager.interrupt(session_id)
                logger.info(f"🔌 WebSocket sent interrupt")
            elif message["type"] == "message":
                # Handle text messages to RealtimeRunner
                logger.info(f"🔌 Received text message: {message.get('content', [{}])[0].get('text', '')}")
                await manager.send_user_message(session_id, message)
                logger.info(f"🔌 Text message sent to RealtimeRunner")

    except WebSocketDisconnect:
        logger.info(f"🔌 WebSocket disconnected: {session_id}")
        await manager.disconnect(session_id)


