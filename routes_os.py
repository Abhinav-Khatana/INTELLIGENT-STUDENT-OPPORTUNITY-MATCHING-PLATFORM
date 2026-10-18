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