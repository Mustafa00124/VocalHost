from flask import Flask
from app.extensions import db  # <== from extensions now
import os
from flask_sock import Sock
from flask_cors import CORS 
sock = Sock()

def create_app():
    here = os.path.abspath(os.path.dirname(__file__))

    app = Flask(
        __name__,
        static_folder=os.path.join(here, "..", "static"),
        static_url_path="/static"
    )
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
    from .routes.voice_routes import voice_bp
    from .routes.stripe_routes import stripe_bp

    app.register_blueprint(assistant_bp, url_prefix="/api")
    app.register_blueprint(voice_bp, url_prefix="/voice")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(stripe_bp, url_prefix="/stripe")
    app.register_blueprint(rag_bp) 

    with app.app_context():
        db.create_all()

    return app
