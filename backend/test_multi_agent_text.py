#!/usr/bin/env python3
"""
Test script for the new multi-agent text system
"""
import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.voice_agent_demo_app.demo_text_agent import DemoTextAgent

async def test_multi_agent_system():
    """Test the multi-agent text system"""
    print("🚀 Testing Multi-Agent Text System")
    print("=" * 50)
    
    try:
        # Initialize the agent
        print("📝 Initializing DemoTextAgent...")
        agent = DemoTextAgent()
        print("✅ Agent initialized successfully!")
        
        # Test cases
        test_cases = [
            {
                "message": "I'd like to make a reservation for 4 people tomorrow at 7 PM",
                "agent_type": "restaurant",
                "description": "Restaurant booking request"
            },
            {
                "message": "What's your cancellation policy?",
                "agent_type": "restaurant", 
                "description": "Policy question"
            },
            {
                "message": "I need to book a haircut appointment with Sarah",
                "agent_type": "salon",
                "description": "Salon booking request"
            },
            {
                "message": "What are your business hours?",
                "agent_type": "salon",
                "description": "Business hours question"
            },
            {
                "message": "I want to order a blue t-shirt in size large",
                "agent_type": "ecommerce",
                "description": "E-commerce order request"
            },
            {
                "message": "What's your return policy?",
                "agent_type": "ecommerce",
                "description": "Return policy question"
            }
        ]
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\n🧪 Test Case {i}: {test_case['description']}")
            print(f"📝 Message: {test_case['message']}")
            print(f"🏢 Agent Type: {test_case['agent_type']}")
            print("-" * 30)
            
            try:
                response = await agent.process_text_message(
                    message=test_case['message'],
                    agent_type=test_case['agent_type']
                )
                print(f"🤖 Response: {response}")
                print("✅ Test passed!")
            except Exception as e:
                print(f"❌ Test failed: {e}")
        
        # Test auto-routing
        print(f"\n🎯 Testing Auto-Routing")
        print("-" * 30)
        
        auto_test_cases = [
            "I need help with my restaurant reservation",
            "Can you help me with a salon appointment?",
            "I have a question about my online order",
            "I need to schedule a dental cleaning",
            "I'm having trouble with my account"
        ]
        
        for message in auto_test_cases:
            print(f"\n📝 Message: {message}")
            try:
                response = await agent.process_text_message(
                    message=message,
                    agent_type=None  # Auto-routing
                )
                print(f"🤖 Response: {response}")
                print("✅ Auto-routing test passed!")
            except Exception as e:
                print(f"❌ Auto-routing test failed: {e}")
        
        # Test agent status
        print(f"\n📊 Agent Status")
        print("-" * 30)
        status = agent.get_status()
        print(f"Available Agents: {status['agent_types']}")
        print(f"Total Agents: {status['total_agents']}")
        print(f"Ecosystem Type: {status['ecosystem_type']}")
        print(f"Features: {', '.join(status['features'])}")
        
        print(f"\n🎉 All tests completed!")
        
    except Exception as e:
        print(f"❌ Error initializing agent: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_multi_agent_system())
