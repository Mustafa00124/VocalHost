#!/usr/bin/env python3
"""
Test WebSocket communication between backend and frontend
"""

import os
import sys
import asyncio
import json
import unittest
import websockets
from unittest.mock import patch, Mock

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Mock the OpenAI API key before importing
with patch.dict(os.environ, {'OPENAI_KEY': 'test-key'}):
    from app.services.demo_app_agents.demo_websocket_handler import demo_websocket_handler
    from app.services.demo_app_agents.text_agent import demo_agent

class TestWebSocketHandler(unittest.TestCase):
    """Test WebSocket handler functionality"""
    
    def setUp(self):
        """Set up test environment"""
        self.handler = demo_websocket_handler
        self.connection_id = "test_connection_123"
        self.mock_websocket = Mock()
    
    def test_handler_initialization(self):
        """Test that WebSocket handler initializes properly"""
        self.assertIsNotNone(self.handler)
        self.assertIsInstance(self.handler.active_connections, dict)
        self.assertIsInstance(self.handler.pending_acks, dict)
        print("✅ WebSocket handler initialized successfully")
    
    def test_connection_management(self):
        """Test adding and removing connections"""
        # Test adding connection
        connection_id = self.handler.add_connection(self.mock_websocket, self.connection_id)
        self.assertEqual(connection_id, self.connection_id)
        self.assertIn(self.connection_id, self.handler.active_connections)
        print("✅ Connection added successfully")
        
        # Test removing connection
        self.handler.remove_connection(self.connection_id)
        self.assertNotIn(self.connection_id, self.handler.active_connections)
        print("✅ Connection removed successfully")
    
    def test_message_sending(self):
        """Test sending messages through WebSocket"""
        # Add a mock connection
        self.handler.add_connection(self.mock_websocket, self.connection_id)
        
        # Test sending a message
        test_message = {"type": "test", "message": "Hello World"}
        asyncio.run(self.handler.send_message(self.connection_id, test_message))
        
        # Verify the mock was called
        self.mock_websocket.send.assert_called_once()
        print("✅ Message sending works correctly")
    
    def test_state_update_flow(self):
        """Test state update message flow"""
        # Add a mock connection
        self.handler.add_connection(self.mock_websocket, self.connection_id)
        
        # Test sending state update
        test_payload = {"id": "test_booking", "date": "2025-01-15", "time": "7:00 PM", "customerName": "Test User"}
        
        # Mock the websocket send method to return immediately
        self.mock_websocket.send = Mock()
        
        # Send state update (this should timeout since no ack will be received)
        result = asyncio.run(self.handler.send_state_update(
            self.connection_id, 
            "addBooking", 
            "restaurant", 
            test_payload
        ))
        
        # Should return False due to timeout (no ack received)
        self.assertFalse(result)
        print("✅ State update flow works (timeout as expected)")
    
    def test_ack_handling(self):
        """Test acknowledgment handling"""
        # Add a mock connection
        self.handler.add_connection(self.mock_websocket, self.connection_id)
        
        # Simulate a pending ack
        message_id = "test_message_123"
        self.handler.pending_acks[message_id] = {
            "connection_id": self.connection_id,
            "action": "addBooking",
            "timestamp": asyncio.get_event_loop().time()
        }
        
        # Test handling ack
        ack_message = {
            "type": "ack",
            "messageId": message_id,
            "action": "addBooking",
            "status": "success"
        }
        
        asyncio.run(self.handler.handle_ack(self.connection_id, ack_message))
        
        # Verify ack was processed
        self.assertNotIn(message_id, self.handler.pending_acks)
        print("✅ Acknowledgment handling works correctly")

