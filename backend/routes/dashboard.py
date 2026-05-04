from flask import Blueprint, jsonify
from models import db, User, Project, ClientRequest, Invoice
from utils.auth_utils import token_required, admin_required, student_required, client_required

dashboard = Blueprint("dashboard", __name__)

@dashboard.route("/admin/stats", methods=["GET"])
@admin_required
def admin_stats():
    users_count = User.query.count()
    projects_count = Project.query.count()
    requests_count = ClientRequest.query.count()
    
    # Calculate total revenue from paid invoices
    paid_invoices = Invoice.query.filter_by(status='Paid').all()
    total_revenue = sum(invoice.amount for invoice in paid_invoices)

    return jsonify({
        "users": users_count,
        "projects": projects_count,
        "requests": requests_count,
        "revenue": total_revenue
    })

@dashboard.route("/student/stats", methods=["GET"])
@student_required
def student_stats():
    from flask import request
    student_id = request.user.get('id')
    
    projects_count = Project.query.filter_by(student_id=student_id).count()
    jobs_assigned = ClientRequest.query.filter_by(assigned_student_id=student_id).count()
    
    # Calculate earnings from paid invoices where the request was assigned to this student
    # Note: A real system might split revenue, but for now we'll assume the student gets the full amount or we just show the total value of their assigned jobs.
    completed_requests = ClientRequest.query.filter_by(assigned_student_id=student_id, status='Completed').all()
    earnings = 0
    for req in completed_requests:
        for inv in req.invoices:
            if inv.status == 'Paid':
                earnings += inv.amount

    return jsonify({
        "projects": projects_count,
        "jobs_assigned": jobs_assigned,
        "earnings": earnings
    })

@dashboard.route("/client/stats", methods=["GET"])
@client_required
def client_stats():
    from flask import request
    client_id = request.user.get('id')
    
    requests_count = ClientRequest.query.filter_by(client_id=client_id).count()
    pending_requests = ClientRequest.query.filter_by(client_id=client_id, status='Pending').count()
    completed_requests = ClientRequest.query.filter_by(client_id=client_id, status='Completed').count()

    return jsonify({
        "total_requests": requests_count,
        "pending_requests": pending_requests,
        "completed_requests": completed_requests
    })
