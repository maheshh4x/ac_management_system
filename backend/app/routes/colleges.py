from flask import Blueprint, jsonify
from app.config.database import get_db_connection

colleges_bp = Blueprint("colleges", __name__)


@colleges_bp.route("/api/colleges", methods=["GET"])
def get_colleges():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                college_id,
                college_name,
                created_at,
                updated_at
            FROM colleges
            ORDER BY college_name;
        """)

        rows = cursor.fetchall()

        colleges = []

        for row in rows:
            colleges.append({
                "college_id": row[0],
                "college_name": row[1],
                "created_at": row[2].isoformat() if row[2] else None,
                "updated_at": row[3].isoformat() if row[3] else None
            })

        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "count": len(colleges),
            "data": colleges
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
