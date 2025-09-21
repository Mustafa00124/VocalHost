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
    from .routes.realtime_websocket import realtime_ws_bp, init_realtime_websocket
    
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
    
    # Import the WebSocket manager and register the route directly on the app
    from .routes.realtime_websocket import manager, handle_websocket_message
    
    @sock.route('/api/realtime/ws/<session_id>')
    async def websocket_endpoint(ws, session_id: str):
        """Main WebSocket endpoint following OpenAI pattern"""
        try:
            print(f"🔌 WebSocket endpoint called for session: {session_id}")
            print(f"🔍 WebSocket object type: {type(ws)}")
            print(f"🔍 WebSocket object attributes: {dir(ws)}")
            
            await manager.connect(ws, session_id)
            
            while True:
                # Receive message from frontend
                print(f"🔄 Waiting for message from {session_id}...")
                data = await ws.receive()
                print(f"📨 Received data: {data}")
                if not data:
                    break
                
                try:
                    message = json.loads(data)
                    print(f"📝 Parsed message: {message}")
                    await handle_websocket_message(ws, session_id, message)
                except json.JSONDecodeError as e:
                    logger.error(f"❌ Invalid JSON received: {str(e)}")
                    await ws.send(json.dumps({
                        "type": "error",
                        "error": "Invalid JSON format"
                    }))
                    
        except Exception as e:
            logger.error(f"❌ WebSocket error for {session_id}: {str(e)}")
            print(f"❌ WebSocket error for {session_id}: {str(e)}")
            import traceback
            print(f"❌ Traceback: {traceback.format_exc()}")
        finally:
            await manager.disconnect(session_id)

    @sock.route('/api/test/ws/<session_id>')
    async def test_websocket_endpoint(ws, session_id: str):
        """Minimal echo WebSocket for testing - no logging"""
        try:
            while True:
                data = await ws.receive()
                if not data:
                    break
                
                try:
                    message = json.loads(data)
                    response = {
                        "type": "echo",
                        "original": message
                    }
                    await ws.send(json.dumps(response))
                except json.JSONDecodeError:
                    error_response = {
                        "type": "error",
                        "error": "Invalid JSON format"
                    }
                    await ws.send(json.dumps(error_response))
                    
        except Exception:
            pass
    
    print("✅ REALTIME WEBSOCKET ROUTES REGISTERED")
    logger.info("✅ REALTIME WEBSOCKET ROUTES REGISTERED") 

    @app.route('/')
    def health_check():
        return {'status': 'ok', 'message': 'VocalHost Backend is running'}

    with app.app_context():
        db.create_all()

    return app
