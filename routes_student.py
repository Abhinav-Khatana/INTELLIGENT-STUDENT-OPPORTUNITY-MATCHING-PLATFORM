"""Student routes: opportunities, applications, profile, resume (with
extraction), skills, notifications."""
import os, uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, g, current_app
from werkzeug.utils import secure_filename

from extensions import db
from models import Student, Opportunity, Application, Notification, Skill, StudentSkill
from auth import require_auth
from os_concepts import application_mutex   # OS CONCEPT

student_bp = Blueprint("student", __name__, url_prefix="/api")

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads", "resumes")


def eligibility_issue(student, opp):
    if student.cgpa < opp.eligibility_cgpa:
        return f"Needs {opp.eligibility_cgpa} CGPA — you have {student.cgpa}"
    branches = [b.strip() for b in (opp.eligible_branch or "").split(",") if b.strip()]
    if branches and student.branch not in branches:
        return f"Open to {', '.join(branches)} only"
    if student.backlog_count > opp.max_backlogs:
        return f"Max {opp.max_backlogs} backlog(s) allowed"
    if student.current_offer_package and opp.package_offered <= student.current_offer_package:
        return f"Below your current offer of ₹{student.current_offer_package} LPA"
    return None


def opportunity_public(opp, student=None):
    data = {
        "id": opp.id, "role": opp.role, "company": opp.company.name,
        "company_id": opp.company_id,
        "company_description": opp.company_description,
        "company_website": opp.company.website,
        "company_contact": opp.company.contact_person,
        "job_description": opp.job_description,
        "eligibility_cgpa": opp.eligibility_cgpa,
        "eligible_branch": opp.eligible_branch,
        "max_backlogs": opp.max_backlogs,
        "required_skills": opp.required_skills,
        "package_offered": opp.package_offered,
        "number_of_openings": opp.number_of_openings,
        "application_deadline": opp.application_deadline,
        "status": opp.status,
        "posted_date": opp.posted_date.strftime("%Y-%m-%d") if opp.posted_date else None,
        "applicant_count": len(opp.applications),
    }
    if student is not None:
        issue = eligibility_issue(student, opp)
        data["eligible"]          = issue is None
        data["ineligible_reason"] = issue
        data["already_applied"]   = any(a.student_id == student.id for a in opp.applications)
    return data


def application_public(a):
    return {
        "id": a.id, "opportunity_id": a.opportunity_id,
        "role": a.opportunity.role,
        "company": a.opportunity.company.name,
        "package_offered": a.opportunity.package_offered,
        "status": a.status,
        "application_date": a.application_date.strftime("%Y-%m-%d"),
        "student": {"id": a.student.id, "name": a.student.name,
                    "roll_no": a.student.roll_no, "branch": a.student.branch,
                    "cgpa": a.student.cgpa},
    }


@student_bp.get("/opportunities")
@require_auth()
def list_opportunities():
    student = Student.query.get(g.auth["id"]) if g.auth["role"] == "student" else None
    opps = Opportunity.query.filter_by(status="Active")\
                            .order_by(Opportunity.posted_date.desc()).all()
    return jsonify([opportunity_public(o, student) for o in opps])


@student_bp.get("/skills")
def skills_catalogue():
    return jsonify([s.name for s in Skill.query.order_by(Skill.name).all()])


# ---------- profile ----------
@student_bp.get("/students/me")
@require_auth("student")
def my_profile():
    s = Student.query.get(g.auth["id"])
    return jsonify({
        "id": s.id, "roll_no": s.roll_no, "name": s.name, "email": s.email,
        "branch": s.branch, "cgpa": s.cgpa, "backlog_count": s.backlog_count,
        "current_offer_package": s.current_offer_package,
        "phone": s.phone, "resume_path": s.resume_path,
        "skills": [ss.skill.name for ss in s.skills],
    })


@student_bp.patch("/students/me")
@require_auth("student")
def update_profile():
    body = request.get_json(force=True, silent=True) or {}
    s = Student.query.get(g.auth["id"])
    for f in ("name", "branch", "phone"):
        if f in body: setattr(s, f, str(body[f]).strip())
    for f in ("cgpa", "backlog_count", "current_offer_package"):
        if f in body:
            try: setattr(s, f, float(body[f] or 0))
            except (TypeError, ValueError): pass
    if "skills" in body:
        StudentSkill.query.filter_by(student_id=s.id).delete()
        seen = set()
        for name in body["skills"]:
            name = str(name).strip()
            if not name or name.lower() in seen: continue
            seen.add(name.lower())
            sk = Skill.query.filter_by(name=name).first()
            if not sk:
                sk = Skill(name=name, category="General")
                db.session.add(sk); db.session.flush()
            db.session.add(StudentSkill(student_id=s.id, skill_id=sk.id,
                                        proficiency_level="Intermediate"))
    db.session.commit()
    return jsonify({"ok": True})


