from flask import Blueprint, request, jsonify
from models import db, Course
from utils.auth_utils import token_required, admin_required

courses_bp = Blueprint("courses_bp", __name__)

@courses_bp.route("/", methods=["GET"])
def get_courses():
    courses = Course.query.all()
    result = []
    for c in courses:
        result.append({
            "id": c.id,
            "title": c.title,
            "description": c.description,
            "category": c.category,
            "url": c.url
        })
    return jsonify(result)

@courses_bp.route("/add", methods=["POST"])
@admin_required
def add_course():
    data = request.json
    new_course = Course(
        title=data.get("title"),
        description=data.get("description"),
        category=data.get("category"),
        url=data.get("url")
    )
    db.session.add(new_course)
    db.session.commit()
    return jsonify({"message": "Course added successfully!"}), 201
