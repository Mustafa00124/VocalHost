#!/usr/bin/env python3
"""
Test OpenAI Realtime WebSocket API directly
"""
import asyncio
import websockets
import json
import os

async def test_openai_realtime():
    # Get API key from environment or use placeholder
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("OPENAI_KEY") or "your-actual-openai-key-here"
    url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17"
    
    print("🔌 Testing OpenAI Realtime WebSocket API...")
    print(f"🔑 Using API Key: {api_key[:10]}...")
    print(f"🌐 Connecting to: {url}")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "OpenAI-Beta": "realtime=v1"
    }
    
    try:
        # websockets library doesn't support extra_headers, so we'll test differently
        print("⚠️  websockets library doesn't support headers, testing connection only...")
        async with websockets.connect(url) as websocket:
            print("✅ WebSocket connected to OpenAI Realtime API!")
            
            # Send a simple test event
            test_event = {
                "type": "input_text",
                "text": "Hello, test!"
            }
            
            print("📤 Sending test event:", json.dumps(test_event, indent=2))
            await websocket.send(json.dumps(test_event))
            
            # Wait for responses
            print("📥 Waiting for responses...")
            try:
                async for message in websocket:
                    print("📨 Received from OpenAI:", message)
            except asyncio.TimeoutError:
                print("⏰ Timeout waiting for response")
                
    except websockets.exceptions.ConnectionClosed as e:
        print(f"❌ WebSocket connection closed: {e.code} - {e.reason}")
    except Exception as e:
        print(f"❌ WebSocket connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_openai_realtime())
