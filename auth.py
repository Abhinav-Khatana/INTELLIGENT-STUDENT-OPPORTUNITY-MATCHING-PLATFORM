"""
Authentication for both account types (student / admin), matching the
two-step login the frontend uses:

  1. POST /api/auth/check-id   -> tells the frontend whether this ID
     already has an account, so it can show "create a password" or
     "enter your password".
  2. POST /api/auth/register   -> first time only, sets the password.
  3. POST /api/auth/login      -> returns a bearer token.
  4. POST /api/auth/reset-password -> "forgot password" flow.
  5. GET  /api/auth/me         -> whoever the current token belongs to.

Tokens are signed with itsdangerous (already a Flask dependency) and
carry {role, id}. They are stateless — nothing is stored server-side —
so "logging out" just means the frontend forgets the token.
"""
from functools import wraps

from flask import Blueprint, request, jsonify, current_app, g
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from werkzeug.security import generate_password_hash, check_password_hash

from extensions import db
from models import Student, AdminUser

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7  # 7 days


def _serializer():
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"])


def make_token(role, user_id):
    return _serializer().dumps({"role": role, "id": user_id})


def parse_token(token):
    try:
        return _serializer().loads(token, max_age=TOKEN_MAX_AGE_SECONDS)
    except (BadSignature, SignatureExpired):
        return None


def require_auth(role=None):
    """Route decorator. Reads `Authorization: Bearer <token>`, and sets
    g.auth = {'role': ..., 'id': ...} on success. Pass role='student' or
    role='admin' to restrict a route to one account type."""

    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            header = request.headers.get("Authorization", "")
            if not header.startswith("Bearer "):
                return jsonify({"error": "Sign in to continue"}), 401
            data = parse_token(header.split(" ", 1)[1])
            if not data:
                return jsonify({"error": "Your session expired, please sign in again"}), 401
            if role and data.get("role") != role:
                return jsonify({"error": "This account type can't access that"}), 403
            g.auth = data
            return fn(*args, **kwargs)

        return wrapper

    return decorator


def _lookup(role, identifier):
    identifier = (identifier or "").strip()
    if not identifier:
        return None
    if role == "student":
        return Student.query.filter(
            db.or_(Student.roll_no == identifier, Student.email == identifier)
        ).first()
    if role == "admin":
        return AdminUser.query.filter(AdminUser.email == identifier).first()
    return None


def _public(role, user):
    if role == "student":
        return {
            "id": user.id, "roll_no": user.roll_no, "name": user.name, "email": user.email,
            "branch": user.branch, "cgpa": user.cgpa, "backlog_count": user.backlog_count,
            "current_offer_package": user.current_offer_package,
        }
    return {"id": user.id, "name": user.name, "email": user.email}


@auth_bp.post("/check-id")
def check_id():
    body = request.get_json(force=True, silent=True) or {}
    role, ident = body.get("role"), body.get("id", "")
    if role not in ("student", "admin") or not ident.strip():
        return jsonify({"error": "role and id are required"}), 400
    return jsonify({"exists": _lookup(role, ident) is not None})


@auth_bp.post("/register")
def register():
    """First-time sign-in: creates the account with the password the
    user just chose. `id` is the roll number for students, or the email
    for the placement cell."""
    body = request.get_json(force=True, silent=True) or {}
    role = body.get("role")
    ident = (body.get("id") or "").strip()
    password = body.get("password") or ""

    if role not in ("student", "admin") or not ident or len(password) < 4:
        return jsonify({"error": "role, id and a password of at least 4 characters are required"}), 400
    if _lookup(role, ident):
        return jsonify({"error": "An account already exists for this ID — sign in instead"}), 409

    if role == "student":
        user = Student(
            roll_no=ident,
            name=body.get("name") or ident,
            email=body.get("email"),
            branch=body.get("branch", "CSE"),
            cgpa=float(body.get("cgpa") or 0),
            backlog_count=int(body.get("backlog_count") or 0),
            current_offer_package=float(body.get("current_offer_package") or 0),
            password_hash=generate_password_hash(password),
        )
    else:
        user = AdminUser(
            name=body.get("name") or "Placement Cell",
            email=ident,
            password_hash=generate_password_hash(password),
        )

    db.session.add(user)
    db.session.commit()
    return jsonify({"token": make_token(role, user.id), "role": role, "user": _public(role, user)}), 201


@auth_bp.post("/login")
def login():
    body = request.get_json(force=True, silent=True) or {}
    role, ident, password = body.get("role"), body.get("id", ""), body.get("password", "")
    user = _lookup(role, ident)
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Incorrect ID or password"}), 401
    return jsonify({"token": make_token(role, user.id), "role": role, "user": _public(role, user)})


@auth_bp.post("/reset-password")
def reset_password():
    """Simplified 'forgot password': sets a new password directly.
    A real deployment should verify the user first (email OTP, etc.) —
    this endpoint is intentionally minimal for the project demo."""
    body = request.get_json(force=True, silent=True) or {}
    role, ident, password = body.get("role"), body.get("id", ""), body.get("password", "")
    if role not in ("student", "admin") or len(password) < 4:
        return jsonify({"error": "role, id and a password of at least 4 characters are required"}), 400
    user = _lookup(role, ident)
    if not user:
        return jsonify({"error": "No account found for this ID"}), 404
    user.password_hash = generate_password_hash(password)
    db.session.commit()
    return jsonify({"token": make_token(role, user.id), "role": role, "user": _public(role, user)})


@auth_bp.get("/me")
@require_auth()
def me():
    role, uid = g.auth["role"], g.auth["id"]
    user = Student.query.get(uid) if role == "student" else AdminUser.query.get(uid)
    if not user:
        return jsonify({"error": "Account no longer exists"}), 404
    return jsonify({"role": role, "user": _public(role, user)})
