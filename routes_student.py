"""Routes a signed-in student uses: browsing opportunities (with
eligibility checked server-side), applying, and viewing their own
applications and profile."""
from datetime import datetime

from flask import Blueprint, request, jsonify, g

from extensions import db
from models import Student, Opportunity, Application
from auth import require_auth

student_bp = Blueprint("student", __name__, url_prefix="/api")


def eligibility_issue(student, opp):
    """Mirrors the rules on the ER diagram: CGPA, branch, backlogs, and
    the package rule ('only apply if new package > current offer').
    Returns None when eligible, or a human-readable reason otherwise."""
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
        "id": opp.id,
        "role": opp.role,
        "company": opp.company.name,
        "company_id": opp.company_id,
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
        data["eligible"] = issue is None
        data["ineligible_reason"] = issue
        data["already_applied"] = any(a.student_id == student.id for a in opp.applications)
    return data


def application_public(a):
    return {
        "id": a.id,
        "opportunity_id": a.opportunity_id,
        "role": a.opportunity.role,
        "company": a.opportunity.company.name,
        "package_offered": a.opportunity.package_offered,
        "status": a.status,
        "application_date": a.application_date.strftime("%Y-%m-%d"),
        "student": {
            "id": a.student.id, "name": a.student.name, "roll_no": a.student.roll_no,
            "branch": a.student.branch, "cgpa": a.student.cgpa,
        },
    }


@student_bp.get("/opportunities")
@require_auth()  # either a student or admin can browse the list
def list_opportunities():
    student = Student.query.get(g.auth["id"]) if g.auth["role"] == "student" else None
    opps = Opportunity.query.filter_by(status="Active").order_by(Opportunity.posted_date.desc()).all()
    return jsonify([opportunity_public(o, student) for o in opps])


@student_bp.get("/students/me")
@require_auth("student")
def my_profile():
    student = Student.query.get(g.auth["id"])
    return jsonify({
        "id": student.id, "roll_no": student.roll_no, "name": student.name,
        "branch": student.branch, "cgpa": student.cgpa, "backlog_count": student.backlog_count,
        "current_offer_package": student.current_offer_package,
        "skills": [{"name": ss.skill.name, "level": ss.proficiency_level} for ss in student.skills],
    })


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
    opp = Opportunity.query.get(body.get("opportunity_id"))
    if not opp or opp.status != "Active":
        return jsonify({"error": "This opportunity is not open for applications"}), 404

    student = Student.query.get(g.auth["id"])

    issue = eligibility_issue(student, opp)
    if issue:
        return jsonify({"error": issue}), 400

    if Application.query.filter_by(student_id=student.id, opportunity_id=opp.id).first():
        return jsonify({"error": "You have already applied to this opportunity"}), 409

    application = Application(
        student_id=student.id, opportunity_id=opp.id, status="Applied",
        application_date=datetime.utcnow(), resume_version=student.resume_path,
    )
    db.session.add(application)
    db.session.commit()
    return jsonify(application_public(application)), 201
