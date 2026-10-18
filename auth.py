"""Auth: email-OTP registration (gated by UniversityRecord),
password login, student password reset."""
import secrets
from datetime import datetime, timedelta
from functools import wraps

from flask import Blueprint, request, jsonify, current_app, g
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from werkzeug.security import generate_password_hash, check_password_hash

from extensions import db
from models import (Student, AdminUser, OTPVerification, Notification,
                    Skill, StudentSkill, UniversityRecord)
from mailer import send_otp

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

TOKEN_MAX_AGE   = 60 * 60 * 24 * 7
ALLOWED_DOMAIN  = "@gmail.com"
OTP_TTL_MIN     = 10
OTP_MAX_TRIES   = 5
OTP_COOLDOWN_S  = 45


def _ser(): return URLSafeTimedSerializer(current_app.config["SECRET_KEY"])
def make_token(role, uid): return _ser().dumps({"role": role, "id": uid})
def parse_token(t):
    try:    return _ser().loads(t, max_age=TOKEN_MAX_AGE)
    except (BadSignature, SignatureExpired): return None


def require_auth(role=None):
    def deco(fn):
        @wraps(fn)
        def wrap(*a, **kw):
            h = request.headers.get("Authorization", "")
            if not h.startswith("Bearer "):
                return jsonify({"error": "Sign in to continue"}), 401
            data = parse_token(h.split(" ", 1)[1])
            if not data:
                return jsonify({"error": "Session expired, sign in again"}), 401
            if role and data.get("role") != role:
                return jsonify({"error": "Not allowed for this account"}), 403
            g.auth = data
            return fn(*a, **kw)
        return wrap
    return deco


def _public(role, u):
    if role == "student":
        return {"id": u.id, "roll_no": u.roll_no, "name": u.name, "email": u.email,
                "branch": u.branch, "cgpa": u.cgpa, "backlog_count": u.backlog_count,
                "current_offer_package": u.current_offer_package,
                "phone": u.phone, "resume_path": u.resume_path}
    return {"id": u.id, "name": u.name, "email": u.email}


def _gen_otp(): return f"{secrets.randbelow(10**6):06d}"


def _issue_otp(email, purpose):
    recent = (OTPVerification.query
              .filter_by(email=email, purpose=purpose, used=False)
              .order_by(OTPVerification.created_at.desc()).first())
    if recent and (datetime.utcnow() - recent.created_at).total_seconds() < OTP_COOLDOWN_S:
        wait = OTP_COOLDOWN_S - int((datetime.utcnow() - recent.created_at).total_seconds())
        return False, f"Please wait {wait}s before requesting another code."

    OTPVerification.query.filter_by(email=email, purpose=purpose, used=False)\
                         .update({"used": True})

    otp = _gen_otp()
    db.session.add(OTPVerification(
        email=email, otp_hash=generate_password_hash(otp), purpose=purpose,
        expires_at=datetime.utcnow() + timedelta(minutes=OTP_TTL_MIN),
    ))
    db.session.commit()
    try:
        send_otp(email, otp, purpose)
    except Exception:
        current_app.logger.exception("OTP email failed")
        return False, "Could not send email. Try again or contact the placement cell."
    return True, None


def _check_otp(email, otp, purpose, consume=True):
    rec = (OTPVerification.query
           .filter_by(email=email, purpose=purpose, used=False)
           .order_by(OTPVerification.created_at.desc()).first())
    if not rec:                              return False, "No active code — request a new one."
    if rec.expires_at < datetime.utcnow():   return False, "This code has expired."
    if rec.attempts >= OTP_MAX_TRIES:        return False, "Too many attempts — request a new code."
    rec.attempts += 1
    db.session.commit()
    if not check_password_hash(rec.otp_hash, otp):
        return False, "Incorrect code."
    if consume:
        rec.used = True
        db.session.commit()
    return True, None


