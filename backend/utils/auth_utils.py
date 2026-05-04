import jwt
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify
from config import Config

def generate_token(user):
    payload = {
        "id": user.id,
        "role": user.role,
        "exp": datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm="HS256")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"message": "Token missing"}), 401
        try:
            token = token.split(" ")[1] # Bearer <token>
            data = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
            request.user = data
        except Exception as e:
            print("Token decode error:", e)
            return jsonify({"message": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if request.user.get('role') != 'admin':
            return jsonify({"message": "Admin access required"}), 403
        return f(*args, **kwargs)
    return decorated

def student_required(f):
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if request.user.get('role') != 'student':
            return jsonify({"message": "Student access required"}), 403
        return f(*args, **kwargs)
    return decorated

def client_required(f):
    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if request.user.get('role') != 'client':
            return jsonify({"message": "Client access required"}), 403
        return f(*args, **kwargs)
    return decorated
