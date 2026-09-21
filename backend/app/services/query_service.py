from app.config.database import get_db_connection


def execute_query(query, params=None):
    conn = get_db_connection()

    try:
        cursor = conn.cursor()
        cursor.execute(query, params or [])

        columns = [desc[0] for desc in cursor.description]
        rows = cursor.fetchall()

        data = [
            dict(zip(columns, row))
            for row in rows
        ]

        cursor.close()

        return data

    finally:
        conn.close()


def total_acs():
    result = execute_query(
        "SELECT COUNT(*) AS total FROM acs"
    )
    return result[0]["total"]


def ac_status(status):
    return execute_query(
        """
        SELECT
            ac_id,
            ac_make_company,
            ac_model_number,
            ac_serial_number,
            current_status,
            ac_capacity_ton,
            ac_type
        FROM acs
        WHERE LOWER(current_status) = LOWER(%s)
        ORDER BY ac_id
        """,
        [status]
    )


def ac_by_company(company):
    return execute_query(
        """
        SELECT
            ac_id,
            ac_make_company,
            ac_model_number,
            ac_serial_number,
            current_status,
            ac_capacity_ton,
            ac_type
        FROM acs
        WHERE LOWER(ac_make_company) = LOWER(%s)
        ORDER BY ac_id
        """,
        [company]
    )


def ac_details(ac_id):
    return execute_query(
        """
        SELECT
            a.ac_id,
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
            r.room_name,
            r.room_type,
            d.department_name,
            f.floor_name,
            b.block_name
        FROM acs a
        LEFT JOIN rooms r ON a.room_id = r.room_id
        LEFT JOIN departments d ON r.department_id = d.department_id
        LEFT JOIN floors f ON r.floor_id = f.floor_id
        LEFT JOIN blocks b ON f.block_id = b.block_id
        WHERE a.ac_id = %s
        """,
        [ac_id]
    )


def maintenance_for_ac(ac_id):
    return execute_query(
        """
        SELECT
            m.maintenance_id,
            m.ac_id,
            m.maintenance_type,
            m.maintenance_date,
            m.remarks
        FROM maintenance m
        WHERE m.ac_id = %s
        ORDER BY m.maintenance_date DESC
        """,
        [ac_id]
    )


def maintenance_count():
    result = execute_query(
        "SELECT COUNT(*) AS total FROM maintenance"
    )
    return result[0]["total"]


def maintenance_list():
    return execute_query(
        """
        SELECT
            m.maintenance_id,
            m.ac_id,
            m.maintenance_type,
            m.maintenance_date,
            m.remarks
        FROM maintenance m
        ORDER BY m.maintenance_date DESC
        """
    )


def ac_list():
    return execute_query(
        """
        SELECT
            ac_id,
            ac_make_company,
            ac_model_number,
            current_status,
            ac_capacity_ton,
            ac_type
        FROM acs
        ORDER BY ac_id
        """
    )
