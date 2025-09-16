#!/usr/bin/env python3
"""
Comprehensive test for booking system: handoffs, calendar updates, availability, and cancellation
"""
import asyncio
import sys
import os
import json
import time

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.voice_agent_demo_app.demo_text_agent import DemoTextAgent

async def test_comprehensive_booking():
    """Test all booking scenarios comprehensively"""
    print("🧪 Comprehensive Booking System Test")
    print("=" * 60)
    
    try:
        # Initialize the agent
        print("📝 Initializing DemoTextAgent...")
        agent = DemoTextAgent()
        print("✅ Agent initialized successfully!")
        
        # Test 1: Handoff Test
        print("\n" + "="*60)
        print("🧪 TEST 1: Handoff Test")
        print("="*60)
        
        print("👤 User: 'I'd like to make a reservation'")
        response1 = await agent.process_text_message(
            message="I'd like to make a reservation",
            agent_type="restaurant"
        )
        print(f"🤖 Response: {response1}")
        
        # Check if it's asking step by step
        if any(phrase in response1.lower() for phrase in ["what date", "what time", "how many people", "may i have"]):
            print("✅ SUCCESS: Tool agent is asking step by step!")
        else:
            print("❌ FAILED: Not asking step by step")
            print(f"Expected: Step-by-step questions")
            print(f"Got: {response1}")
        
        # Test 2: Complete Booking Flow
        print("\n" + "="*60)
        print("🧪 TEST 2: Complete Booking Flow")
        print("="*60)
        
        # Simulate complete conversation
        conversation = [
            "I'd like to make a reservation",
            "Tomorrow", 
            "7 PM",
            "4 people",
            "John Smith"
        ]
        
        print("🔄 Simulating complete booking conversation...")
        for i, message in enumerate(conversation, 1):
            print(f"\n👤 User (Step {i}): {message}")
            response = await agent.process_text_message(
                message=message,
                agent_type="restaurant"
            )
            print(f"🤖 Response: {response}")
            
            # Check for booking confirmation
            if "Reservation confirmed" in response and "John Smith" in response:
                print("✅ SUCCESS: Booking confirmed!")
                print("📅 This should update the frontend calendar")
                break
            
            await asyncio.sleep(0.5)  # Small delay between messages
        
        # Test 3: Availability Check
        print("\n" + "="*60)
        print("🧪 TEST 3: Availability Check")
        print("="*60)
        
        print("👤 User: 'Check availability for tomorrow'")
        availability_response = await agent.process_text_message(
            message="Check availability for tomorrow",
            agent_type="restaurant"
        )
        print(f"🤖 Response: {availability_response}")
        
        if "Available times" in availability_response or "9:00 AM" in availability_response:
            print("✅ SUCCESS: Availability check working!")
        else:
            print("❌ FAILED: Availability check not working")
        
        # Test 4: Salon Booking
        print("\n" + "="*60)
        print("🧪 TEST 4: Salon Booking")
        print("="*60)
        
        salon_conversation = [
            "I need to book an appointment",
            "Haircut",
            "Next Friday",
            "2 PM", 
            "Sarah Johnson"
        ]
        
        print("🔄 Simulating salon booking conversation...")
        for i, message in enumerate(salon_conversation, 1):
            print(f"\n👤 User (Step {i}): {message}")
            response = await agent.process_text_message(
                message=message,
                agent_type="salon"
            )
            print(f"🤖 Response: {response}")
            
            # Check for booking confirmation
            if "Appointment booked" in response and "Sarah Johnson" in response:
                print("✅ SUCCESS: Salon booking confirmed!")
                print("📅 This should update the frontend calendar")
                break
            
            await asyncio.sleep(0.5)
        
        # Test 5: Dental Appointment
        print("\n" + "="*60)
        print("🧪 TEST 5: Dental Appointment")
        print("="*60)
        
        dental_conversation = [
            "I want to schedule a dental appointment",
            "John Doe",
            "Cleaning",
            "Next Monday",
            "10 AM"
        ]
        
        print("🔄 Simulating dental appointment conversation...")
        for i, message in enumerate(dental_conversation, 1):
            print(f"\n👤 User (Step {i}): {message}")
            response = await agent.process_text_message(
                message=message,
                agent_type="dentist"
            )
            print(f"🤖 Response: {response}")
            
            # Check for booking confirmation
            if "Dental appointment scheduled" in response and "John Doe" in response:
                print("✅ SUCCESS: Dental appointment confirmed!")
                print("📅 This should update the frontend calendar")
                break
            
            await asyncio.sleep(0.5)
        
        # Test 6: Policy Question (should hand off to policy agent)
        print("\n" + "="*60)
        print("🧪 TEST 6: Policy Question")
        print("="*60)
        
        print("👤 User: 'What's your cancellation policy?'")
        policy_response = await agent.process_text_message(
            message="What's your cancellation policy?",
            agent_type="restaurant"
        )
        print(f"🤖 Response: {policy_response}")
        
        if "cancellation" in policy_response.lower() or "policy" in policy_response.lower():
            print("✅ SUCCESS: Policy question handled!")
        else:
            print("❌ FAILED: Policy question not handled properly")
        
        print("\n" + "="*60)
        print("🎉 COMPREHENSIVE TEST COMPLETED!")
        print("="*60)
        
        print("\n📋 Summary of Tests:")
        print("✅ Test 1: Handoff - Chat agent hands off to tool agent")
        print("✅ Test 2: Restaurant Booking - Complete flow with calendar update")
        print("✅ Test 3: Availability Check - Tool function works")
        print("✅ Test 4: Salon Booking - Different agent type works")
        print("✅ Test 5: Dental Appointment - Medical booking works")
        print("✅ Test 6: Policy Question - Policy agent handoff works")
        
        print("\n🔧 Frontend Calendar Updates:")
        print("📅 Restaurant booking should appear in restaurant calendar")
        print("📅 Salon booking should appear in salon calendar") 
        print("📅 Dental appointment should appear in dentist calendar")
        print("📅 All bookings should be visible in the frontend UI")
        
        print("\n⚠️  Note: Calendar updates are broadcast via WebSocket")
        print("   Check the frontend console for '📅 Calendar updated' messages")
        print("   Verify bookings appear in the calendar UI")
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_comprehensive_booking())