# ---------- check roll + email against university records ----------
@auth_bp.post("/check-student")
def check_student():
    """Called by the frontend before sending the OTP. Verifies the
    (roll_no, email) pair against the university's authoritative list."""
    body  = request.get_json(force=True, silent=True) or {}
    roll  = (body.get("roll_no") or "").strip().upper()
    email = (body.get("email") or "").strip().lower()

    if not roll or not email:
        return jsonify({"valid": False,
                        "error": "Roll number and email are required"}), 400

    rec = UniversityRecord.query.filter_by(roll_no=roll, email=email).first()
    if not rec:
        return jsonify({
            "valid": False,
            "error": "We couldn't find a matching record. "
                     "Roll number and email must both match what the university has on file.",
        }), 404
    if rec.is_registered:
        return jsonify({
            "valid": False,
            "error": "An account has already been created for this roll number. Sign in instead.",
        }), 409
    if Student.query.filter_by(email=email).first():
        return jsonify({"valid": False,
                        "error": "An account already exists for this email."}), 409

    return jsonify({
        "valid": True,
        "name": rec.name,
        "branch": rec.branch,
        "batch": rec.batch,
    })


# ---------- send OTP ----------
@auth_bp.post("/send-otp")
def send_otp_route():
    body    = request.get_json(force=True, silent=True) or {}
    email   = (body.get("email") or "").strip().lower()
    roll_no = (body.get("roll_no") or "").strip().upper()
    purpose = body.get("purpose", "register")

    if purpose not in ("register", "reset"):
        return jsonify({"error": "Invalid purpose"}), 400
    if not email.endswith(ALLOWED_DOMAIN):
        return jsonify({"error": f"Only {ALLOWED_DOMAIN} email addresses are allowed"}), 400

    # --- HARD GATE for registration: roll + email must match ---
    if purpose == "register":
        if not roll_no:
            return jsonify({"error": "Roll number is required"}), 400
        rec = UniversityRecord.query.filter_by(roll_no=roll_no, email=email).first()
        if not rec:
            return jsonify({
                "error": "Roll number and email must both match what the university "
                         "has on file. Please check your details and try again.",
            }), 403
        if rec.is_registered:
            return jsonify({
                "error": "An account has already been created for this roll number.",
            }), 409
        if Student.query.filter_by(email=email).first():
            return jsonify({"error": "An account already exists for this email."}), 409

    if purpose == "reset":
        if not Student.query.filter_by(email=email).first():
            return jsonify({"error": "No student account found for this email."}), 404

    ok, err = _issue_otp(email, purpose)
    if not ok:
        return jsonify({"error": err}), 429
    return jsonify({"ok": True, "message": f"Verification code sent to {email}"})


@auth_bp.post("/verify-otp")
def verify_otp_route():
    body    = request.get_json(force=True, silent=True) or {}
    email   = (body.get("email") or "").strip().lower()
    otp     = (body.get("otp") or "").strip()
    purpose = body.get("purpose", "register")
    ok, err = _check_otp(email, otp, purpose, consume=False)
    if not ok: return jsonify({"error": err}), 400
    return jsonify({"ok": True})


