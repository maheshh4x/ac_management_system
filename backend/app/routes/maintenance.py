from flask import Blueprint, jsonify, request
from app.config.database import get_db_connection

maintenance_bp = Blueprint("maintenance", __name__)


@maintenance_bp.route("/api/maintenance", methods=["GET"])
def get_maintenance():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                m.maintenance_id,
                m.ac_id,
                a.ac_make_company,
                a.ac_model_number,
                a.ac_serial_number,
                a.current_status,
                r.room_name,
                m.maintenance_type,
                m.maintenance_date,
                m.remarks,
                m.created_at
            FROM maintenance m
            LEFT JOIN acs a ON m.ac_id = a.ac_id
            LEFT JOIN rooms r ON a.room_id = r.room_id
            ORDER BY m.maintenance_date DESC, m.created_at DESC;
        """)

        rows = cursor.fetchall()

        data = []

        for row in rows:
            data.append({
                "maintenance_id": row[0],
                "ac_id": row[1],
                "ac_make_company": row[2],
                "ac_model_number": row[3],
                "ac_serial_number": row[4],
                "current_status": row[5],
                "room_name": row[6],
                "maintenance_type": row[7],
                "maintenance_date": row[8].isoformat() if row[8] else None,
                "remarks": row[9],
                "created_at": row[10].isoformat() if row[10] else None
            })

        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "count": len(data),
            "data": data
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@maintenance_bp.route("/api/maintenance/<int:maintenance_id>", methods=["GET"])
def get_maintenance_record(maintenance_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                maintenance_id,
                ac_id,
                maintenance_type,
                maintenance_date,
                remarks,
                created_at
            FROM maintenance
            WHERE maintenance_id = %s;
        """, (maintenance_id,))

        row = cursor.fetchone()

        cursor.close()
        conn.close()

        if not row:
            return jsonify({
                "status": "error",
                "message": "Maintenance record not found"
            }), 404

        return jsonify({
            "status": "success",
            "data": {
                "maintenance_id": row[0],
                "ac_id": row[1],
                "maintenance_type": row[2],
                "maintenance_date": row[3].isoformat() if row[3] else None,
                "remarks": row[4],
                "created_at": row[5].isoformat() if row[5] else None
            }
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@maintenance_bp.route("/api/maintenance", methods=["POST"])
def create_maintenance():
    data = request.get_json() or {}

    required = [
        "ac_id",
        "maintenance_type",
        "maintenance_date"
    ]

    missing = [field for field in required if field not in data]

    if missing:
        return jsonify({
            "status": "error",
            "message": "Missing required fields",
            "fields": missing
        }), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO maintenance (
                ac_id,
                maintenance_type,
                maintenance_date,
                remarks
            )
            VALUES (%s, %s, %s, %s)
            RETURNING maintenance_id;
        """, (
            data["ac_id"],
            data["maintenance_type"],
            data["maintenance_date"],
            data.get("remarks")
        ))

        maintenance_id = cursor.fetchone()[0]

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "message": "Maintenance record created successfully",
            "maintenance_id": maintenance_id
        }), 201

    except Exception as e:
        if "conn" in locals():
            conn.rollback()
            conn.close()

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400


@maintenance_bp.route("/api/maintenance/<int:maintenance_id>", methods=["PUT"])
def update_maintenance(maintenance_id):
    data = request.get_json() or {}

    allowed = [
        "ac_id",
        "maintenance_type",
        "maintenance_date",
        "remarks"
    ]

    fields = []
    values = []

    for field in allowed:
        if field in data:
            fields.append(f"{field} = %s")
            values.append(data[field])

    if not fields:
        return jsonify({
            "status": "error",
            "message": "No fields provided for update"
        }), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        values.append(maintenance_id)

        cursor.execute(
            f"""
            UPDATE maintenance
            SET {", ".join(fields)}
            WHERE maintenance_id = %s
            RETURNING maintenance_id;
            """,
            tuple(values)
        )

        result = cursor.fetchone()

        if not result:
            conn.rollback()
            cursor.close()
            conn.close()

            return jsonify({
                "status": "error",
                "message": "Maintenance record not found"
            }), 404

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "message": "Maintenance record updated successfully",
            "maintenance_id": result[0]
        })

    except Exception as e:
        if "conn" in locals():
            conn.rollback()
            conn.close()

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400


@maintenance_bp.route("/api/maintenance/<int:maintenance_id>", methods=["DELETE"])
def delete_maintenance(maintenance_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            DELETE FROM maintenance
            WHERE maintenance_id = %s
            RETURNING maintenance_id;
        """, (maintenance_id,))

        result = cursor.fetchone()

        if not result:
            conn.rollback()
            cursor.close()
            conn.close()

            return jsonify({
                "status": "error",
                "message": "Maintenance record not found"
            }), 404

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "message": "Maintenance record deleted successfully",
            "maintenance_id": result[0]
        })

    except Exception as e:
        if "conn" in locals():
            conn.rollback()
            conn.close()

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400
