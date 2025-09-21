#!/usr/bin/env python3
"""
Flask WebSocket server using flask-sock
Simple and works on Windows
"""

from app import create_app

# Create the Flask app
app = create_app()

if __name__ == "__main__":
    print("🚀 Starting Flask WebSocket server...")
    print("📡 Server will be available at: http://localhost:5000")
    print("🔌 WebSocket endpoint: ws://localhost:5000/api/realtime/ws/<session_id>")
    print("🧪 Test endpoint: ws://localhost:5000/api/test/ws/<session_id>")
    print("⚠️  Note: This uses Flask development server - WebSockets may have issues")
    print("💡 If WebSockets fail, try the frontend anyway - sometimes it works!")
    
    # Run with Flask development server
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)
