#!/usr/bin/env python3
"""
Hybrid server: FastAPI for WebSockets + Flask for other routes
This gives us the best of both worlds
"""

import uvicorn
from fastapi import FastAPI, WebSocket
from fastapi.middleware.wsgi import WSGIMiddleware
import json
import asyncio
import time

# Import your Flask app
from app import create_app as create_flask_app

# Create Flask app
flask_app = create_flask_app()

# Create FastAPI app
app = FastAPI(title="AI Voice Agent API")

# Mount Flask app on FastAPI
app.mount("/", WSGIMiddleware(flask_app))

# Add WebSocket endpoints directly in FastAPI
@app.websocket("/api/realtime/ws/{session_id}")
async def realtime_websocket(websocket: WebSocket, session_id: str):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            if not data:
                break
            
            try:
                message = json.loads(data)
                
                # Echo back for now (you can integrate with your RealtimeRunner later)
                response = {
                    "type": "realtime_response",
                    "session_id": session_id,
                    "original": message,
                    "timestamp": time.time()
                }
                await websocket.send_text(json.dumps(response))
                
            except json.JSONDecodeError:
                error_response = {
                    "type": "error",
                    "error": "Invalid JSON format"
                }
                await websocket.send_text(json.dumps(error_response))
                
    except Exception as e:
        print(f"WebSocket error: {e}")

@app.websocket("/api/test/ws/{session_id}")
async def test_websocket(websocket: WebSocket, session_id: str):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            if not data:
                break
            
            try:
                message = json.loads(data)
                response = {
                    "type": "echo",
                    "original": message
                }
                await websocket.send_text(json.dumps(response))
                
            except json.JSONDecodeError:
                error_response = {
                    "type": "error",
                    "error": "Invalid JSON format"
                }
                await websocket.send_text(json.dumps(error_response))
                
    except Exception as e:
        print(f"Test WebSocket error: {e}")

if __name__ == "__main__":
    print("🚀 Starting hybrid server (FastAPI + Flask)...")
    print("📡 Server will be available at: http://localhost:5000")
    print("🔌 WebSocket endpoint: ws://localhost:5000/api/realtime/ws/<session_id>")
    print("🧪 Test endpoint: ws://localhost:5000/api/test/ws/<session_id>")
    
    uvicorn.run(app, host="0.0.0.0", port=5000, log_level="info")
