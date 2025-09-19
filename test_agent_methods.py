#!/usr/bin/env python3
"""
Test what methods are available on the RealtimeAgent
"""
import asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_agent_methods():
    try:
        from app.services.voice_agent_demo_app.demo_agent_sdk import demo_realtime_agent
        
        print("✅ DemoRealtimeAgent loaded successfully")
        print(f"Agent type: {type(demo_realtime_agent)}")
        
        # Get a restaurant agent
        restaurant_agent = demo_realtime_agent.agents.get('restaurant')
        if restaurant_agent:
            print(f"✅ Restaurant agent type: {type(restaurant_agent)}")
            print(f"Available methods: {[method for method in dir(restaurant_agent) if not method.startswith('_')]}")
            
            # Test a simple message
            print("\n🤖 Testing agent with message...")
            response = await demo_realtime_agent.process_message(
                message="Hello, I want to book a table",
                agent_type="restaurant",
                session_id="test"
            )
            print(f"Response: {response}")
        else:
            print("❌ No restaurant agent found")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_agent_methods())
