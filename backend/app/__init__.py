from flask import Flask
from app.extensions import db  # <== from extensions now
import os
from flask_sock import Sock
from flask_cors import CORS

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
    from .routes.demo_voice_routes import demo_voice_bp
    from .routes.demo_text_routes import demo_text_bp

    # Pass the sock instance to the demo routes
    from .routes.demo_voice_routes import setup_sock
    setup_sock(sock)
    
    app.register_blueprint(assistant_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(stripe_bp, url_prefix="/stripe")
    app.register_blueprint(rag_bp)
    
    # Register demo routes
    app.register_blueprint(demo_voice_bp, url_prefix="/demo")
    app.register_blueprint(demo_text_bp, url_prefix="/demo/text") 

    @app.route('/')
    def health_check():
        return {'status': 'ok', 'message': 'VocalHost Backend is running'}

    with app.app_context():
        db.create_all()

    return app
