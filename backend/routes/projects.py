from flask import Blueprint, request as flask_request, jsonify
from models import db, Project, User
from utils.auth_utils import token_required, student_required
import os
from werkzeug.utils import secure_filename

projects = Blueprint("projects", __name__)
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), '..', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = {'zip', 'pdf', 'py', 'js', 'ts', 'html', 'css', 'md', 'txt', 'ipynb', 'tar', 'gz'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@projects.route("/", methods=["GET"])
def get_projects():
    all_projects = Project.query.order_by(Project.created_at.desc()).all()
    result = []
    for p in all_projects:
        student = User.query.get(p.student_id)
        result.append({
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "category": p.category,
            "github_link": p.github_link,
            "student_name": student.name if student else "Unknown",
            "likes": p.likes,
            "views": p.views
        })
    return jsonify(result)


@projects.route("/upload", methods=["POST"])
@student_required
def upload_project():
    student_id = flask_request.user.get('id')

    title = flask_request.form.get("title")
    description = flask_request.form.get("description")
    category = flask_request.form.get("category")
    github_link = flask_request.form.get("github_link")

    if not title or not description:
        return jsonify({"message": "Title and description are required"}), 400

    if 'file' not in flask_request.files:
        return jsonify({"message": "No file uploaded"}), 400

    file = flask_request.files['file']

    if file.filename == '':
        return jsonify({"message": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"message": f"File type not allowed. Allowed types: {', '.join(sorted(ALLOWED_EXTENSIONS))}"}), 400

    filename = secure_filename(file.filename)
    # Prefix with student_id to avoid collisions
    filename = f"{student_id}_{filename}"
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)

    new_project = Project(
        title=title,
        description=description,
        category=category,
        github_link=github_link,
        file_path=filename,  # store relative filename
        student_id=student_id
    )

    db.session.add(new_project)
    db.session.commit()

    return jsonify({"message": "Project uploaded successfully!"}), 201
