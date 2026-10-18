"""Bounded producer-consumer queue. Admin status changes enqueue
notifications; a single daemon thread consumes and writes to the DB."""
import threading
from collections import deque


class NotificationQueue:
    def __init__(self, capacity=64):
        self.capacity = capacity
        self._buffer = deque()
        self._mutex = threading.Lock()
        self._not_empty = threading.Condition(self._mutex)
        self._not_full = threading.Condition(self._mutex)
        self.produced = 0
        self.consumed = 0
        self.dropped = 0
        self._stop = False
        self._worker = None

    def start(self, worker_fn):
        self._worker = threading.Thread(
            target=self._run, args=(worker_fn,), daemon=True
        )
        self._worker.start()

    def stop(self):
        self._stop = True
        with self._mutex:
            self._not_empty.notify_all()

    def enqueue(self, item):
        with self._mutex:
            if len(self._buffer) >= self.capacity:
                self.dropped += 1
                return False
            self._buffer.append(item)
            self.produced += 1
            self._not_empty.notify()
            return True

    def _run(self, worker_fn):
        while not self._stop:
            with self._mutex:
                while not self._buffer and not self._stop:
                    self._not_empty.wait(timeout=0.5)
                if not self._buffer:
                    continue
                item = self._buffer.popleft()
                self.consumed += 1
                self._not_full.notify()
            try:
                worker_fn(item)
            except Exception:
                pass

    def stats(self):
        with self._mutex:
            return {
                "capacity": self.capacity,
                "current_size": len(self._buffer),
                "produced": self.produced,
                "consumed": self.consumed,
                "dropped": self.dropped,
                "worker_alive": self._worker.is_alive() if self._worker else False,
            }


notification_queue = NotificationQueue(capacity=64)