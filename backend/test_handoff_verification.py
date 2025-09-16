#!/usr/bin/env python3
"""
Verify if tool agent is actually activated during handoffs
"""
import asyncio
import sys
import os
import requests
import json

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def test_handoff_verification():
    """Verify tool agent activation"""
    print("🔍 Verifying Tool Agent Activation")
    print("=" * 50)
    
    try:
        # Test 1: Tool handoff - should show tool agent behavior
        print("\n📅 TEST 1: Tool Agent Activation (Booking)")
        print("-" * 40)
        
        response = requests.post('http://localhost:5000/demo/text/chat', 
            json={
                'message': 'I want to make a reservation for John Smith on January 15th at 7 PM',
                'agent_type': 'restaurant',
                'session_id': 'verification_test'
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data['response']}")
            
            # Check for tool agent behavior indicators
            tool_agent_indicators = [
                "Please wait while I book",
                "Let me help you with that booking",
                "Let me process that for you",
                "I'll book your reservation",
                "Making your reservation"
            ]
            
            found_indicator = None
            for indicator in tool_agent_indicators:
                if indicator.lower() in data['response'].lower():
                    found_indicator = indicator
                    break
            
            if found_indicator:
                print(f"✅ SUCCESS: Tool agent activated - found: '{found_indicator}'")
            else:
                print("❌ FAILED: No tool agent activation detected")
                print("   Expected: 'Please wait while I book...' or similar")
                print("   Got: Generic response without tool agent behavior")
        else:
            print(f"❌ HTTP Error: {response.status_code}")
        
        # Test 2: Availability check - should show tool agent behavior
        print("\n📅 TEST 2: Tool Agent Activation (Availability)")
        print("-" * 40)
        
        response = requests.post('http://localhost:5000/demo/text/chat', 
            json={
                'message': 'What times are available for dinner on January 20th?',
                'agent_type': 'restaurant',
                'session_id': 'verification_test'
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data['response']}")
            
            # Check for tool agent behavior indicators
            tool_agent_indicators = [
                "Let me check our availability",
                "Let me check availability",
                "Checking availability",
                "Let me look up availability"
            ]
            
            found_indicator = None
            for indicator in tool_agent_indicators:
                if indicator.lower() in data['response'].lower():
                    found_indicator = indicator
                    break
            
            if found_indicator:
                print(f"✅ SUCCESS: Tool agent activated - found: '{found_indicator}'")
            else:
                print("❌ FAILED: No tool agent activation detected")
                print("   Expected: 'Let me check our availability...' or similar")
                print("   Got: Direct tool response without activation message")
        else:
            print(f"❌ HTTP Error: {response.status_code}")
        
        # Test 3: Policy handoff - should show policy agent behavior
        print("\n📅 TEST 3: Policy Agent Activation (Policy Question)")
        print("-" * 40)
        
        response = requests.post('http://localhost:5000/demo/text/chat', 
            json={
                'message': 'What are your operating hours?',
                'agent_type': 'restaurant',
                'session_id': 'verification_test'
            }
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data['response']}")
            
            # Check for policy agent behavior indicators
            policy_agent_indicators = [
                "Let me check our policies",
                "Let me look up that information",
                "Checking our policies",
                "Let me find that information"
            ]
            
            found_indicator = None
            for indicator in policy_agent_indicators:
                if indicator.lower() in data['response'].lower():
                    found_indicator = indicator
                    break
            
            if found_indicator:
                print(f"✅ SUCCESS: Policy agent activated - found: '{found_indicator}'")
            else:
                print("❌ FAILED: No policy agent activation detected")
                print("   Expected: 'Let me check our policies...' or similar")
                print("   Got: Direct response without policy agent behavior")
        else:
            print(f"❌ HTTP Error: {response.status_code}")
        
        print("\n" + "=" * 50)
        print("🎯 Handoff Verification Results:")
        print("=" * 50)
        
        print("\n📋 WHAT WE'RE LOOKING FOR:")
        print("✅ Tool Agent: 'Please wait while I book...' or 'Let me check availability...'")
        print("✅ Policy Agent: 'Let me check our policies...' or 'Let me look up...'")
        print("❌ Chat Agent: Direct responses without handoff messages")
        
        print("\n🔍 CONCLUSION:")
        print("If we see handoff messages, the agents are working properly")
        print("If we don't see handoff messages, the chat agent is calling tools directly")
        
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to backend server")
        print("Make sure the backend is running: python run.py")
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_handoff_verification())
