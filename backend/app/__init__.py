from flask import Flask
from app.extensions import db  # <== from extensions now
import os
import logging
import json
import time
from flask_sock import Sock
from flask_cors import CORS
from dotenv import load_dotenv

# Set up logging
logger = logging.getLogger(__name__)

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # This will print to console
    ]
)

def create_app():
    here = os.path.abspath(os.path.dirname(__file__))

    app = Flask(
        __name__,
        static_folder=os.path.join(here, "..", "static"),
        static_url_path="/static"
    )
    
    # Initialize Flask-Sock
    sock = Sock()
    sock.init_app(app)
    
    app.config.from_pyfile("config.py")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///app.db")

    app.config.update(
      SESSION_COOKIE_SAMESITE="Lax",    # allow cookies on same site
      SESSION_COOKIE_SECURE=False,      # allow HTTP for local development
      SESSION_COOKIE_HTTPONLY=True      # keep it httpOnly
    )

    db.init_app(app)

    CORS(app, supports_credentials=True, origins=[
    "https://ai-voice-assistant-frontend.vercel.app",
    "http://localhost:5173"
])

    from .routes.assistant_routes import assistant_bp
    from .routes.auth_routes import auth_bp
    from .routes.rag_routes import rag_bp
    from .routes.stripe_routes import stripe_bp
    from .routes.demo_agent_routes import demo_agent_bp
    
    app.register_blueprint(assistant_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(stripe_bp, url_prefix="/stripe")
    app.register_blueprint(rag_bp)
    
    # Register demo routes with correct API prefix
    app.register_blueprint(demo_agent_bp, url_prefix="/api")
    print("🔌 Registered demo Agent routes")
    
    # Register realtime WebSocket routes
    print("🔧 REGISTERING REALTIME WEBSOCKET ROUTES...")
    logger.info("🔧 REGISTERING REALTIME WEBSOCKET ROUTES...")
    
    # Import and initialize the WebSocket routes
    from .routes.realtime_websocket import init_realtime_websocket
    init_realtime_websocket(sock)
    
    # Old WebSocket endpoint removed - using simplified version from realtime_websocket.py
    
    print("✅ REALTIME WEBSOCKET ROUTES REGISTERED")
    logger.info("✅ REALTIME WEBSOCKET ROUTES REGISTERED") 

    @app.route('/')
    def health_check():
        return {'status': 'ok', 'message': 'VocalHost Backend is running'}

    with app.app_context():
        db.create_all()

    return app
