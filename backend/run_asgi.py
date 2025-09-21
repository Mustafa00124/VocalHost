#!/usr/bin/env python3
"""
ASGI server runner with proper WebSocket support
Uses uvicorn with gevent workers
"""

import os
import sys
from app import create_app

# Create the Flask app
app = create_app()

if __name__ == "__main__":
    # Use uvicorn with gevent workers for WebSocket support
    os.system("uvicorn run_asgi:app --host 0.0.0.0 --port 5000 --workers 1 --worker-class gevent")
