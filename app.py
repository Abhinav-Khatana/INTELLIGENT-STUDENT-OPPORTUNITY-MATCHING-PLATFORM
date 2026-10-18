"""
CareerLink / PIMS backend — entry point.

Run locally:
    pip install -r requirements.txt
    python app.py

Serves the API at http://localhost:5000/api/...
See README.md for the full endpoint list and demo accounts.
"""
import os

from flask import Flask
from flask_cors import CORS

from extensions import db
from auth import auth_bp
from routes_student import student_bp
from routes_admin import admin_bp
from routes_os import os_bp


def create_app():
    app = Flask(__name__)

    # Default: a local SQLite file, zero setup needed.
    # To use MySQL instead (matching the MySQL 8.4 reference in the proposal),
    # set DATABASE_URL, e.g.:
    #   mysql+pymysql://user:password@localhost/pims
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///pims.db")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-change-me-in-production")

    db.init_app(app)
    CORS(app)  # lets the frontend HTML file (opened from anywhere) call this API

    app.register_blueprint(auth_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(os_bp)

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    with app.app_context():
        db.create_all()
        from seed import seed_if_empty
        seed_if_empty()

    return app


app = create_app()

# ---- Notification consumer worker (producer/consumer pattern) ----
from os_concepts.notification_queue import notification_queue

def _notification_worker(item):
    from extensions import db
    from models import Notification
    with app.app_context():
        try:
            db.session.add(Notification(**item))
            db.session.commit()
        except Exception:
            db.session.rollback()

notification_queue.start(_notification_worker)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
