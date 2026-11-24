"""Admin routes: overview, applications, opportunities, companies, students,
interviews, offers, announcements, bulk placements."""
import csv, io
from datetime import datetime
from flask import Blueprint, request, jsonify, g
from extensions import db
from models import (Company, Opportunity, Application, Student, Notification,
                    Interview, Offer, Announcement, Placement)
from auth import require_auth
from routes_student import opportunity_public, application_public, eligibility_issue
from os_concepts import InterviewScheduler, get_queue

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")

VALID_STATUSES = {"Applied", "Shortlisted", "Interview", "Selected", "Rejected", "Withdrawn"}


# ---------- overview ----------
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


# ---------- applications ----------
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
        q = get_queue()
        payload = {
            "student_id": app_row.student_id,
            "title": f"Application update: {status}",
            "message": f"{app_row.opportunity.role} at "
                       f"{app_row.opportunity.company.name} is now '{status}'.",
            "kind": kind, "link": "mine",
        }
        if q: q.produce(payload)
        else: db.session.add(Notification(**payload))
    db.session.commit()
    return jsonify(application_public(app_row))


# ---------- opportunities ----------
@admin_bp.post("/opportunities")
@require_auth("admin")
def create_opportunity():
    body = request.get_json(force=True, silent=True) or {}
    company_name = body.get("company_name") or body.get("company")
    role = body.get("role")
    package = body.get("package_offered")
    
    if not company_name or not role or not package:
        return jsonify({"error": "Company, role, and package are required"}), 400

    company = Company.query.filter_by(name=company_name).first()
    if not company:
        company = Company(name=company_name,
                          description=body.get("company_description", ""))
        db.session.add(company); db.session.flush()
    elif body.get("company_description"):
        company.description = body["company_description"]

    opp = Opportunity(
        company_id=company.id,
        role=role,
        job_description=body.get("job_description", ""),
        company_description=body.get("company_description", ""),
        eligibility_cgpa=float(body.get("eligibility_cgpa") or 0),
        eligible_branch=body.get("eligible_branch", ""),
        max_backlogs=int(body.get("max_backlogs") or 0),
        required_skills=body.get("required_skills", ""),
        package_offered=float(package),
        number_of_openings=int(body.get("number_of_openings") or 1),
        application_deadline=body.get("application_deadline", ""),
        status="Active",
        posted_date=datetime.utcnow(),
    )
    db.session.add(opp); db.session.flush()

    q = get_queue()
    queued = 0
    for s in Student.query.all():
        if eligibility_issue(s, opp) is None:
            payload = {
                "student_id": s.id,
                "title": f"New role: {opp.role}",
                "message": f"{company.name} is hiring — ₹{opp.package_offered} LPA. "
                           f"Apply by {opp.application_deadline or 'TBD'}.",
                "kind": "success", "link": "opps",
            }
            if q and q.produce(payload): queued += 1
            elif not q:
                db.session.add(Notification(**payload)); queued += 1

    db.session.commit()
    result = opportunity_public(opp)
    result["notifications_queued"] = queued
    return jsonify(result), 201


# ---------- companies ----------
@admin_bp.get("/companies")
@require_auth("admin")
def companies():
    out = []
    for c in Company.query.all():
        opps = Opportunity.query.filter_by(company_id=c.id).all()
        if not opps: continue
        out.append({
            "id": c.id, "name": c.name, "description": c.description,
            "opportunities": [opportunity_public(o) for o in opps],
            "applicant_count": sum(len(o.applications) for o in opps),
        })
    return jsonify(out)


# ---------- students ----------
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


# ---------- OS concept endpoints ----------
@admin_bp.get("/schedule")
@require_auth("admin")
def schedule():
    policy = request.args.get("policy", "fcfs").lower()
    apps = Application.query.all()
    try:
        ordered = InterviewScheduler.schedule(apps, policy)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify({
        "policy": policy,
        "policies": InterviewScheduler.list_policies(),
        "queue": [application_public(a) for a in ordered],
    })


