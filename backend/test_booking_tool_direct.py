#!/usr/bin/env python3
"""
Test booking tool execution through agent system
"""
import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def test_booking_tool_through_agent():
    """Test the booking tool through the agent system"""
    print("🧪 Testing Booking Tool Through Agent System")
    print("=" * 50)
    
    try:
        # Import the agent
        from app.services.voice_agent_demo_app.demo_text_agent import DemoTextAgent
        
        print("✅ Successfully imported DemoTextAgent")
        
        # Initialize agent
        print("\n📝 Initializing agent...")
        agent = DemoTextAgent()
        print("✅ Agent initialized successfully!")
        
        # Test booking through agent
        print("\n🧪 Testing booking through restaurant agent...")
        result = await agent.process_text_message(
            message="I'd like to make a reservation for John Smith tomorrow at 7 PM",
            agent_type="restaurant"
        )
        print(f"Result: {result}")
        
        if ("reservation" in result.lower() and "confirmed" in result.lower() and "John Smith" in result) or ("Reservation confirmed" in result and "John Smith" in result):
            print("✅ SUCCESS: Booking tool works through agent!")
            print("📅 This should have broadcast a WebSocket message to update the frontend calendar")
        else:
            print("❌ FAILED: Booking tool not working properly through agent")
            print(f"Expected: 'reservation confirmed' and 'John Smith' in result")
            print(f"Got: {result}")
        
        print("\n" + "=" * 50)
        print("🎉 Agent Tool Testing Completed!")
        print("=" * 50)
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_booking_tool_through_agent())
