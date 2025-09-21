#!/usr/bin/env python3
"""
Simple Flask WebSocket test
Tests basic WebSocket functionality with flask-sock
"""

from flask import Flask
from flask_sock import Sock
import json
import time

app = Flask(__name__)
sock = Sock(app)

@app.route('/')
def hello():
    return "Flask WebSocket Test Server"

@sock.route('/ws/<session_id>')
def websocket_endpoint(ws, session_id):
    """Simple WebSocket endpoint"""
    print(f"🔌 WebSocket connected: {session_id}")
    
    try:
        while True:
            data = ws.receive()
            if not data:
                break
            
            print(f"📨 Received: {data}")
            
            try:
                message = json.loads(data)
                response = {
                    "type": "echo",
                    "original": message,
                    "timestamp": time.time()
                }
                ws.send(json.dumps(response))
                print(f"📤 Sent: {response}")
                
            except json.JSONDecodeError:
                error_response = {
                    "type": "error",
                    "error": "Invalid JSON"
                }
                ws.send(json.dumps(error_response))
                print(f"📤 Sent error: {error_response}")
                
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
    finally:
        print(f"🔌 WebSocket disconnected: {session_id}")

if __name__ == "__main__":
    print("🚀 Starting simple Flask WebSocket server...")
    print("📡 Server: http://localhost:5000")
    print("🔌 WebSocket: ws://localhost:5000/ws/<session_id>")
    
    app.run(host="0.0.0.0", port=5000, debug=False)