@admin_bp.get("/queue-stats")
@require_auth("admin")
def queue_stats():
    q = get_queue()
    if not q: return jsonify({"error": "queue not initialized"}), 500
    return jsonify(q.stats)


# ---------- interviews ----------
@admin_bp.get("/interviews")
@require_auth("admin")
def all_interviews():
    ivs = Interview.query.order_by(Interview.interview_date.desc()).all()
    return jsonify([{
        "id": i.id, "application_id": i.application_id,
        "student": i.application.student.name,
        "roll_no": i.application.student.roll_no,
        "role": i.application.opportunity.role,
        "company": i.application.opportunity.company.name,
        "round": i.interview_round,
        "date": i.interview_date.strftime("%d %b %Y, %H:%M") if i.interview_date else None,
        "mode": i.mode, "result": i.interview_result, "remarks": i.remarks,
    } for i in ivs])


@admin_bp.post("/applications/<int:app_id>/interviews")
@require_auth("admin")
def create_interview_alias(app_id):
    body = request.get_json(force=True, silent=True) or {}
    app_row = Application.query.get(app_id)
    if not app_row: return jsonify({"error": "App not found"}), 404
    
    date_str = body.get("date", "")
    when = datetime.utcnow()
    if date_str:
        try: when = datetime.strptime(date_str, "%Y-%m-%d")
        except: pass

    iv = Interview(
        application_id=app_row.id,
        interview_round=int(body.get("round") or 1),
        interview_date=when,
        mode=body.get("mode", "Online"),
        interview_result="Pending",
        remarks=body.get("remarks", ""),
    )
    db.session.add(iv)
    if app_row.status not in ("Interview", "Selected"):
        app_row.status = "Interview"

    q = get_queue()
    payload = {
        "student_id": app_row.student_id,
        "title": f"Interview scheduled — Round {iv.interview_round}",
        "message": f"{app_row.opportunity.role} at {app_row.opportunity.company.name}.",
        "kind": "info", "link": "mine",
    }
    if q: q.produce(payload)
    else: db.session.add(Notification(**payload))
    db.session.commit()
    return jsonify({"ok": True}), 201


@admin_bp.post("/applications/<int:app_id>/offer")
@require_auth("admin")
def create_offer_alias(app_id):
    body = request.get_json(force=True, silent=True) or {}
    app_row = Application.query.get(app_id)
    if not app_row: return jsonify({"error": "App not found"}), 404
    if app_row.offer: return jsonify({"error": "Offer already exists"}), 409

    joining = None
    if body.get("joining_date"):
        try: joining = datetime.strptime(body["joining_date"], "%Y-%m-%d").date()
        except: pass

    offer = Offer(
        application_id=app_row.id,
        package_offered=float(body.get("package_offered") or app_row.opportunity.package_offered),
        offer_status="Pending",
        joining_date=joining,
        offer_date=datetime.utcnow(),
    )
    db.session.add(offer)
    app_row.status = "Selected"
    
    q = get_queue()
    payload = {
        "student_id": app_row.student_id,
        "title": "Offer letter received",
        "message": f"{app_row.opportunity.company.name} has offered you ₹{offer.package_offered} LPA.",
        "kind": "success", "link": "mine",
    }
    if q: q.produce(payload)
    else: db.session.add(Notification(**payload))

    db.session.commit()
    return jsonify({"ok": True}), 201


# ============================================================
# ANNOUNCEMENTS
# ============================================================
@admin_bp.get("/announcements")
@require_auth("admin")
def list_announcements_admin():
    # All admins can see all announcements. 
    # The frontend handles hiding the "Approve" button for non-super admins.
    items = Announcement.query.order_by(Announcement.created_at.desc()).all()

    return jsonify({
        "items": [{
            "id": a.id, "title": a.title, "message": a.message,
            "priority": a.priority, "status": a.status,
            "created_by": a.created_by,
            "created_at": a.created_at.strftime("%d %b %Y, %H:%M"),
        } for a in items],
    })


