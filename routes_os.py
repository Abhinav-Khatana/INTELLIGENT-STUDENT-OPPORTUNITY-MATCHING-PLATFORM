from flask import request
from extensions import db
from models import Application
from os_concepts.scheduling import fcfs, sjf, priority, round_robin


def _apps_as_procs(applications):
    return [{
        "id": a.id,
        "student": a.student.name,
        "arrival": 0,
        "burst": 1,
        "priority": int(10 - (a.student.cgpa or 0)),
    } for a in applications]


@os_bp.get("/schedule")
@require_auth("admin")
def schedule():
    algo = request.args.get("algo", "fcfs").lower()
    q    = int(request.args.get("q", 2))
    apps = Application.query.filter(
        Application.status.in_(["Shortlisted", "Interview"])
    ).all()
    procs = _apps_as_procs(apps)
    if not procs:
        return jsonify({
            "error": "No shortlisted/interview applications to schedule"
        }), 400
    if algo == "rr":
        result = round_robin(procs, q)
    elif algo == "sjf":
        result = sjf(procs)
    elif algo == "priority":
        result = priority(procs)
    else:
        result = fcfs(procs)
    return jsonify(result)
"""OS-concept demo/stats endpoints."""
from flask import Blueprint, jsonify
from auth import require_auth
from os_concepts.mutex import apply_mutex

os_bp = Blueprint("os", __name__, url_prefix="/api/os")


@os_bp.get("/stats")
@require_auth("admin")
def stats():
    return jsonify({
        "mutex": apply_mutex.stats(),
        "queue": notification_queue.stats(),
    })

from os_concepts.notification_queue import notification_queue

@os_bp.get("/queue")
@require_auth("admin")
def queue_stats():
    return jsonify(notification_queue.stats())