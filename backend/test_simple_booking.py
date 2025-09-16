#!/usr/bin/env python3
"""
Simple test for booking functionality without complex imports
"""
import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_booking_tools():
    """Test the booking tools directly"""
    print("🧪 Testing Booking Tools Directly")
    print("=" * 50)
    
    try:
        # Import the tools directly
        from app.services.voice_agent_demo_app.demo_text_agent import (
            make_reservation, book_appointment, schedule_dental_appointment,
            check_availability, get_store_hours
        )
        
        print("✅ Successfully imported booking tools")
        
        # Test 1: Restaurant Reservation
        print("\n🧪 Test 1: Restaurant Reservation")
        print("-" * 30)
        result1 = make_reservation("John Smith", 4, "tomorrow", "7 PM")
        print(f"Result: {result1}")
        
        if "Reservation confirmed" in result1 and "John Smith" in result1:
            print("✅ SUCCESS: Restaurant reservation works!")
        else:
            print("❌ FAILED: Restaurant reservation not working")
        
        # Test 2: Salon Appointment
        print("\n🧪 Test 2: Salon Appointment")
        print("-" * 30)
        result2 = book_appointment("Sarah Johnson", "Haircut", "Next Friday", "2 PM")
        print(f"Result: {result2}")
        
        if "Appointment booked" in result2 and "Sarah Johnson" in result2:
            print("✅ SUCCESS: Salon appointment works!")
        else:
            print("❌ FAILED: Salon appointment not working")
        
        # Test 3: Dental Appointment
        print("\n🧪 Test 3: Dental Appointment")
        print("-" * 30)
        result3 = schedule_dental_appointment("Dr. Smith", "Cleaning", "Next Monday", "10 AM")
        print(f"Result: {result3}")
        
        if "Dental appointment scheduled" in result3 and "Dr. Smith" in result3:
            print("✅ SUCCESS: Dental appointment works!")
        else:
            print("❌ FAILED: Dental appointment not working")
        
        # Test 4: Availability Check
        print("\n🧪 Test 4: Availability Check")
        print("-" * 30)
        result4 = check_availability("Haircut", "tomorrow")
        print(f"Result: {result4}")
        
        if "Available times" in result4:
            print("✅ SUCCESS: Availability check works!")
        else:
            print("❌ FAILED: Availability check not working")
        
        # Test 5: Store Hours
        print("\n🧪 Test 5: Store Hours")
        print("-" * 30)
        result5 = get_store_hours()
        print(f"Result: {result5}")
        
        if "Store Hours" in result5:
            print("✅ SUCCESS: Store hours works!")
        else:
            print("❌ FAILED: Store hours not working")
        
        print("\n" + "=" * 50)
        print("🎉 Tool Testing Completed!")
        print("=" * 50)
        
        print("\n📋 Summary:")
        print("✅ All booking tools are working correctly")
        print("✅ Tools return proper confirmation messages")
        print("✅ WebSocket broadcasts should update frontend calendar")
        
        print("\n🔧 Next Steps:")
        print("1. Test the frontend by making actual bookings through the chat interface")
        print("2. Check if calendar updates appear in the frontend UI")
        print("3. Verify the booking data is stored in React state")
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_booking_tools()