@admin_bp.post("/announcements")
@require_auth("admin")
def create_announcement():
    body = request.get_json(force=True, silent=True) or {}
    title   = (body.get("title") or "").strip()
    message = (body.get("message") or "").strip()
    priority = body.get("priority", "info")
    
    if not title or not message:
        return jsonify({"error": "Title and message are required"}), 400
    if priority not in ("info", "important"):
        priority = "info"

    # Auto-approve if super admin, else pending
    status = "Approved" if g.auth.get("is_super") else "Pending"

    a = Announcement(
        title=title, message=message, priority=priority,
        status=status, active=True, created_by="Placement Cell",
    )
    db.session.add(a)
    db.session.commit()
    return jsonify({"ok": True, "status": status}), 201


@admin_bp.post("/announcements/<int:aid>/approve")
@require_auth("admin")
def approve_announcement(aid):
    if not g.auth.get("is_super"):
        return jsonify({"error": "Only Super Admins can approve"}), 403
    a = Announcement.query.get(aid)
    if not a: return jsonify({"error": "Announcement not found"}), 404
    a.status = "Approved"
    db.session.commit()
    return jsonify({"ok": True, "active": a.active})


@admin_bp.delete("/announcements/<int:aid>")
@require_auth("admin")
def delete_announcement(aid):
    a = Announcement.query.get(aid)
    if not a: return jsonify({"error": "Announcement not found"}), 404
    db.session.delete(a)
    db.session.commit()
    return jsonify({"ok": True})


# ============================================================
# BULK PLACEMENTS
# ============================================================
@admin_bp.get("/placements")
@require_auth("admin")
def list_placements():
    items = Placement.query.order_by(Placement.created_at.desc()).all()
    return jsonify([{
        "id": p.id,
        "student_name": p.student.name,
        "roll_no": p.student.roll_no,
        "company_name": p.company_name,
        "role": p.role,
        "package_offered": p.package_offered,
        "joining_date": p.joining_date.strftime("%d %b %Y") if p.joining_date else None,
        "created_at": p.created_at.strftime("%d %b %Y"),
    } for p in items])


@admin_bp.post("/placements/bulk")
@require_auth("admin")
def upload_placements_bulk():
    body = request.get_json(force=True, silent=True) or {}
    items = body.get("items", [])
    
    q = get_queue()
    succeeded = 0
    failed = []

    for row in items:
        try:
            roll = (row.get("roll_no") or "").strip().upper()
            company = (row.get("company") or "").strip()
            role = (row.get("role") or "").strip()
            package = float(row.get("package_offered") or 0)
            joining_s = (row.get("joining_date") or "").strip()

            if not roll or not company or not role or package <= 0:
                raise ValueError("Invalid row data")

            student = Student.query.filter_by(roll_no=roll).first()
            if not student:
                raise ValueError(f"No student with roll_no {roll}")

            joining = None
            if joining_s:
                try: joining = datetime.strptime(joining_s, "%Y-%m-%d").date()
                except: pass

            existing = Placement.query.filter_by(student_id=student.id, company_name=company, role=role).first()
            if existing:
                raise ValueError("Duplicate")

            placement = Placement(
                student_id=student.id, company_name=company, role=role,
                package_offered=package, joining_date=joining, source="csv",
            )
            db.session.add(placement)

            if not student.current_offer_package or package > student.current_offer_package:
                student.current_offer_package = package

            payload = {
                "student_id": student.id,
                "title": f"🎉 Placed at {company}",
                "message": f"Congratulations! You've been selected as {role}.",
                "kind": "success", "link": "profile",
            }
            if q: q.produce(payload)
            else: db.session.add(Notification(**payload))
            succeeded += 1
        except Exception as e:
            failed.append(str(e))

    db.session.commit()
    return jsonify({"imported": succeeded, "skipped": failed})