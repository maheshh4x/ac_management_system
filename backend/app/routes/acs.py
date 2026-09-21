from flask import Blueprint, jsonify, request
from app.config.database import get_db_connection

acs_bp = Blueprint("acs", __name__)


@acs_bp.route("/api/acs", methods=["GET"])
def get_acs():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                a.ac_id,
                a.room_id,
                r.room_name,
                r.room_type,
                f.floor_id,
                f.floor_name,
                f.floor_number,
                b.block_id,
                b.block_name,
                d.department_id,
                d.department_name,
                a.ac_make_company,
                a.ac_model_number,
                a.ac_serial_number,
                a.ac_capacity_ton,
                a.ac_type,
                a.manufacturing_year,
                a.installation_year,
                a.current_status,
                a.ac_star_rating,
                a.power_rating_kw,
                a.power_factor,
                a.created_at,
                a.updated_at
            FROM acs a
            LEFT JOIN rooms r ON a.room_id = r.room_id
            LEFT JOIN floors f ON r.floor_id = f.floor_id
            LEFT JOIN blocks b ON f.block_id = b.block_id
            LEFT JOIN departments d ON r.department_id = d.department_id
            ORDER BY a.ac_id;
        """)

        rows = cursor.fetchall()

        acs = []

        for row in rows:
            acs.append({
                "ac_id": row[0],
                "room_id": row[1],
                "room_name": row[2],
                "room_type": row[3],
                "floor_id": row[4],
                "floor_name": row[5],
                "floor_number": row[6],
                "block_id": row[7],
                "block_name": row[8],
                "department_id": row[9],
                "department_name": row[10],
                "ac_make_company": row[11],
                "ac_model_number": row[12],
                "ac_serial_number": row[13],
                "ac_capacity_ton": float(row[14]) if row[14] is not None else None,
                "ac_type": row[15],
                "manufacturing_year": row[16],
                "installation_year": row[17],
                "current_status": row[18],
                "ac_star_rating": row[19],
                "power_rating_kw": float(row[20]) if row[20] is not None else None,
                "power_factor": float(row[21]) if row[21] is not None else None,
                "created_at": row[22].isoformat() if row[22] else None,
                "updated_at": row[23].isoformat() if row[23] else None
            })

        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "count": len(acs),
            "data": acs
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@acs_bp.route("/api/acs/<string:ac_id>", methods=["GET"])
def get_ac(ac_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                a.ac_id,
                a.room_id,
                r.room_name,
                a.ac_make_company,
                a.ac_model_number,
                a.ac_serial_number,
                a.ac_capacity_ton,
                a.ac_type,
                a.manufacturing_year,
                a.installation_year,
                a.current_status,
                a.ac_star_rating,
                a.power_rating_kw,
                a.power_factor,
                a.created_at,
                a.updated_at
            FROM acs a
            LEFT JOIN rooms r ON a.room_id = r.room_id
            WHERE a.ac_id = %s;
        """, (ac_id,))

        row = cursor.fetchone()

        cursor.close()
        conn.close()

        if not row:
            return jsonify({
                "status": "error",
                "message": "AC not found"
            }), 404

        return jsonify({
            "status": "success",
            "data": {
                "ac_id": row[0],
                "room_id": row[1],
                "room_name": row[2],
                "ac_make_company": row[3],
                "ac_model_number": row[4],
                "ac_serial_number": row[5],
                "ac_capacity_ton": float(row[6]) if row[6] is not None else None,
                "ac_type": row[7],
                "manufacturing_year": row[8],
                "installation_year": row[9],
                "current_status": row[10],
                "ac_star_rating": row[11],
                "power_rating_kw": float(row[12]) if row[12] is not None else None,
                "power_factor": float(row[13]) if row[13] is not None else None,
                "created_at": row[14].isoformat() if row[14] else None,
                "updated_at": row[15].isoformat() if row[15] else None
            }
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@acs_bp.route("/api/acs", methods=["POST"])
def create_ac():
    data = request.get_json()

    required_fields = [
        "ac_id",
        "ac_make_company",
        "ac_model_number",
        "ac_serial_number",
        "ac_capacity_ton",
        "ac_type",
        "manufacturing_year",
        "installation_year",
        "current_status",
        "ac_star_rating",
        "power_rating_kw",
        "power_factor"
    ]

    missing = [
        field for field in required_fields
        if field not in data
    ]

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
            INSERT INTO acs (
                ac_id,
                room_id,
                ac_make_company,
                ac_model_number,
                ac_serial_number,
                ac_capacity_ton,
                ac_type,
                manufacturing_year,
                installation_year,
                current_status,
                ac_star_rating,
                power_rating_kw,
                power_factor
            )
            VALUES (
                %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s
            )
            RETURNING ac_id;
        """, (
            data["ac_id"],
            data.get("room_id"),
            data["ac_make_company"],
            data["ac_model_number"],
            data["ac_serial_number"],
            data["ac_capacity_ton"],
            data["ac_type"],
            data["manufacturing_year"],
            data["installation_year"],
            data["current_status"],
            data["ac_star_rating"],
            data["power_rating_kw"],
            data["power_factor"]
        ))

        new_id = cursor.fetchone()[0]

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "message": "AC created successfully",
            "ac_id": new_id
        }), 201

    except Exception as e:
        if "conn" in locals():
            conn.rollback()
            conn.close()

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400


@acs_bp.route("/api/acs/<string:ac_id>", methods=["PUT"])
def update_ac(ac_id):
    data = request.get_json()

    allowed_fields = [
        "room_id",
        "ac_make_company",
        "ac_model_number",
        "ac_serial_number",
        "ac_capacity_ton",
        "ac_type",
        "manufacturing_year",
        "installation_year",
        "current_status",
        "ac_star_rating",
        "power_rating_kw",
        "power_factor"
    ]

    fields = []
    values = []

    for field in allowed_fields:
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

        values.append(ac_id)

        query = f"""
            UPDATE acs
            SET {", ".join(fields)}
            WHERE ac_id = %s
            RETURNING ac_id;
        """

        cursor.execute(query, tuple(values))

        updated = cursor.fetchone()

        if not updated:
            conn.rollback()
            cursor.close()
            conn.close()

            return jsonify({
                "status": "error",
                "message": "AC not found"
            }), 404

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "message": "AC updated successfully",
            "ac_id": updated[0]
        })

    except Exception as e:
        if "conn" in locals():
            conn.rollback()
            conn.close()

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400


@acs_bp.route("/api/acs/<string:ac_id>", methods=["DELETE"])
def delete_ac(ac_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            DELETE FROM acs
            WHERE ac_id = %s
            RETURNING ac_id;
        """, (ac_id,))

        deleted = cursor.fetchone()

        if not deleted:
            conn.rollback()
            cursor.close()
            conn.close()

            return jsonify({
                "status": "error",
                "message": "AC not found"
            }), 404

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "message": "AC deleted successfully",
            "ac_id": deleted[0]
        })

    except Exception as e:
        if "conn" in locals():
            conn.rollback()
            conn.close()

        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400
