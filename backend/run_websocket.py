#!/usr/bin/env python3
"""
WebSocket-compatible server runner
Uses gunicorn with gevent workers for proper WebSocket support
"""

import os
import sys
from app import create_app

# Create the Flask app
app = create_app()

if __name__ == "__main__":
    # Use gunicorn with gevent workers for WebSocket support
    os.system("gunicorn --worker-class gevent --worker-connections 1000 --bind 0.0.0.0:5000 --timeout 120 --keep-alive 2 --max-requests 1000 --max-requests-jitter 100 run_websocket:app")
