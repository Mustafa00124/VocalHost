from app import create_app
import os

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'  # Allow OAuth over HTTP for development

app = create_app()

if __name__ == "__main__":
    # Run with native WebSocket support
    app.run(host="0.0.0.0", port=5000, debug=False)
