from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.exc import IntegrityError
from models import db, User
from utils.auth_utils import generate_token, admin_required

auth = Blueprint("auth", __name__)

ALLOWED_SELF_REGISTER_ROLES = {"student", "client"}


@auth.route("/register", methods=["POST"])
def register():
    data = request.json

    # Input validation
    if not data or not data.get("email") or not data.get("password") or not data.get("name"):
        return jsonify({"message": "Name, email, and password are required"}), 400

    # Role whitelist — prevent self-registration as admin
    role = data.get("role", "student")
    if role not in ALLOWED_SELF_REGISTER_ROLES:
        return jsonify({"message": "Invalid role. Must be 'student' or 'client'"}), 400

    hashed = generate_password_hash(data["password"])
    user = User(
        name=data["name"],
        email=data["email"].lower().strip(),
        password=hashed,
        role=role
    )

    try:
        db.session.add(user)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"message": "An account with this email already exists"}), 409

    return jsonify({"message": "Account created successfully"}), 201


@auth.route("/login", methods=["POST"])
def login():
    data = request.json

    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"message": "Email and password are required"}), 400

    user = User.query.filter_by(email=data["email"].lower().strip()).first()

    if not user or not check_password_hash(user.password, data["password"]):
        return jsonify({"message": "Invalid email or password"}), 401

    token = generate_token(user)
    return jsonify({"token": token, "role": user.role, "name": user.name})


@auth.route("/students", methods=["GET"])
@admin_required
def get_students():
    students = User.query.filter_by(role='student').all()
    return jsonify([{"id": s.id, "name": s.name} for s in students])
