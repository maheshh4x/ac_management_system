from flask import Blueprint, jsonify
from app.config.database import get_db_connection

rooms_bp = Blueprint("rooms", __name__)


@rooms_bp.route("/api/rooms", methods=["GET"])
def get_rooms():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                r.room_id,
                r.floor_id,
                f.floor_name,
                f.floor_number,
                b.block_id,
                b.block_name,
                r.department_id,
                d.department_name,
                r.room_name,
                r.room_type,
                r.created_at,
                r.updated_at
            FROM rooms r
            LEFT JOIN floors f
                ON r.floor_id = f.floor_id
            LEFT JOIN blocks b
                ON f.block_id = b.block_id
            LEFT JOIN departments d
                ON r.department_id = d.department_id
            ORDER BY b.block_name, f.floor_number, r.room_name;
        """)

        rows = cursor.fetchall()

        rooms = []

        for row in rows:
            rooms.append({
                "room_id": row[0],
                "floor_id": row[1],
                "floor_name": row[2],
                "floor_number": row[3],
                "block_id": row[4],
                "block_name": row[5],
                "department_id": row[6],
                "department_name": row[7],
                "room_name": row[8],
                "room_type": row[9],
                "created_at": row[10].isoformat() if row[10] else None,
                "updated_at": row[11].isoformat() if row[11] else None
            })

        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "count": len(rooms),
            "data": rooms
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
