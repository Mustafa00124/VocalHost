#!/usr/bin/env python3
"""
Native WebSocket routes for realtime voice agent
Following OpenAI's realtime agent pattern with native WebSocket and JSON messages.
"""

import asyncio
import json
import logging
import struct
from typing import Dict, Any
from flask import Blueprint, request
from flask_sock import Sock
from ..services.demo_app_agents.voice_agent import realtime_voice_agent

# Configure logging
logger = logging.getLogger(__name__)

# Create blueprint
realtime_ws_bp = Blueprint('realtime_ws', __name__)

# WebSocket connection manager
class RealtimeWebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, Any] = {}
        self.session_contexts: Dict[str, Any] = {}
        self.event_tasks: Dict[str, asyncio.Task] = {}

    async def connect(self, ws, session_id: str):
        """Handle new WebSocket connection"""
        logger.info(f"🔌 WebSocket connection attempt for session: {session_id}")
        print(f"🔌 WebSocket connection attempt for session: {session_id}")
        print(f"🔍 WebSocket object in connect: {type(ws)}")
        print(f"🔍 WebSocket attributes: {[attr for attr in dir(ws) if not attr.startswith('_')]}")
        
        # Flask-Sock might not need explicit accept() call
        # await ws.accept()
        self.active_connections[session_id] = ws
        
        logger.info(f"✅ WebSocket CONNECTED successfully: {session_id}")
        print(f"✅ WebSocket CONNECTED successfully: {session_id}")
        print(f"📊 Active connections count: {len(self.active_connections)}")
        
        # Start the realtime session
        try:
            logger.info(f"🚀 Starting realtime session for {session_id}...")
            print(f"🚀 Starting realtime session for {session_id}...")
            
            print(f"🔍 About to call realtime_voice_agent.start_session...")
            success = await realtime_voice_agent.start_session(session_id, "restaurant")
            logger.info(f"📊 Session start result: {success}")
            print(f"📊 Session start result: {success}")
            
            if success:
                # Start event processing task
                logger.info(f"🔄 Starting event processing task for {session_id}")
                print(f"🔄 Starting event processing task for {session_id}")
                
                task = asyncio.create_task(self._process_session_events(session_id))
                self.event_tasks[session_id] = task
                
                logger.info(f"✅ Realtime session started successfully for {session_id}")
                print(f"✅ Realtime session started successfully for {session_id}")
                
                # Send confirmation to frontend
                await ws.send(json.dumps({
                    "type": "session_started",
                    "session_id": session_id,
                    "message": "Realtime session is ready"
                }))
            else:
                logger.error(f"❌ Failed to start realtime session for {session_id}")
                print(f"❌ Failed to start realtime session for {session_id}")
                
                await ws.send(json.dumps({
                    "type": "error",
                    "error": "Failed to start realtime session"
                }))
        except Exception as e:
            logger.error(f"❌ Error starting session for {session_id}: {str(e)}")
            print(f"❌ Error starting session for {session_id}: {str(e)}")
            print(f"❌ Exception type: {type(e).__name__}")
            print(f"❌ Exception details: {str(e)}")
            
            await ws.send(json.dumps({
                "type": "error", 
                "error": f"Session start error: {str(e)}"
            }))

    async def disconnect(self, session_id: str):
        """Handle WebSocket disconnection"""
        if session_id in self.active_connections:
            del self.active_connections[session_id]
        
        if session_id in self.event_tasks:
            self.event_tasks[session_id].cancel()
            del self.event_tasks[session_id]
        
        # End the realtime session
        await realtime_voice_agent.end_session(session_id)
        logger.info(f"🔌 WebSocket disconnected: {session_id}")

    async def send_audio(self, session_id: str, audio_bytes: bytes):
        """Send audio data to the realtime session"""
        if session_id in realtime_voice_agent._sessions:
            await realtime_voice_agent.process_audio_event(session_id, {
                'type': 'audio_data',
                'audio_data': audio_bytes,
                'format': 'pcm16'
            })

    async def send_message(self, session_id: str, message: Dict[str, Any]):
        """Send a message to the realtime session"""
        if session_id in realtime_voice_agent._sessions:
            # Convert to the format expected by the voice agent
            await realtime_voice_agent.process_audio_event(session_id, message)

    async def interrupt(self, session_id: str):
        """Interrupt current model playback/response"""
        if session_id in realtime_voice_agent._sessions:
            # Send interrupt signal to the realtime session
            await realtime_voice_agent.process_audio_event(session_id, {
                'type': 'interrupt'
            })

    async def _process_session_events(self, session_id: str):
        """Process events from the realtime session and send to frontend"""
        try:
            ws = self.active_connections.get(session_id)
            if not ws:
                return

            async for event in realtime_voice_agent.get_session_events(session_id):
                if session_id not in self.active_connections:
                    break
                
                # Send event to frontend
                await ws.send(json.dumps(event))
                
        except Exception as e:
            logger.error(f"❌ Error processing events for {session_id}: {str(e)}")
            if session_id in self.active_connections:
                await self.active_connections[session_id].send(json.dumps({
                    "type": "error",
                    "error": f"Event processing error: {str(e)}"
                }))

# Global manager instance
manager = RealtimeWebSocketManager()

