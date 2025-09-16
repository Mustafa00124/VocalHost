#!/usr/bin/env python3
"""
Test script to verify the handoff fix works
"""
import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.voice_agent_demo_app.demo_text_agent import DemoTextAgent

async def test_handoff_fix():
    """Test that the chat agent properly hands off to tool agent"""
    print("🧪 Testing Handoff Fix")
    print("=" * 40)
    
    try:
        # Initialize the agent
        print("📝 Initializing DemoTextAgent...")
        agent = DemoTextAgent()
        print("✅ Agent initialized successfully!")
        
        # Test booking request - should hand off to tool agent
        print("\n🧪 Test: Restaurant Booking Request")
        print("-" * 40)
        
        response = await agent.process_text_message(
            message="I'd like to make a reservation",
            agent_type="restaurant"
        )
        
        print(f"🤖 Response: {response}")
        
        # Check if it's asking for details step by step
        if "What date" in response or "What time" in response or "How many people" in response:
            print("✅ SUCCESS: Tool agent is asking for details step by step!")
        else:
            print("❌ FAILED: Still asking for multiple details at once")
            print("Expected: Step-by-step questions")
            print("Got: Multiple questions or wrong response")
        
        # Test another booking request
        print("\n🧪 Test: Salon Booking Request")
        print("-" * 40)
        
        response2 = await agent.process_text_message(
            message="I need to book an appointment",
            agent_type="salon"
        )
        
        print(f"🤖 Response: {response2}")
        
        if "What service" in response2 or "What date" in response2:
            print("✅ SUCCESS: Tool agent is asking for details step by step!")
        else:
            print("❌ FAILED: Still asking for multiple details at once")
        
        print(f"\n🎉 Handoff fix test completed!")
        print("\n📋 Expected Behavior:")
        print("✅ Chat agent should IMMEDIATELY hand off to tool agent")
        print("✅ Tool agent should ask ONE question at a time")
        print("✅ No more asking for multiple details upfront")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_handoff_fix())
