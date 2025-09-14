"""
Simplified WebSocket handler for OpenAI Agents SDK integration
"""
import json
import asyncio
from typing import Dict, Any, Optional

class WebSocketHandler:
    """Simplified WebSocket handler for SDK integration"""
    
    def __init__(self):
        self.active_connections: Dict[str, Any] = {}
    
    def add_connection(self, websocket) -> str:
        """Add a new WebSocket connection"""
        connection_id = f"demo_{len(self.active_connections)}"
        self.active_connections[connection_id] = websocket
        print(f"🔌 Added WebSocket connection: {connection_id} (total: {len(self.active_connections)})")
        return connection_id
    
    def remove_connection(self, connection_id: str):
        """Remove a WebSocket connection"""
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
    
    async def send_message(self, connection_id: str, message: Dict[str, Any]):
        """Send message to specific connection"""
        print(f"📤 Attempting to send message to {connection_id}: {message.get('type', 'unknown')}")
        if connection_id in self.active_connections:
            try:
                websocket = self.active_connections[connection_id]
                await websocket.send(json.dumps(message))
                print(f"✅ Message sent successfully to {connection_id}")
            except Exception as e:
                print(f"❌ Error sending message to {connection_id}: {e}")
                self.remove_connection(connection_id)
        else:
            print(f"❌ Connection {connection_id} not found in active connections")
    
    def broadcast_message(self, message: Dict[str, Any]):
        """Broadcast message to all active connections"""
        for connection_id in list(self.active_connections.keys()):
            asyncio.create_task(self.send_message(connection_id, message))

# Global WebSocket handler instance
websocket_handler = WebSocketHandler()
