"""Admin routes: overview, applications, opportunity posting, companies, students."""
from datetime import datetime
from flask import Blueprint, request, jsonify
from extensions import db
from models import Company, Opportunity, Application, Student, Notification
from auth import require_auth
from routes_student import opportunity_public, application_public, eligibility_issue

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

VALID_STATUSES = {"Applied", "Shortlisted", "Interview", "Selected", "Rejected", "Withdrawn"}


@admin_bp.get("/overview")
@require_auth("admin")
def overview():
    active = Opportunity.query.filter_by(status="Active").count()
    apps   = Application.query.all()
    in_process = sum(1 for a in apps if a.status in ("Shortlisted", "Interview"))
    highest = db.session.query(db.func.max(Opportunity.package_offered)).scalar() or 0
    students = Student.query.count()
    return jsonify({
        "active_opportunities": active,
        "total_applications": len(apps),
        "in_process": in_process,
        "highest_package": highest,
        "total_students": students,
    })


@admin_bp.get("/applications")
@require_auth("admin")
def all_applications():
    apps = Application.query.order_by(Application.application_date.desc()).all()
    return jsonify([application_public(a) for a in apps])


@admin_bp.patch("/applications/<int:app_id>")
@require_auth("admin")
def update_application(app_id):
    body   = request.get_json(force=True, silent=True) or {}
    status = body.get("status")
    if status not in VALID_STATUSES:
        return jsonify({"error": f"status must be one of {sorted(VALID_STATUSES)}"}), 400

    app_row = Application.query.get(app_id)
    if not app_row:
        return jsonify({"error": "Application not found"}), 404

    old = app_row.status
    app_row.status = status
    if old != status:
        kind = "success" if status in ("Shortlisted", "Interview", "Selected") \
               else "warning" if status == "Rejected" else "info"
        db.session.add(Notification(
            student_id=app_row.student_id,
            title=f"Application update: {status}",
            message=f"{app_row.opportunity.role} at "
                    f"{app_row.opportunity.company.name} is now '{status}'.",
            kind=kind, link="mine",
        ))
    db.session.commit()
    return jsonify(application_public(app_row))


@admin_bp.post("/opportunities")
@require_auth("admin")
def create_opportunity():
    body = request.get_json(force=True, silent=True) or {}
    required = ["company_name", "role", "package_offered"]
    missing = [f for f in required if not body.get(f)]
    if missing:
        return jsonify({"error": f"Missing: {', '.join(missing)}"}), 400

    company = Company.query.filter_by(name=body["company_name"]).first()
    if not company:
        company = Company(name=body["company_name"],
                          description=body.get("company_description", ""))
        db.session.add(company); db.session.flush()
    elif body.get("company_description"):
        company.description = body["company_description"]

    opp = Opportunity(
        company_id=company.id,
        role=body["role"],
        job_description=body.get("job_description", ""),
        company_description=body.get("company_description", ""),
        eligibility_cgpa=float(body.get("eligibility_cgpa") or 0),
        eligible_branch=body.get("eligible_branch", "CSE"),
        max_backlogs=int(body.get("max_backlogs") or 0),
        required_skills=body.get("required_skills", ""),
        package_offered=float(body["package_offered"]),
        number_of_openings=int(body.get("number_of_openings") or 1),
        application_deadline=body.get("application_deadline", ""),
        status="Active",
        posted_date=datetime.utcnow(),
    )
    db.session.add(opp); db.session.flush()

    queued = 0
    for s in Student.query.all():
        if eligibility_issue(s, opp) is None:
            db.session.add(Notification(
                student_id=s.id,
                title=f"New role: {opp.role}",
                message=f"{company.name} is hiring — ₹{opp.package_offered} LPA. "
                        f"Apply by {opp.application_deadline or 'TBD'}.",
                kind="success", link="opps",
            ))
            queued += 1

    db.session.commit()
    result = opportunity_public(opp)
    result["notifications_queued"] = queued
    return jsonify(result), 201


@admin_bp.get("/companies")
@require_auth("admin")
def companies():
    out = []
    for c in Company.query.all():
        opps = Opportunity.query.filter_by(company_id=c.id).all()
        if not opps: continue
        out.append({
            "id": c.id, "name": c.name, "description": c.description,
            "opportunities": [{"role": o.role, "package_offered": o.package_offered}
                              for o in opps],
            "applicant_count": sum(len(o.applications) for o in opps),
        })
    return jsonify(out)


@admin_bp.get("/students")
@require_auth("admin")
def all_students():
    out = []
    for s in Student.query.order_by(Student.roll_no).all():
        out.append({
            "id": s.id, "roll_no": s.roll_no, "name": s.name, "email": s.email,
            "branch": s.branch, "cgpa": s.cgpa,
            "backlog_count": s.backlog_count,
            "current_offer_package": s.current_offer_package,
            "applications": len(s.applications),
            "resume_path": s.resume_path,
        })
    return jsonify(out)