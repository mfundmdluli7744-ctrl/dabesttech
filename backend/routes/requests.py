from flask import Blueprint, request as flask_request, jsonify
from models import db, ClientRequest, Invoice, User
from utils.auth_utils import token_required, client_required, admin_required

requests_bp = Blueprint("requests_bp", __name__)

@requests_bp.route("/", methods=["GET"])
@token_required
def get_requests():
    role = flask_request.user.get('role')
    user_id = flask_request.user.get('id')

    if role == 'admin':
        reqs = ClientRequest.query.all()
    elif role == 'client':
        reqs = ClientRequest.query.filter_by(client_id=user_id).all()
    elif role == 'student':
        reqs = ClientRequest.query.filter_by(assigned_student_id=user_id).all()
    else:
        return jsonify({"message": "Unauthorized"}), 403

    result = []
    for r in reqs:
        client = User.query.get(r.client_id)
        student = User.query.get(r.assigned_student_id) if r.assigned_student_id else None
        has_invoice = Invoice.query.filter_by(request_id=r.id).first() is not None

        result.append({
            "id": r.id,
            "title": r.title,
            "description": r.description,
            "budget": r.budget,
            "status": r.status,
            "client_name": r.client_name if r.client_name else (client.name if client else "Unknown"),
            "client_email": r.client_email if r.client_email else (client.email if client else "N/A"),
            "student_name": student.name if student else "Unassigned",
            "has_invoice": has_invoice
        })
    return jsonify(result)


@requests_bp.route("/submit", methods=["POST"])
def submit_request():
    user = getattr(flask_request, 'user', None)
    client_id = user.get('id') if user else None
    data = flask_request.json

    if not data or not data.get("title") or not data.get("description"):
        return jsonify({"message": "Title and description are required"}), 400

    if not client_id and (not data.get("client_name") or not data.get("client_email")):
        return jsonify({"message": "Contact name and email are required for anonymous requests"}), 400

    new_req = ClientRequest(
        title=data.get("title"),
        description=data.get("description"),
        budget=data.get("budget", 0),
        client_id=client_id,
        client_name=data.get("client_name") if not client_id else None,
        client_email=data.get("client_email") if not client_id else None
    )

    db.session.add(new_req)
    db.session.commit()
    return jsonify({"message": "Request submitted successfully!"}), 201


@requests_bp.route("/<int:req_id>/assign", methods=["POST"])
@admin_required
def assign_request(req_id):
    data = flask_request.json
    student_id = data.get("student_id")

    req_obj = ClientRequest.query.get_or_404(req_id)
    student = User.query.get(student_id)

    if not student or student.role != 'student':
        return jsonify({"message": "Invalid student ID"}), 400

    req_obj.assigned_student_id = student_id
    req_obj.status = 'Assigned'
    db.session.commit()
    return jsonify({"message": "Request assigned successfully!"})


@requests_bp.route("/<int:req_id>/complete", methods=["POST"])
@token_required
def complete_request(req_id):
    user_id = flask_request.user.get('id')
    role = flask_request.user.get('role')

    req_obj = ClientRequest.query.get_or_404(req_id)

    # Only the assigned student or admin can complete it
    if role != 'admin' and req_obj.assigned_student_id != user_id:
        return jsonify({"message": "Unauthorized"}), 403

    req_obj.status = 'Completed'
    db.session.commit()
    return jsonify({"message": "Request marked as completed!"})
