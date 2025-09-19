#!/usr/bin/env python3
"""
Simple WebSocket test to verify the demo agent is working
"""
import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://localhost:5000/demo/ws"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected to WebSocket")
            
            # Wait for greeting
            greeting = await websocket.recv()
            print(f"📨 Received greeting: {greeting}")
            
            # Send a test message
            test_message = {
                "type": "chat",
                "message": "Hello, I'd like to make a reservation for 2 people tonight",
                "agent_type": "restaurant",
                "session_id": "test-session"
            }
            
            await websocket.send(json.dumps(test_message))
            print("📤 Sent test message")
            
            # Wait for response
            response = await websocket.recv()
            print(f"📨 Received response: {response}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket())