@student_bp.post("/students/me/resume")
@require_auth("student")
def upload_resume():
    f = request.files.get("resume")
    if not f or not f.filename:
        return jsonify({"error": "Choose a file to upload"}), 400
    if not f.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files are allowed"}), 400

    # read the bytes once — we'll save them and parse them
    pdf_bytes = f.read()
    f.stream.seek(0)

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    fname = f"{g.auth['id']}_{uuid.uuid4().hex[:8]}_{secure_filename(f.filename)}"
    f.save(os.path.join(UPLOAD_DIR, fname))

    s = Student.query.get(g.auth["id"])
    s.resume_path = fname

    # --- extraction (never fatal — upload should succeed regardless) ---
    extracted = {"skills": [], "cgpa": None, "chars_extracted": 0}
    try:
        from resume_parser import extract_profile
        catalogue = [sk.name for sk in Skill.query.all()]
        result = extract_profile(pdf_bytes, catalogue)
        extracted = {
            "skills": result.get("skills", []),
            "cgpa":   result.get("cgpa"),
            "chars_extracted": result.get("chars_extracted", 0),
        }
    except Exception as e:
        current_app.logger.exception("Resume parse failed")

    db.session.commit()
    return jsonify({
        "ok": True,
        "resume_path": fname,
        "extracted": extracted,
    })


# ---------- applications ----------
@student_bp.get("/applications/mine")
@require_auth("student")
def my_applications():
    apps = (Application.query.filter_by(student_id=g.auth["id"])
            .order_by(Application.application_date.desc()).all())
    return jsonify([application_public(a) for a in apps])


@student_bp.post("/applications")
@require_auth("student")
def apply():
    """OS CONCEPT — Mutual Exclusion. Critical section wraps eligibility
    check → existence check → insert."""
    body = request.get_json(force=True, silent=True) or {}
    opp  = Opportunity.query.get(body.get("opportunity_id"))
    if not opp or opp.status != "Active":
        return jsonify({"error": "This opportunity is not open for applications"}), 404

    student = Student.query.get(g.auth["id"])
    try:
        with application_mutex.acquire(student.id, timeout=5.0):
            issue = eligibility_issue(student, opp)
            if issue: return jsonify({"error": issue}), 400
            if Application.query.filter_by(student_id=student.id,
                                           opportunity_id=opp.id).first():
                return jsonify({"error": "You have already applied to this opportunity"}), 409
            app_row = Application(
                student_id=student.id, opportunity_id=opp.id, status="Applied",
                application_date=datetime.utcnow(), resume_version=student.resume_path,
            )
            db.session.add(app_row)
            db.session.commit()
            return jsonify(application_public(app_row)), 201
    except TimeoutError as e:
        return jsonify({"error": str(e)}), 409


# ---------- notifications ----------
@student_bp.get("/notifications")
@require_auth("student")
def list_notifications():
    notes = (Notification.query.filter_by(student_id=g.auth["id"])
             .order_by(Notification.created_at.desc()).limit(30).all())
    unread = sum(1 for n in notes if not n.is_read)
    return jsonify({
        "unread": unread,
        "items": [{
            "id": n.id, "title": n.title, "message": n.message,
            "kind": n.kind, "link": n.link, "is_read": n.is_read,
            "created_at": n.created_at.strftime("%d %b, %H:%M"),
        } for n in notes],
    })


@student_bp.post("/notifications/<int:nid>/read")
@require_auth("student")
def mark_read(nid):
    n = Notification.query.filter_by(id=nid, student_id=g.auth["id"]).first()
    if not n: return jsonify({"error": "Not found"}), 404
    n.is_read = True
    db.session.commit()
    return jsonify({"ok": True})


@student_bp.post("/notifications/read-all")
@require_auth("student")
def mark_all_read():
    Notification.query.filter_by(student_id=g.auth["id"], is_read=False)\
                      .update({"is_read": True})
    db.session.commit()
    return jsonify({"ok": True})