#!/usr/bin/env python3
"""
Test script for FastAPI conversion
"""

import asyncio
import httpx
import json

async def test_fastapi_endpoints():
    """Test the converted FastAPI endpoints"""
    base_url = "http://localhost:5000"
    
    async with httpx.AsyncClient() as client:
        print("🧪 Testing FastAPI conversion...")
        
        # Test health check
        print("\n1. Testing health check...")
        try:
            response = await client.get(f"{base_url}/")
            print(f"✅ Health check: {response.status_code} - {response.json()}")
        except Exception as e:
            print(f"❌ Health check failed: {e}")
        
        # Test greeting endpoint
        print("\n2. Testing greeting endpoint...")
        try:
            response = await client.get(f"{base_url}/api/greeting?agentType=restaurant")
            print(f"✅ Greeting: {response.status_code} - {response.json()}")
        except Exception as e:
            print(f"❌ Greeting failed: {e}")
        
        # Test chat endpoint
        print("\n3. Testing chat endpoint...")
        try:
            chat_data = {
                "message": "Hello, I'd like to make a reservation",
                "agentType": "restaurant",
                "sessionId": "test-session"
            }
            response = await client.post(
                f"{base_url}/api/chat",
                json=chat_data
            )
            print(f"✅ Chat: {response.status_code} - {response.json()}")
        except Exception as e:
            print(f"❌ Chat failed: {e}")
        
        print("\n🎉 FastAPI conversion test completed!")

if __name__ == "__main__":
    asyncio.run(test_fastapi_endpoints())
