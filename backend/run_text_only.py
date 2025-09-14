"""
Minimal Flask server for text chat only
"""
import os
import logging
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=True)

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def create_text_app():
    """Create a minimal Flask app with only text chat functionality"""
    logger.info("🚀 Creating minimal Flask app...")
    app = Flask(__name__)
    
    # Enable CORS
    logger.info("🌐 Enabling CORS...")
    CORS(app, supports_credentials=True, origins=[
        "https://ai-voice-assistant-frontend.vercel.app",
        "http://localhost:5173"
    ])
    
    # Only import text routes (no RAG, no LangChain)
    logger.info("📦 Importing text routes...")
    try:
        from app.routes.demo_text_routes import demo_text_bp
        logger.info("✅ Text routes imported successfully")
        app.register_blueprint(demo_text_bp, url_prefix="/demo/text")
        logger.info("✅ Text routes registered with prefix /demo/text")
    except Exception as e:
        logger.error(f"❌ Failed to import text routes: {e}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        raise
    
    logger.info("🎉 Flask app created successfully")
    return app

if __name__ == "__main__":
    logger.info("🎬 Starting text-only server...")
    app = create_text_app()
    logger.info("🚀 Starting text-only server...")
    logger.info("📱 Text chat available at: http://localhost:5000/demo/text/chat")
    logger.info("🔍 Debug mode enabled - check logs for detailed information")
    app.run(host="0.0.0.0", port=5000, debug=True)
