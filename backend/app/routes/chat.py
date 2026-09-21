from flask import Blueprint, jsonify, request

from app.services.question_parser import detect_intent
from app.services import query_service


chat_bp = Blueprint("chat", __name__, url_prefix="/api")


@chat_bp.route("/chat", methods=["POST"])
def chat():

    body = request.get_json(silent=True) or {}
    question = body.get("question", "").strip()

    if not question:
        return jsonify({
            "status": "error",
            "message": "Question is required"
        }), 400

    try:
        recognition = detect_intent(question)
        intent = recognition["intent"]

        if intent == "TOTAL_ACS":
            total = query_service.total_acs()

            return jsonify({
                "status": "success",
                "question": question,
                "intent": intent,
                "answer": f"There are {total} ACs in the system.",
                "data": {"total": total}
            })

        if intent == "AC_STATUS":
            data = query_service.ac_status(
                recognition["status"]
            )

            return jsonify({
                "status": "success",
                "question": question,
                "intent": intent,
                "answer": (
                    f"Found {len(data)} AC(s) with status "
                    f"{recognition['status']}."
                ),
                "data": data
            })

        if intent == "AC_BY_COMPANY":
            data = query_service.ac_by_company(
                recognition["company"]
            )

            return jsonify({
                "status": "success",
                "question": question,
                "intent": intent,
                "answer": (
                    f"Found {len(data)} AC(s) from "
                    f"{recognition['company']}."
                ),
                "data": data
            })

        if intent == "AC_DETAILS":
            data = query_service.ac_details(
                recognition["ac_id"]
            )

            if not data:
                return jsonify({
                    "status": "success",
                    "question": question,
                    "intent": intent,
                    "answer": (
                        f"No AC found with ID "
                        f"{recognition['ac_id']}."
                    ),
                    "data": []
                })

            return jsonify({
                "status": "success",
                "question": question,
                "intent": intent,
                "answer": (
                    f"Here are the details for "
                    f"{recognition['ac_id']}."
                ),
                "data": data
            })

        if intent == "AC_MAINTENANCE":
            data = query_service.maintenance_for_ac(
                recognition["ac_id"]
            )

            return jsonify({
                "status": "success",
                "question": question,
                "intent": intent,
                "answer": (
                    f"Found {len(data)} maintenance "
                    f"record(s) for {recognition['ac_id']}."
                ),
                "data": data
            })

        if intent == "MAINTENANCE_COUNT":
            total = query_service.maintenance_count()

            return jsonify({
                "status": "success",
                "question": question,
                "intent": intent,
                "answer": (
                    f"There are {total} maintenance "
                    "records in the system."
                ),
                "data": {"total": total}
            })

        if intent == "MAINTENANCE_LIST":
            data = query_service.maintenance_list()

            return jsonify({
                "status": "success",
                "question": question,
                "intent": intent,
                "answer": f"Found {len(data)} maintenance record(s).",
                "data": data
            })

        if intent == "AC_LIST":
            data = query_service.ac_list()

            return jsonify({
                "status": "success",
                "question": question,
                "intent": intent,
                "answer": f"Found {len(data)} AC(s).",
                "data": data
            })

        return jsonify({
            "status": "success",
            "question": question,
            "intent": "UNKNOWN",
            "answer": (
                "I could not understand that question yet. "
                "Try asking about ACs, status, companies, "
                "or maintenance."
            ),
            "data": []
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
