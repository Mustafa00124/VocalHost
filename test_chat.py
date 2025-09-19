#!/usr/bin/env python3
"""
Test chat message to see if AI model is being called
"""
import asyncio
import websockets
import json

async def test_chat():
    uri = "ws://localhost:5000/demo/ws"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ Connected to WebSocket")
            
            # Wait for greeting
            greeting = await websocket.recv()
            print(f"📨 Received greeting: {greeting}")
            
            # Send a chat message
            chat_message = {
                "type": "chat",
                "message": "I want to book a table for 4 people tomorrow at 7 PM",
                "agent_type": "restaurant",
                "session_id": "test-session"
            }
            
            await websocket.send(json.dumps(chat_message))
            print("📤 Sent chat message")
            
            # Wait for response
            response = await websocket.recv()
            print(f"📨 Received response: {response}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_chat())
