#!/usr/bin/env python3
"""
Test WebSocket connection for FastAPI realtime endpoint
"""

import asyncio
import json
import websockets
import uuid

async def test_websocket():
    """Test WebSocket connection to FastAPI realtime endpoint"""
    session_id = str(uuid.uuid4())
    uri = f"ws://localhost:5000/ws/{session_id}"
    
    print(f"🔌 Connecting to WebSocket: {uri}")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected successfully!")
            
            # Send a test audio message (empty for testing)
            test_message = {
                "type": "audio",
                "data": []  # Empty audio data for testing
            }
            
            print("📤 Sending test audio message...")
            await websocket.send(json.dumps(test_message))
            print("✅ Test message sent")
            
            # Wait for response
            print("📥 Waiting for response...")
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                print(f"📥 Received response: {response[:100]}...")
            except asyncio.TimeoutError:
                print("⏰ No response received within 10 seconds")
            
            print("🔌 WebSocket test completed")
            
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket())
