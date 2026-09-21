from flask import Blueprint, jsonify
from app.config.database import get_db_connection

floors_bp = Blueprint("floors", __name__)


@floors_bp.route("/api/floors", methods=["GET"])
def get_floors():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                f.floor_id,
                f.block_id,
                b.block_name,
                f.floor_name,
                f.floor_number,
                f.created_at,
                f.updated_at
            FROM floors f
            LEFT JOIN blocks b
                ON f.block_id = b.block_id
            ORDER BY f.block_id, f.floor_number;
        """)

        rows = cursor.fetchall()

        floors = []

        for row in rows:
            floors.append({
                "floor_id": row[0],
                "block_id": row[1],
                "block_name": row[2],
                "floor_name": row[3],
                "floor_number": row[4],
                "created_at": row[5].isoformat() if row[5] else None,
                "updated_at": row[6].isoformat() if row[6] else None
            })

        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "count": len(floors),
            "data": floors
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
