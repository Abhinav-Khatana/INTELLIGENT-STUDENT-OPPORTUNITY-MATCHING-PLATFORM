"""OS CONCEPT: Process Management + Producer–Consumer.

A bounded in-memory queue sits between producers (admin actions that
want to emit notifications) and consumers (background worker threads
that write Notification rows to the DB).

Why this matters:
  - The HTTP request never blocks waiting for DB writes.
  - If the DB is slow or briefly down, requests still succeed.
  - If the queue fills up, produce() returns False (backpressure) —
    the request still succeeds, only the notification is dropped.

Maps to PPT syllabus: 'Process Management', and the report's
'BACKGROUND SERVICES → Notification Service' box.
"""
from __future__ import annotations

import queue
import threading


class NotificationQueue:
    def __init__(self, db, Notification, size: int = 200, workers: int = 2):
        self.q: queue.Queue = queue.Queue(maxsize=size)
        self.db = db
        self.Notification = Notification
        self.workers = workers
        self._threads: list[threading.Thread] = []
        self._stop = threading.Event()
        self._processed = 0
        self._dropped = 0
        self._lock = threading.Lock()

    def start(self, flask_app):
        """Spawn daemon worker threads. Call once at app boot."""
        if self._threads:
            return
        for i in range(self.workers):
            t = threading.Thread(
                target=self._worker, args=(flask_app,),
                daemon=True, name=f"notif-worker-{i}",
            )
            t.start()
            self._threads.append(t)
        print(f"[NotificationQueue] started {self.workers} worker thread(s), "
              f"buffer capacity {self.q.maxsize}")

    def stop(self):
        self._stop.set()
        for _ in self._threads:
            try:
                self.q.put_nowait(None)   # poison pill
            except queue.Full:
                pass

    def produce(self, payload: dict) -> bool:
        """Non-blocking. Returns False on backpressure."""
        try:
            self.q.put_nowait(payload)
            return True
        except queue.Full:
            with self._lock:
                self._dropped += 1
            return False

    def _worker(self, flask_app):
        while not self._stop.is_set():
            item = self.q.get()
            if item is None:
                self.q.task_done()
                break
            try:
                with flask_app.app_context():
                    self.db.session.add(self.Notification(**item))
                    self.db.session.commit()
                    with self._lock:
                        self._processed += 1
            except Exception as e:
                print(f"[NotificationQueue] worker error: {e}")
                try:
                    self.db.session.rollback()
                except Exception:
                    pass
            finally:
                self.q.task_done()

    @property
    def stats(self) -> dict:
        return {
            "buffered":  self.q.qsize(),
            "capacity":  self.q.maxsize,
            "workers":   self.workers,
            "processed": self._processed,
            "dropped":   self._dropped,
        }


# Singleton, initialized from app.py after `db` and `Notification` exist
notification_queue: NotificationQueue | None = None


def init_notification_queue(db, Notification, size: int = 200, workers: int = 2) -> NotificationQueue:
    global notification_queue
    notification_queue = NotificationQueue(db, Notification, size=size, workers=workers)
    return notification_queue


def get_queue() -> NotificationQueue | None:
    return notification_queue