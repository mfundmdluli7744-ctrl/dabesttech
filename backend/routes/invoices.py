from flask import Blueprint, request as flask_request, jsonify, send_file
from models import db, Invoice, ClientRequest, User
from utils.auth_utils import token_required, admin_required
import os
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

invoices_bp = Blueprint("invoices_bp", __name__)
INVOICE_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'invoices')
os.makedirs(INVOICE_FOLDER, exist_ok=True)


@invoices_bp.route("/", methods=["GET"])
@token_required
def get_invoices():
    role = flask_request.user.get('role')
    user_id = flask_request.user.get('id')

    if role == 'admin':
        invs = Invoice.query.all()
    elif role == 'client':
        client_requests = ClientRequest.query.filter_by(client_id=user_id).all()
        req_ids = [r.id for r in client_requests]
        invs = Invoice.query.filter(Invoice.request_id.in_(req_ids)).all()
    else:
        return jsonify({"message": "Unauthorized"}), 403

    result = []
    for inv in invs:
        req_obj = ClientRequest.query.get(inv.request_id)
        result.append({
            "id": inv.id,
            "request_title": req_obj.title if req_obj else "Unknown",
            "amount": inv.amount,
            "status": inv.status,
        })
    return jsonify(result)


@invoices_bp.route("/generate/<int:req_id>", methods=["POST"])
@admin_required
def generate_invoice(req_id):
    req_obj = ClientRequest.query.get_or_404(req_id)

    if req_obj.status != 'Completed':
        return jsonify({"message": "Cannot generate invoice for an incomplete request"}), 400

    # Prevent duplicate invoices
    existing = Invoice.query.filter_by(request_id=req_id).first()
    if existing:
        return jsonify({"message": "An invoice already exists for this request"}), 409

    client = User.query.get(req_obj.client_id)
    amount = req_obj.budget or 0.0

    # Store relative filename only — not absolute path
    filename = f"invoice_{req_id}.pdf"
    abs_path = os.path.join(INVOICE_FOLDER, filename)

    c = canvas.Canvas(abs_path, pagesize=letter)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(100, 750, "DABEST TECH HUB")
    c.setFont("Helvetica", 14)
    c.drawString(100, 725, "Invoice")
    c.line(100, 715, 500, 715)
    c.setFont("Helvetica", 11)
    c.drawString(100, 695, f"Invoice #:    INV-{req_id:04d}")
    c.drawString(100, 675, f"Client:       {client.name if client else 'Unknown'}")
    c.drawString(100, 655, f"Project:      {req_obj.title}")
    c.drawString(100, 635, f"Description:  {req_obj.description[:80]}")
    c.line(100, 615, 500, 615)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(100, 595, f"Amount Due:   ${amount:.2f}")
    c.setFont("Helvetica", 9)
    c.drawString(100, 100, "Thank you for choosing DABEST Tech Hub.")
    c.save()

    new_inv = Invoice(
        request_id=req_id,
        amount=amount,
        file_path=filename  # relative filename only
    )
    db.session.add(new_inv)
    db.session.commit()

    return jsonify({"message": "Invoice generated", "invoice_id": new_inv.id}), 201


@invoices_bp.route("/download/<int:inv_id>", methods=["GET"])
@token_required
def download_invoice(inv_id):
    role = flask_request.user.get('role')
    user_id = flask_request.user.get('id')

    inv = Invoice.query.get_or_404(inv_id)

    # Ownership check: admin can download any; client can only download their own
    if role == 'client':
        req_obj = ClientRequest.query.get(inv.request_id)
        if not req_obj or req_obj.client_id != user_id:
            return jsonify({"message": "Access denied"}), 403
    elif role not in ('admin', 'client'):
        return jsonify({"message": "Access denied"}), 403

    abs_path = os.path.join(INVOICE_FOLDER, inv.file_path)
    if not os.path.exists(abs_path):
        return jsonify({"message": "Invoice file not found on server"}), 404

    return send_file(abs_path, as_attachment=True, download_name=inv.file_path)
