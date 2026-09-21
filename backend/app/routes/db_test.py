from flask import Blueprint, jsonify
from app.config.database import get_db_connection

db_test_bp = Blueprint("db_test", __name__)


@db_test_bp.route("/api/db-test")
def db_test():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("SELECT current_database(), current_user;")
        result = cursor.fetchone()

        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "database": result[0],
            "user": result[1]
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
