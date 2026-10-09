"""Routes the placement cell (admin) uses: dashboard stats, posting
opportunities, reviewing/deciding on applications, and viewing
companies."""
from datetime import datetime

from flask import Blueprint, request, jsonify

from extensions import db
from models import Company, Opportunity, Application
from auth import require_auth
from routes_student import opportunity_public, application_public

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

VALID_STATUSES = {"Applied", "Shortlisted", "Interview", "Selected", "Rejected"}


@admin_bp.get("/overview")
@require_auth("admin")
def overview():
    active_opportunities = Opportunity.query.filter_by(status="Active").count()
    applications = Application.query.all()
    in_process = sum(1 for a in applications if a.status in ("Shortlisted", "Interview"))
    highest_package = db.session.query(db.func.max(Opportunity.package_offered)).scalar() or 0
    return jsonify({
        "active_opportunities": active_opportunities,
        "total_applications": len(applications),
        "in_process": in_process,
        "highest_package": highest_package,
    })


@admin_bp.get("/applications")
@require_auth("admin")
def all_applications():
    apps = Application.query.order_by(Application.application_date.desc()).all()
    return jsonify([application_public(a) for a in apps])


@admin_bp.patch("/applications/<int:app_id>")
@require_auth("admin")
def update_application(app_id):
    body = request.get_json(force=True, silent=True) or {}
    status = body.get("status")
    if status not in VALID_STATUSES:
        return jsonify({"error": f"status must be one of {sorted(VALID_STATUSES)}"}), 400

    application = Application.query.get(app_id)
    if not application:
        return jsonify({"error": "Application not found"}), 404

    application.status = status
    db.session.commit()
    return jsonify(application_public(application))


@admin_bp.post("/opportunities")
@require_auth("admin")
def create_opportunity():
    body = request.get_json(force=True, silent=True) or {}
    required = ["company_name", "role", "package_offered"]
    missing = [f for f in required if not body.get(f)]
    if missing:
        return jsonify({"error": f"Missing required field(s): {', '.join(missing)}"}), 400

    company = Company.query.filter_by(name=body["company_name"]).first()
    if not company:
        company = Company(name=body["company_name"])
        db.session.add(company)
        db.session.flush()  # get company.id before using it below

    opportunity = Opportunity(
        company_id=company.id,
        role=body["role"],
        job_description=body.get("job_description", ""),
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
    db.session.add(opportunity)
    db.session.commit()
    return jsonify(opportunity_public(opportunity)), 201


@admin_bp.get("/companies")
@require_auth("admin")
def companies():
    result = []
    for company in Company.query.all():
        opps = Opportunity.query.filter_by(company_id=company.id).all()
        if not opps:
            continue
        result.append({
            "id": company.id,
            "name": company.name,
            "opportunities": [{"role": o.role, "package_offered": o.package_offered} for o in opps],
            "applicant_count": sum(len(o.applications) for o in opps),
        })
    return jsonify(result)
