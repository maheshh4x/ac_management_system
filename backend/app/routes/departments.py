from flask import Blueprint, jsonify
from app.config.database import get_db_connection

departments_bp = Blueprint("departments", __name__)


@departments_bp.route("/api/departments", methods=["GET"])
def get_departments():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                department_id,
                department_name,
                created_at,
                updated_at
            FROM departments
            ORDER BY department_name;
        """)

        rows = cursor.fetchall()

        departments = []

        for row in rows:
            departments.append({
                "department_id": row[0],
                "department_name": row[1],
                "created_at": row[2].isoformat() if row[2] else None,
                "updated_at": row[3].isoformat() if row[3] else None
            })

        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "count": len(departments),
            "data": departments
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
