"""Student routes: opportunities, applications, profile."""
from datetime import datetime
from flask import Blueprint, request, jsonify, g

from extensions import db
from models import Student, Opportunity, Application
from auth import require_auth

student_bp = Blueprint("student", __name__, url_prefix="/api")


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
        "interviews": [{
            "id": i.id, "round": i.interview_round,
            "date": i.interview_date.strftime("%d %b %Y, %H:%M") if i.interview_date else None,
            "mode": i.mode, "result": i.interview_result, "remarks": i.remarks,
        } for i in a.interviews],
        "offer": ({
            "id": a.offer.id,
            "package_offered": a.offer.package_offered,
            "status": a.offer.offer_status,
            "joining_date": a.offer.joining_date.strftime("%d %b %Y") if a.offer.joining_date else None,
        } if a.offer else None),
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
    from models import Skill
    return jsonify([s.name for s in Skill.query.order_by(Skill.name).all()])


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
    db.session.commit()
    return jsonify({"ok": True})


@student_bp.get("/applications/mine")
@require_auth("student")
def my_applications():
    apps = (Application.query.filter_by(student_id=g.auth["id"])
            .order_by(Application.application_date.desc()).all())
    return jsonify([application_public(a) for a in apps])


@student_bp.post("/applications")
@require_auth("student")
def apply():
    body = request.get_json(force=True, silent=True) or {}
    opp  = Opportunity.query.get(body.get("opportunity_id"))
    if not opp or opp.status != "Active":
        return jsonify({"error": "This opportunity is not open for applications"}), 404

    student = Student.query.get(g.auth["id"])
    issue = eligibility_issue(student, opp)
    if issue:
        return jsonify({"error": issue}), 400

    if Application.query.filter_by(student_id=student.id, opportunity_id=opp.id).first():
        return jsonify({"error": "You have already applied to this opportunity"}), 409

    app_row = Application(
        student_id=student.id, opportunity_id=opp.id, status="Applied",
        application_date=datetime.utcnow(), resume_version=student.resume_path,
    )
    db.session.add(app_row)
    db.session.commit()
    return jsonify(application_public(app_row)), 201


@student_bp.post("/applications/<int:app_id>/withdraw")
@require_auth("student")
def withdraw_application(app_id):
    """Withdraw an application before it moves past Shortlisted."""
    app_row = Application.query.filter_by(id=app_id, student_id=g.auth["id"]).first()
    if not app_row:
        return jsonify({"error": "Application not found"}), 404
    if app_row.status not in ("Applied", "Shortlisted"):
        return jsonify({
            "error": f"Can't withdraw after status is '{app_row.status}'"
        }), 400
    app_row.status = "Withdrawn"
    db.session.commit()
    return jsonify({"ok": True, "status": "Withdrawn"})