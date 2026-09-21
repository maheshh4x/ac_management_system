from flask import Flask
from flask_cors import CORS

from app.routes.db_test import db_test_bp
from app.routes.colleges import colleges_bp
from app.routes.blocks import blocks_bp
from app.routes.floors import floors_bp
from app.routes.departments import departments_bp
from app.routes.rooms import rooms_bp
from app.routes.acs import acs_bp
from app.routes.maintenance import maintenance_bp
from app.routes.dashboard import dashboard_bp
from app.routes.chat import chat_bp


def create_app():
    app = Flask(__name__)

    CORS(app)

    @app.route("/")
    def home():
        return {
            "status": "success",
            "message": "AC Management System API is running"
        }

    @app.route("/api/health")
    def health():
        return {
            "status": "healthy",
            "service": "ACMS Backend"
        }

    app.register_blueprint(db_test_bp)
    app.register_blueprint(colleges_bp)
    app.register_blueprint(blocks_bp)
    app.register_blueprint(floors_bp)
    app.register_blueprint(departments_bp)
    app.register_blueprint(rooms_bp)
    app.register_blueprint(acs_bp)
    app.register_blueprint(maintenance_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(chat_bp)

    return app
