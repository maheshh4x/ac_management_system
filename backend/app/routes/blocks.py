from flask import Blueprint, jsonify
from app.config.database import get_db_connection

blocks_bp = Blueprint("blocks", __name__)


@blocks_bp.route("/api/blocks", methods=["GET"])
def get_blocks():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                b.block_id,
                b.college_id,
                c.college_name,
                b.block_name,
                b.created_at,
                b.updated_at
            FROM blocks b
            LEFT JOIN colleges c
                ON b.college_id = c.college_id
            ORDER BY b.block_name;
        """)

        rows = cursor.fetchall()

        blocks = []

        for row in rows:
            blocks.append({
                "block_id": row[0],
                "college_id": row[1],
                "college_name": row[2],
                "block_name": row[3],
                "created_at": row[4].isoformat() if row[4] else None,
                "updated_at": row[5].isoformat() if row[5] else None
            })

        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "count": len(blocks),
            "data": blocks
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
