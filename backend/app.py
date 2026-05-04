import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from models import db
from config import Config
from routes.auth import auth
from routes.dashboard import dashboard
from routes.projects import projects
from routes.requests import requests_bp
from routes.invoices import invoices_bp
from routes.courses import courses_bp

app = Flask(__name__)
app.config.from_object(Config)

# Restrict CORS to the configured allowed origin in production
allowed_origin = os.environ.get("ALLOWED_ORIGIN", "*")
CORS(app, origins=allowed_origin)

db.init_app(app)

app.register_blueprint(auth, url_prefix="/api/auth")
app.register_blueprint(dashboard, url_prefix="/api/dashboard")
app.register_blueprint(projects, url_prefix="/api/projects")
app.register_blueprint(requests_bp, url_prefix="/api/requests")
app.register_blueprint(invoices_bp, url_prefix="/api/invoices")
app.register_blueprint(courses_bp, url_prefix="/api/courses")

with app.app_context():
    try:
        db.create_all()
        print("Database tables synchronized.")
    except Exception as e:
        print(f"Warning: Could not synchronize database tables: {e}")

@app.route("/")
def home():
    return {"status": "ok", "message": "Dabest Tech Hub API is running"}

if __name__ == "__main__":
    # debug=True only runs locally — gunicorn ignores this in production
    app.run(debug=os.environ.get("FLASK_ENV") != "production")
