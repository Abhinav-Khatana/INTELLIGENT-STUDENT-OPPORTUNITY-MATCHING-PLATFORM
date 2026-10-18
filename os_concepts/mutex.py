"""Counting semaphore. Used to serialise critical sections
(specifically, the double-apply race on POST /api/applications)."""
import threading
import time
from contextlib import contextmanager


class Semaphore:
    def __init__(self, capacity=1, name="sem"):
        self.capacity = capacity
        self.name = name
        self._available = capacity
        self._cond = threading.Condition()
        self.wait_count = 0
        self.acquired_count = 0
        self.total_wait_time = 0.0

    @contextmanager
    def acquire(self, timeout=5.0):
        start = time.time()
        acquired = False
        with self._cond:
            while self._available <= 0:
                self.wait_count += 1
                if not self._cond.wait(timeout=timeout):
                    raise TimeoutError(f"{self.name}: acquire timed out")
            self._available -= 1
            self.acquired_count += 1
            acquired = True
        try:
            yield
        finally:
            if acquired:
                with self._cond:
                    self._available += 1
                    self.total_wait_time += (time.time() - start)
                    self._cond.notify()

    def stats(self):
        with self._cond:
            return {
                "name": self.name,
                "capacity": self.capacity,
                "available": self._available,
                "in_use": self.capacity - self._available,
                "waits": self.wait_count,
                "acquired": self.acquired_count,
                "avg_wait_ms": round(
                    (self.total_wait_time / self.acquired_count) * 1000, 2
                ) if self.acquired_count else 0.0,
            }


# Process-wide mutex protecting the "check-then-insert" sequence in apply().
apply_mutex = Semaphore(capacity=1, name="apply_mutex")