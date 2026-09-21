from flask import Blueprint, jsonify
from app.config.database import get_db_connection

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/api/dashboard", methods=["GET"])
def dashboard():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                (SELECT COUNT(*) FROM colleges),
                (SELECT COUNT(*) FROM blocks),
                (SELECT COUNT(*) FROM floors),
                (SELECT COUNT(*) FROM departments),
                (SELECT COUNT(*) FROM rooms),
                (SELECT COUNT(*) FROM acs),
                (SELECT COUNT(*) FROM maintenance),

                (SELECT COUNT(*)
                 FROM acs
                 WHERE LOWER(current_status) = 'working'),

                (SELECT COUNT(*)
                 FROM acs
                 WHERE LOWER(current_status) = 'under maintenance'),

                (SELECT COUNT(*)
                 FROM acs
                 WHERE LOWER(current_status) IN
                    ('not working', 'inactive', 'damaged'))
        """)

        row = cursor.fetchone()

        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "data": {
                "total_colleges": row[0],
                "total_blocks": row[1],
                "total_floors": row[2],
                "total_departments": row[3],
                "total_rooms": row[4],
                "total_acs": row[5],
                "total_maintenance_records": row[6],
                "working_acs": row[7],
                "under_maintenance": row[8],
                "not_working": row[9]
            }
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@dashboard_bp.route("/api/dashboard/ac-status", methods=["GET"])
def ac_status():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                COALESCE(current_status, 'Unknown') AS status,
                COUNT(*) AS count
            FROM acs
            GROUP BY current_status
            ORDER BY count DESC;
        """)

        rows = cursor.fetchall()

        data = [
            {
                "status": row[0],
                "count": row[1]
            }
            for row in rows
        ]

        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "data": data
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@dashboard_bp.route("/api/dashboard/ac-by-company", methods=["GET"])
def ac_by_company():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                ac_make_company,
                COUNT(*) AS count
            FROM acs
            GROUP BY ac_make_company
            ORDER BY count DESC;
        """)

        rows = cursor.fetchall()

        data = [
            {
                "company": row[0],
                "count": row[1]
            }
            for row in rows
        ]

        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "data": data
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


@dashboard_bp.route("/api/dashboard/maintenance-summary", methods=["GET"])
def maintenance_summary():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                maintenance_type,
                COUNT(*) AS count
            FROM maintenance
            GROUP BY maintenance_type
            ORDER BY count DESC;
        """)

        rows = cursor.fetchall()

        data = [
            {
                "maintenance_type": row[0],
                "count": row[1]
            }
            for row in rows
        ]

        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "data": data
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
