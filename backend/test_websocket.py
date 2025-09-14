#!/usr/bin/env python3
"""
Debug script to test WebSocket connection
"""
import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://localhost:5000/demo/ws"
    print(f"🔌 Testing WebSocket connection to: {uri}")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected successfully!")
            
            # Send a test message
            test_message = {
                "type": "test",
                "message": "Hello from test script"
            }
            await websocket.send(json.dumps(test_message))
            print("📤 Test message sent")
            
            # Wait for response
            response = await websocket.recv()
            print(f"📥 Received response: {response}")
            
    except Exception as e:
        print(f"❌ WebSocket connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket())