# ---------- register ----------
@auth_bp.post("/register")
def register():
    body     = request.get_json(force=True, silent=True) or {}
    email    = (body.get("email") or "").strip().lower()
    otp      = (body.get("otp") or "").strip()
    name     = (body.get("name") or "").strip()
    password = body.get("password") or ""
    roll_no  = (body.get("roll_no") or "").strip().upper()

    if not email.endswith(ALLOWED_DOMAIN):
        return jsonify({"error": f"Only {ALLOWED_DOMAIN} emails can register"}), 400
    if len(name) < 2:  return jsonify({"error": "Please enter your full name"}), 400
    if not roll_no:    return jsonify({"error": "Please enter your roll number"}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    # --- HARD GATE: roll + email must match the university's record ---
    rec = UniversityRecord.query.filter_by(roll_no=roll_no, email=email).first()
    if not rec:
        return jsonify({
            "error": "Registration blocked. Roll number and email must both match "
                     "what the university has on file.",
        }), 403
    if rec.is_registered:
        return jsonify({"error": "This roll number has already been used to create an account."}), 409
    if Student.query.filter_by(email=email).first():
        return jsonify({"error": "An account already exists for this email"}), 409
    if Student.query.filter_by(roll_no=roll_no).first():
        return jsonify({"error": f"Roll number {roll_no} is already registered"}), 409

    ok, err = _check_otp(email, otp, "register", consume=True)
    if not ok: return jsonify({"error": err}), 400

    student = Student(
        roll_no=roll_no, name=name, email=email,
        password_hash=generate_password_hash(password),
        branch=(body.get("branch") or rec.branch or "").strip().upper(),
        cgpa=float(body.get("cgpa") or 0),
        backlog_count=int(body.get("backlog_count") or 0),
        current_offer_package=float(body.get("current_offer_package") or 0),
        phone=(body.get("phone") or "").strip() or None,
    )
    db.session.add(student); db.session.flush()

    for skill_name in (body.get("skills") or []):
        skill_name = str(skill_name).strip()
        if not skill_name: continue
        sk = Skill.query.filter_by(name=skill_name).first()
        if not sk:
            sk = Skill(name=skill_name, category="General")
            db.session.add(sk); db.session.flush()
        db.session.add(StudentSkill(student_id=student.id, skill_id=sk.id,
                                    proficiency_level="Intermediate"))

    rec.is_registered = True
    rec.registered_student_id = student.id

    db.session.add(Notification(
        student_id=student.id, title="Welcome to CareerLink",
        message="Your placement portal is ready. Browse open opportunities to get started.",
        kind="info", link="opps",
    ))
    db.session.commit()
    return jsonify({"token": make_token("student", student.id),
                    "role": "student", "user": _public("student", student)}), 201


# ---------- login ----------
@auth_bp.post("/login")
def login():
    body     = request.get_json(force=True, silent=True) or {}
    role     = body.get("role", "student")
    email    = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    if role == "student":
        user = Student.query.filter_by(email=email).first()
    elif role == "admin":
        user = AdminUser.query.filter_by(email=email).first()
    else:
        return jsonify({"error": "Invalid role"}), 400

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Incorrect email or password"}), 401
    return jsonify({"token": make_token(role, user.id), "role": role,
                    "user": _public(role, user)})


# ---------- forgot / reset ----------
@auth_bp.post("/forgot-password")
def forgot_password():
    body  = request.get_json(force=True, silent=True) or {}
    email = (body.get("email") or "").strip().lower()
    if not email.endswith(ALLOWED_DOMAIN):
        return jsonify({"error": f"Only {ALLOWED_DOMAIN} emails are allowed"}), 400
    if not Student.query.filter_by(email=email).first():
        return jsonify({"error": "No student account found for this email"}), 404
    ok, err = _issue_otp(email, "reset")
    if not ok: return jsonify({"error": err}), 429
    return jsonify({"ok": True, "message": f"Reset code sent to {email}"})


@auth_bp.post("/reset-password")
def reset_password():
    body     = request.get_json(force=True, silent=True) or {}
    email    = (body.get("email") or "").strip().lower()
    otp      = (body.get("otp") or "").strip()
    password = body.get("password") or ""
    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400
    user = Student.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "No student account found for this email"}), 404
    ok, err = _check_otp(email, otp, "reset", consume=True)
    if not ok: return jsonify({"error": err}), 400
    user.password_hash = generate_password_hash(password)
    db.session.commit()
    return jsonify({"token": make_token("student", user.id), "role": "student",
                    "user": _public("student", user)})


@auth_bp.get("/me")
@require_auth()
def me():
    role, uid = g.auth["role"], g.auth["id"]
    user = Student.query.get(uid) if role == "student" else AdminUser.query.get(uid)
    if not user:
        return jsonify({"error": "Account no longer exists"}), 404
    return jsonify({"role": role, "user": _public(role, user)})