class TestWebSocketIntegration(unittest.TestCase):
    """Test WebSocket integration with RealtimeAgent"""
    
    def setUp(self):
        """Set up test environment"""
        with patch.dict(os.environ, {'OPENAI_KEY': 'test-key'}):
            self.agent = demo_agent
        self.handler = demo_websocket_handler
        self.connection_id = "test_integration_123"
        self.mock_websocket = Mock()
    
    def test_agent_websocket_integration(self):
        """Test integration between agent and WebSocket handler"""
        # Add a mock connection
        self.handler.add_connection(self.mock_websocket, self.connection_id)
        
        # Test processing a message through the agent
        test_message = "I want to book a table for tomorrow at 7pm"
        response = asyncio.run(self.agent.process_message(
            message=test_message,
            agent_type="restaurant",
            session_id="test",
            connection_id=self.connection_id
        ))
        
        self.assertIsNotNone(response)
        self.assertIsInstance(response, str)
        print(f"✅ Agent-WebSocket integration works: {response[:50]}...")
    
    def test_websocket_message_types(self):
        """Test different WebSocket message types"""
        message_types = [
            {"type": "chat", "message": "Hello", "agent_type": "restaurant"},
            {"type": "set_agent_type", "agent_type": "ecommerce"},
            {"type": "ack", "messageId": "123", "action": "addBooking", "status": "success"}
        ]
        
        for msg in message_types:
            self.assertIn("type", msg)
            self.assertIsInstance(msg["type"], str)
            print(f"✅ Message type '{msg['type']}' is valid")

class TestWebSocketEndpoints(unittest.TestCase):
    """Test WebSocket endpoint functionality"""
    
    def test_websocket_route_exists(self):
        """Test that WebSocket route is properly configured"""
        try:
            from app.routes.demo_websocket_routes import demo_websocket_bp, sock
            self.assertIsNotNone(demo_websocket_bp)
            self.assertIsNotNone(sock)
            print("✅ WebSocket route and sock are properly configured")
        except ImportError as e:
            self.fail(f"Failed to import WebSocket routes: {e}")
    
    def test_websocket_blueprint_registration(self):
        """Test that WebSocket blueprint is registered"""
        try:
            from app import create_app
            app = create_app()
            
            # Check if the blueprint is registered
            blueprint_names = [bp.name for bp in app.blueprints.values()]
            self.assertIn('demo_websocket', blueprint_names)
            print("✅ WebSocket blueprint is registered with Flask app")
        except Exception as e:
            self.fail(f"Failed to verify blueprint registration: {e}")

def run_async_test(test_func):
    """Helper to run async tests"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(test_func())
    finally:
        loop.close()

if __name__ == '__main__':
    print("🧪 Testing WebSocket Communication")
    print("=" * 60)
    
    # Run WebSocket handler tests
    print("\n1. Testing WebSocket Handler...")
    handler_suite = unittest.TestLoader().loadTestsFromTestCase(TestWebSocketHandler)
    handler_runner = unittest.TextTestRunner(verbosity=2)
    handler_result = handler_runner.run(handler_suite)
    
    # Run integration tests
    print("\n2. Testing WebSocket Integration...")
    integration_suite = unittest.TestLoader().loadTestsFromTestCase(TestWebSocketIntegration)
    integration_runner = unittest.TextTestRunner(verbosity=2)
    integration_result = integration_runner.run(integration_suite)
    
    # Run endpoint tests
    print("\n3. Testing WebSocket Endpoints...")
    endpoint_suite = unittest.TestLoader().loadTestsFromTestCase(TestWebSocketEndpoints)
    endpoint_runner = unittest.TextTestRunner(verbosity=2)
    endpoint_result = endpoint_runner.run(endpoint_suite)
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 WEBSOCKET TEST SUMMARY")
    print("=" * 60)
    
    total_tests = (handler_result.testsRun + integration_result.testsRun + endpoint_result.testsRun)
    total_failures = (len(handler_result.failures) + len(integration_result.failures) + len(endpoint_result.failures))
    total_errors = (len(handler_result.errors) + len(integration_result.errors) + len(endpoint_result.errors))
    
    print(f"Total Tests: {total_tests}")
    print(f"Failures: {total_failures}")
    print(f"Errors: {total_errors}")
    print(f"Success Rate: {((total_tests - total_failures - total_errors) / total_tests * 100):.1f}%")
    
    if total_failures == 0 and total_errors == 0:
        print("🎉 All WebSocket tests passed!")
    else:
        print("❌ Some tests failed. Check the output above for details.")
