#!/usr/bin/env python3
"""
Test RealtimeAgent initialization and text responses
"""

import os
import sys
import asyncio
import unittest
from unittest.mock import patch, Mock

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Mock the OpenAI API key before importing
with patch.dict(os.environ, {'OPENAI_KEY': 'test-key'}):
    from app.services.demo_app_agents.text_agent import DemoAgent

class TestRealtimeAgentInitialization(unittest.TestCase):
    """Test RealtimeAgent initialization and basic functionality"""
    
    def setUp(self):
        """Set up test environment"""
        self.agent = None
    
    def test_agent_initialization(self):
        """Test that RealtimeAgent initializes properly"""
        with patch.dict(os.environ, {'OPENAI_KEY': 'test-key'}):
            try:
                self.agent = DemoAgent()
                self.assertIsNotNone(self.agent)
                self.assertIsInstance(self.agent.agents, dict)
                print("✅ RealtimeAgent initialized successfully")
            except Exception as e:
                self.fail(f"Failed to initialize RealtimeAgent: {e}")
    
    def test_available_agents(self):
        """Test that all expected agents are available"""
        with patch.dict(os.environ, {'OPENAI_KEY': 'test-key'}):
            if not self.agent:
                self.agent = DemoAgent()
        
        expected_agents = ['restaurant', 'ecommerce', 'dentist', 'salon']
        available_agents = self.agent.get_available_agents()
        
        for agent_type in expected_agents:
            self.assertIn(agent_type, available_agents)
            self.assertIn(agent_type, self.agent.agents)
            print(f"✅ {agent_type} agent available")
    
    def test_agent_properties(self):
        """Test that agents have correct properties"""
        with patch.dict(os.environ, {'OPENAI_KEY': 'test-key'}):
            if not self.agent:
                self.agent = DemoAgent()
        
        for agent_type, agent in self.agent.agents.items():
            self.assertIsNotNone(agent.name)
            self.assertIsNotNone(agent.handoff_description)
            self.assertIsNotNone(agent.instructions)
            self.assertIsNotNone(agent.tools)
            print(f"✅ {agent_type} agent has all required properties")
    
    def test_greeting_messages(self):
        """Test that greeting messages are generated correctly"""
        with patch.dict(os.environ, {'OPENAI_KEY': 'test-key'}):
            if not self.agent:
                self.agent = DemoAgent()
        
        greetings = {}
        for agent_type in self.agent.get_available_agents():
            greeting = asyncio.run(self.agent.get_greeting(agent_type))
            greetings[agent_type] = greeting
            self.assertIsNotNone(greeting)
            self.assertIsInstance(greeting, str)
            self.assertGreater(len(greeting), 10)
            print(f"✅ {agent_type} greeting: {greeting[:50]}...")

class TestRealtimeAgentResponses(unittest.TestCase):
    """Test RealtimeAgent text responses"""
    
    def setUp(self):
        """Set up test environment"""
        with patch.dict(os.environ, {'OPENAI_KEY': 'test-key'}):
            self.agent = DemoAgent()
    
    def test_restaurant_agent_responses(self):
        """Test restaurant agent responses"""
        test_cases = [
            ("I want to book a table", "book"),
            ("Check availability for tomorrow", "check"),
            ("What times are available?", "check"),
            ("Hello", "general")
        ]
        
        for message, expected_type in test_cases:
            response = asyncio.run(self.agent.process_message(
                message=message,
                agent_type="restaurant",
                session_id="test",
                connection_id=None
            ))
            
            self.assertIsNotNone(response)
            self.assertIsInstance(response, str)
            self.assertGreater(len(response), 5)
            
            if expected_type == "book":
                self.assertIn("reservation", response.lower())
            elif expected_type == "check":
                self.assertIn("available", response.lower())
            
            print(f"✅ Restaurant agent response to '{message}': {response[:50]}...")
    
    def test_ecommerce_agent_responses(self):
        """Test ecommerce agent responses"""
        test_cases = [
            ("I want to buy something", "cart"),
            ("Add to cart", "cart"),
            ("Shopping", "cart"),
            ("Hello", "general")
        ]
        
        for message, expected_type in test_cases:
            response = asyncio.run(self.agent.process_message(
                message=message,
                agent_type="ecommerce",
                session_id="test",
                connection_id=None
            ))
            
            self.assertIsNotNone(response)
            self.assertIsInstance(response, str)
            self.assertGreater(len(response), 5)
            
            if expected_type == "cart":
                self.assertIn("cart", response.lower())
            
            print(f"✅ Ecommerce agent response to '{message}': {response[:50]}...")
    
    def test_invalid_agent_type(self):
        """Test response for invalid agent type"""
        response = asyncio.run(self.agent.process_message(
            message="Hello",
            agent_type="invalid_agent",
            session_id="test",
            connection_id=None
        ))
        
        self.assertIn("don't have an agent", response)
        print(f"✅ Invalid agent type handled: {response}")

class TestRealtimeAgentIntegration(unittest.TestCase):
    """Test RealtimeAgent integration with tools"""
    
    def setUp(self):
        """Set up test environment"""
        with patch.dict(os.environ, {'OPENAI_KEY': 'test-key'}):
            self.agent = DemoAgent()
    
    def test_agent_tools_loaded(self):
        """Test that tools are properly loaded in agents"""
        for agent_type, agent in self.agent.agents.items():
            self.assertIsNotNone(agent.tools)
            self.assertGreater(len(agent.tools), 0)
            print(f"✅ {agent_type} agent has {len(agent.tools)} tools loaded")
            
            # Check tool names
            tool_names = [getattr(tool, 'name', str(tool)) for tool in agent.tools]
            print(f"   Tools: {', '.join(tool_names)}")

def run_async_test(test_func):
    """Helper to run async tests"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(test_func())
    finally:
        loop.close()

if __name__ == '__main__':
    print("🧪 Testing RealtimeAgent Initialization and Responses")
    print("=" * 60)
    
    # Run initialization tests
    print("\n1. Testing Agent Initialization...")
    init_suite = unittest.TestLoader().loadTestsFromTestCase(TestRealtimeAgentInitialization)
    init_runner = unittest.TextTestRunner(verbosity=2)
    init_result = init_runner.run(init_suite)
    
    # Run response tests
    print("\n2. Testing Agent Responses...")
    response_suite = unittest.TestLoader().loadTestsFromTestCase(TestRealtimeAgentResponses)
    response_runner = unittest.TextTestRunner(verbosity=2)
    response_result = response_runner.run(response_suite)
    
    # Run integration tests
    print("\n3. Testing Agent Integration...")
    integration_suite = unittest.TestLoader().loadTestsFromTestCase(TestRealtimeAgentIntegration)
    integration_runner = unittest.TextTestRunner(verbosity=2)
    integration_result = integration_runner.run(integration_suite)
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    total_tests = (init_result.testsRun + response_result.testsRun + integration_result.testsRun)
    total_failures = (len(init_result.failures) + len(response_result.failures) + len(integration_result.failures))
    total_errors = (len(init_result.errors) + len(response_result.errors) + len(integration_result.errors))
    
    print(f"Total Tests: {total_tests}")
    print(f"Failures: {total_failures}")
    print(f"Errors: {total_errors}")
    print(f"Success Rate: {((total_tests - total_failures - total_errors) / total_tests * 100):.1f}%")
    
    if total_failures == 0 and total_errors == 0:
        print("🎉 All RealtimeAgent tests passed!")
    else:
        print("❌ Some tests failed. Check the output above for details.")
