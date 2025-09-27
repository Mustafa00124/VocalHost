#!/usr/bin/env python3
"""
FastAPI application setup
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def create_fastapi_app():
    """Create and configure FastAPI application"""
    
    app = FastAPI(
        title="VocalHost API",
        description="AI Voice Assistant Backend API",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc"
    )
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "https://ai-voice-assistant-frontend.vercel.app",
            "http://localhost:5173"
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Static files (if needed)
    static_path = os.path.join(os.path.dirname(__file__), "..", "static")
    if os.path.exists(static_path):
        app.mount("/static", StaticFiles(directory=static_path), name="static")
    
    # Health check endpoint
    @app.get("/")
    async def health_check():
        return {"status": "ok", "message": "VocalHost Backend is running"}
    
    # Create database tables
    from app.database import create_tables
    create_tables()
    
    # Include routers
    from app.routes.rag_routes import rag_router
    from app.routes.demo_agent_routes import demo_agent_router
    from app.routes.auth_routes import auth_router
    from app.routes.realtime_websocket import realtime_router
    
    app.include_router(demo_agent_router)
    app.include_router(rag_router)
    app.include_router(auth_router)
    app.include_router(realtime_router)
    
    return app

# Create the app instance
app = create_fastapi_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
