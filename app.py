"""CareerLink / PIMS backend entry point."""
import os
from dotenv import load_dotenv
load_dotenv()

from flask import Flask, render_template, send_from_directory
from flask_cors import CORS

from extensions import db
from auth import auth_bp
from routes_student import student_bp
from routes_admin import admin_bp

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads", "resumes")


def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
        "DATABASE_URL") or f"sqlite:///{os.path.join(BASE_DIR, 'pims.db')}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # 5 MB uploads

    db.init_app(app)
    CORS(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(admin_bp)

    @app.get("/")
    def home():
        return render_template("index.html")

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    @app.get("/uploads/resumes/<path:filename>")
    def resume_file(filename):
        return send_from_directory(UPLOAD_DIR, filename)

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    with app.app_context():
        db.create_all()
        from seed import seed_if_empty
        seed_if_empty()

    # ---- OS CONCEPT: start Producer–Consumer worker threads ----
    from os_concepts import init_notification_queue
    from models import Notification
    q = init_notification_queue(db, Notification, size=200, workers=2)
    q.start(app)

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)