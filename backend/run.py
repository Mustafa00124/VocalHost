#!/usr/bin/env python3
"""
Run FastAPI server
"""

import uvicorn
from app_fastapi import app

if __name__ == "__main__":
    print("Starting FastAPI server...")
    print("Server will be available at: http://localhost:5000")
    print("API docs will be available at: http://localhost:5000/docs")
    print("WebSocket endpoint: ws://localhost:5000/ws/{session_id}")
    
    uvicorn.run(
        "app_fastapi:app",  # Import string instead of app object
        host="0.0.0.0",
        port=5000,
        reload=True,
        log_level="info",
        # Increased WebSocket frame size to handle audio data
        ws_max_size=16 * 1024 * 1024,
    )