def init_realtime_websocket(sock: Sock):
    """Initialize the realtime WebSocket routes"""
    
    @sock.route('/ws/<session_id>')
    async def websocket_endpoint(ws, session_id: str):
        """Main WebSocket endpoint following OpenAI pattern"""
        await manager.connect(ws, session_id)
        
        try:
            while True:
                # Receive message from frontend
                data = await ws.receive()
                if not data:
                    break
                
                try:
                    message = json.loads(data)
                    await handle_websocket_message(ws, session_id, message)
                except json.JSONDecodeError as e:
                    logger.error(f"❌ Invalid JSON received: {str(e)}")
                    await ws.send(json.dumps({
                        "type": "error",
                        "error": "Invalid JSON format"
                    }))
                    
        except Exception as e:
            logger.error(f"❌ WebSocket error for {session_id}: {str(e)}")
        finally:
            await manager.disconnect(session_id)

async def handle_websocket_message(ws, session_id: str, message: Dict[str, Any]):
    """Handle incoming WebSocket messages following OpenAI pattern"""
    message_type = message.get("type")
    
    logger.info(f"📩 Received message type: {message_type} for session {session_id}")
    print(f"📩 Received message type: {message_type} for session {session_id}")
    print(f"📊 Message keys: {list(message.keys())}")
    # Don't print full message as it may contain raw audio data
    
    if message_type == "audio":
        # Handle audio data - convert int16 array to bytes
        audio_data = message.get("data", [])
        logger.info(f"🎤 Processing audio data: {len(audio_data)} samples")
        print(f"🎤 Processing audio data: {len(audio_data)} samples")
        
        if audio_data:
            try:
                # Convert int16 array to bytes
                audio_bytes = struct.pack(f"{len(audio_data)}h", *audio_data)
                logger.info(f"🎤 Converted audio to bytes: {len(audio_bytes)} bytes")
                print(f"🎤 Converted audio to bytes: {len(audio_bytes)} bytes")
                
                await manager.send_audio(session_id, audio_bytes)
                logger.info(f"✅ Audio data sent to realtime session")
                print(f"✅ Audio data sent to realtime session")
                
                # Send acknowledgment
                await ws.send(json.dumps({
                    "type": "audio_ack",
                    "received": len(audio_data)
                }))
                logger.info(f"📤 Sent audio acknowledgment to frontend")
                print(f"📤 Sent audio acknowledgment to frontend")
                
            except Exception as e:
                logger.error(f"❌ Error processing audio data: {str(e)}")
                print(f"❌ Error processing audio data: {str(e)}")
                await ws.send(json.dumps({
                    "type": "error",
                    "error": f"Audio processing error: {str(e)}"
                }))
        else:
            logger.warning(f"⚠️ Empty audio data received for session {session_id}")
            print(f"⚠️ Empty audio data received for session {session_id}")
    
    elif message_type == "interrupt":
        # Handle interrupt signal
        logger.info(f"🛑 Processing interrupt for session {session_id}")
        print(f"🛑 Processing interrupt for session {session_id}")
        
        await manager.interrupt(session_id)
        await ws.send(json.dumps({
            "type": "interrupt_ack"
        }))
        logger.info(f"✅ Interrupt processed and acknowledged")
        print(f"✅ Interrupt processed and acknowledged")
    
    elif message_type == "commit_audio":
        # Force close the current input audio turn
        logger.info(f"📤 Processing commit_audio for session {session_id}")
        print(f"📤 Processing commit_audio for session {session_id}")
        
        await manager.send_message(session_id, {
            "type": "commit_audio"
        })
        await ws.send(json.dumps({
            "type": "commit_audio_ack"
        }))
        logger.info(f"✅ Audio commit processed and acknowledged")
        print(f"✅ Audio commit processed and acknowledged")
    
    elif message_type == "image":
        # Handle image upload (similar to OpenAI demo)
        data_url = message.get("data_url")
        prompt_text = message.get("text", "Please describe this image.")
        
        logger.info(f"📷 Processing image upload for session {session_id}")
        print(f"📷 Processing image upload for session {session_id}")
        print(f"📊 Image data length: {len(data_url) if data_url else 0}")
        
        if data_url:
            logger.info(f"📷 Forwarding image to realtime session (len={len(data_url)})")
            print(f"📷 Forwarding image to realtime session (len={len(data_url)})")
            
            await manager.send_message(session_id, {
                "type": "image",
                "data_url": data_url,
                "text": prompt_text
            })
            await ws.send(json.dumps({
                "type": "image_ack",
                "size": len(data_url)
            }))
            logger.info(f"✅ Image processed and acknowledged")
            print(f"✅ Image processed and acknowledged")
        else:
            logger.warning(f"⚠️ No data_url in image message for session {session_id}")
            print(f"⚠️ No data_url in image message for session {session_id}")
            
            await ws.send(json.dumps({
                "type": "error",
                "error": "No data_url for image message"
            }))
    
    else:
        # Forward unknown message types to the session
        logger.info(f"🔄 Forwarding unknown message type '{message_type}' to session {session_id}")
        print(f"🔄 Forwarding unknown message type '{message_type}' to session {session_id}")
        
        await manager.send_message(session_id, message)
        await ws.send(json.dumps({
            "type": "message_ack",
            "received_type": message_type
        }))
        logger.info(f"✅ Unknown message forwarded and acknowledged")
        print(f"✅ Unknown message forwarded and acknowledged")
