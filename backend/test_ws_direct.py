#!/usr/bin/env python3
"""
Direct WebSocket test to see backend logs
"""
import asyncio
import websockets
import json

async def test_websocket_direct():
    uri = "ws://localhost:5000/demo/ws"
    print(f"🔌 Testing WebSocket connection to: {uri}")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected successfully!")
            print("📤 Sending test message...")
            
            # Send a test message
            test_message = {
                "type": "test",
                "message": "Hello from direct test"
            }
            await websocket.send(json.dumps(test_message))
            print("📤 Test message sent")
            
            # Wait for response
            print("📥 Waiting for response...")
            response = await websocket.recv()
            print(f"📥 Received response: {response}")
            
    except websockets.exceptions.ConnectionClosed as e:
        print(f"❌ WebSocket connection closed: {e.code} - {e.reason}")
    except Exception as e:
        print(f"❌ WebSocket connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket_direct())
