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
    def websocket_endpoint(ws, session_id: str):
        """Main WebSocket endpoint with full voice agent integration"""
        import asyncio
        import threading
        from .services.demo_app_agents.voice_agent import realtime_voice_agent
        
        logger.info(f"🔌 NEW WEBSOCKET CONNECTION: session_id={session_id}")
        print(f"🔌 NEW WEBSOCKET CONNECTION: session_id={session_id}")
        print(f"🔍 WebSocket object type: {type(ws)}")
        print(f"🔍 Client address: {ws.environ.get('REMOTE_ADDR', 'unknown')}")
        print(f"🔍 User agent: {ws.environ.get('HTTP_USER_AGENT', 'unknown')}")
        
        try:
            # Send initial connection confirmation
            connection_msg = {
                "type": "connection_established",
                "session_id": session_id,
                "message": "WebSocket connected successfully",
                "timestamp": time.time()
            }
            ws.send(json.dumps(connection_msg))
            logger.info(f"✅ Connection confirmation sent: {connection_msg}")
            print(f"✅ Connection confirmation sent: {connection_msg}")
            
            # Start voice agent session asynchronously
            logger.info(f"🚀 Starting voice agent session for: {session_id}")
            print(f"🚀 Starting voice agent session for: {session_id}")
            
            # Create a new event loop for this thread
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            # Start the voice agent session
            session_started = loop.run_until_complete(
                realtime_voice_agent.start_session(session_id, "restaurant")
            )
            
            if not session_started:
                logger.error(f"❌ Failed to start voice agent session for {session_id}")
                print(f"❌ Failed to start voice agent session for {session_id}")
                return
            
            logger.info(f"✅ Voice agent session started for {session_id}")
            print(f"✅ Voice agent session started for {session_id}")
            
            # Start event processing in a separate thread
            def process_events():
                try:
                    event_loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(event_loop)
                    
                    async def event_processor():
                        try:
                            async for event in realtime_voice_agent.get_session_events(session_id):
                                try:
                                    # Send event to frontend
                                    ws.send(json.dumps(event))
                                    logger.info(f"📤 Event sent to frontend: {event.get('type', 'unknown')}")
                                    print(f"📤 Event sent to frontend: {event.get('type', 'unknown')}")
                                except Exception as e:
                                    logger.error(f"❌ Error sending event: {str(e)}")
                                    print(f"❌ Error sending event: {str(e)}")
                                    break
                        except Exception as e:
                            logger.error(f"❌ Error in event processor: {str(e)}")
                            print(f"❌ Error in event processor: {str(e)}")
                    
                    event_loop.run_until_complete(event_processor())
                except Exception as e:
                    logger.error(f"❌ Error in event processing thread: {str(e)}")
                    print(f"❌ Error in event processing thread: {str(e)}")
            
            # Start event processing thread
            event_thread = threading.Thread(target=process_events, daemon=True)
            event_thread.start()
            
            # Main WebSocket message loop
            while True:
                # Receive message from frontend
                logger.debug(f"🔄 Waiting for message from {session_id}...")
                data = ws.receive()
                
                if not data:
                    logger.info(f"📭 Empty data received, closing connection for {session_id}")
                    print(f"📭 Empty data received, closing connection for {session_id}")
                    break
                
                # Log raw data
                logger.info(f"📨 Raw data received ({len(data)} chars): {data[:200]}...")
                print(f"📨 Raw data received ({len(data)} chars): {data[:200]}...")
                
                try:
                    message = json.loads(data)
                    message_type = message.get("type", "unknown")
                    
                    logger.info(f"📝 Parsed message type: {message_type}")
                    print(f"📝 Parsed message type: {message_type}")
                    print(f"📝 Message keys: {list(message.keys())}")
                    
                    if message_type == "audio":
                        # Handle audio data - send to voice agent
                        audio_data = message.get("data", [])
                        logger.info(f"🎤 AUDIO DATA RECEIVED: {len(audio_data)} samples")
                        print(f"🎤 AUDIO DATA RECEIVED: {len(audio_data)} samples")
                        print(f"🎤 Sample values (first 10): {audio_data[:10] if audio_data else 'empty'}")
                        
                        if audio_data and len(audio_data) > 0:
                            # Convert audio data to bytes
                            import struct
                            audio_bytes = struct.pack(f"{len(audio_data)}h", *audio_data)
                            
                            # Send to voice agent
                            event_data = {
                                "type": "audio_data",
                                "audio_data": audio_bytes,
                                "format": "pcm16"
                            }
                            
                            # Process with voice agent asynchronously
                            try:
                                result = loop.run_until_complete(
                                    realtime_voice_agent.process_audio_event(session_id, event_data)
                                )
                                logger.info(f"✅ Audio processed by voice agent: {result}")
                                print(f"✅ Audio processed by voice agent: {result}")
                            except Exception as e:
                                logger.error(f"❌ Error processing audio with voice agent: {str(e)}")
                                print(f"❌ Error processing audio with voice agent: {str(e)}")
                            
                            # Send acknowledgment
                            ack_msg = {
                                "type": "audio_ack",
                                "received": len(audio_data),
                                "timestamp": time.time()
                            }
                            ws.send(json.dumps(ack_msg))
                            logger.info(f"✅ Audio ACK sent: {ack_msg}")
                            print(f"✅ Audio ACK sent: {ack_msg}")
                        else:
                            logger.warning(f"⚠️ Empty audio data received for session {session_id}")
                            print(f"⚠️ Empty audio data received for session {session_id}")
                    
                    elif message_type == "interrupt":
                        logger.info(f"🛑 Interrupt received for session {session_id}")
                        print(f"🛑 Interrupt received for session {session_id}")
                        
                        # Send interrupt to voice agent
                        try:
                            result = loop.run_until_complete(
                                realtime_voice_agent.process_audio_event(session_id, {"type": "interrupt"})
                            )
                            logger.info(f"✅ Interrupt processed by voice agent: {result}")
                            print(f"✅ Interrupt processed by voice agent: {result}")
                        except Exception as e:
                            logger.error(f"❌ Error processing interrupt: {str(e)}")
                            print(f"❌ Error processing interrupt: {str(e)}")
                        
                        interrupt_response = {
                            "type": "interrupt_ack",
                            "timestamp": time.time()
                        }
                        ws.send(json.dumps(interrupt_response))
                        logger.info(f"✅ Interrupt ACK sent")
                        print(f"✅ Interrupt ACK sent")
                    
                    elif message_type == "end_call":
                        logger.info(f"📞 End call received for session {session_id}")
                        print(f"📞 End call received for session {session_id}")
                        
                        # End voice agent session
                        try:
                            loop.run_until_complete(
                                realtime_voice_agent.end_session(session_id)
                            )
                            logger.info(f"✅ Voice agent session ended for {session_id}")
                            print(f"✅ Voice agent session ended for {session_id}")
                        except Exception as e:
                            logger.error(f"❌ Error ending voice agent session: {str(e)}")
                            print(f"❌ Error ending voice agent session: {str(e)}")
                        
                        break
                    
                    else:
                        # Echo back unknown message types
                        logger.info(f"❓ Unknown message type: {message_type}")
                        print(f"❓ Unknown message type: {message_type}")
                        
                        unknown_response = {
                            "type": "message_ack",
                            "received_type": message_type,
                            "original": message,
                            "timestamp": time.time()
                        }
                        ws.send(json.dumps(unknown_response))
                        
                except json.JSONDecodeError as e:
                    logger.error(f"❌ Invalid JSON received: {str(e)}")
                    print(f"❌ Invalid JSON received: {str(e)}")
                    print(f"❌ Raw data: {data}")
                    
                    error_response = {
                        "type": "error",
                        "error": "Invalid JSON format",
                        "timestamp": time.time()
                    }
                    ws.send(json.dumps(error_response))
                    
        except Exception as e:
            logger.error(f"❌ WebSocket error for {session_id}: {str(e)}")
            print(f"❌ WebSocket error for {session_id}: {str(e)}")
            import traceback
            traceback_str = traceback.format_exc()
            logger.error(f"❌ Traceback: {traceback_str}")
            print(f"❌ Traceback: {traceback_str}")
        finally:
            logger.info(f"🔌 WebSocket DISCONNECTED: {session_id}")
            print(f"🔌 WebSocket DISCONNECTED: {session_id}")
            
            # Clean up voice agent session
            try:
                loop.run_until_complete(
                    realtime_voice_agent.end_session(session_id)
                )
                logger.info(f"✅ Voice agent session cleaned up for {session_id}")
                print(f"✅ Voice agent session cleaned up for {session_id}")
            except Exception as e:
                logger.error(f"❌ Error cleaning up voice agent session: {str(e)}")
                print(f"❌ Error cleaning up voice agent session: {str(e)}")

    @sock.route('/api/test/ws/<session_id>')
    def test_websocket_endpoint(ws, session_id: str):
        """Minimal echo WebSocket for testing - no logging"""
        try:
            while True:
                data = ws.receive()
                if not data:
                    break
                
                try:
                    message = json.loads(data)
                    response = {
                        "type": "echo",
                        "original": message
                    }
                    ws.send(json.dumps(response))
                except json.JSONDecodeError:
                    error_response = {
                        "type": "error",
                        "error": "Invalid JSON format"
                    }
                    ws.send(json.dumps(error_response))
                    
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
