#!/usr/bin/env python3
"""
WebSocket-compatible server runner using eventlet
This properly supports WebSockets unlike the Flask development server
"""

import eventlet
from eventlet import wsgi
from app import create_app

# Create the Flask app
app = create_app()

if __name__ == "__main__":
    print("🚀 Starting WebSocket-compatible server with eventlet...")
    print("📡 Server will be available at: http://localhost:5000")
    print("🔌 WebSocket endpoint: ws://localhost:5000/api/realtime/ws/<session_id>")
    print("🧪 Test endpoint: ws://localhost:5000/api/test/ws/<session_id>")
    
    # Use eventlet for proper WebSocket support
    wsgi.server(
        eventlet.listen(('0.0.0.0', 5000)), 
        app, 
        log_output=True
    )
