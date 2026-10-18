"""OS CONCEPT: Mutual Exclusion + Synchronization.

A per-student lock guarantees that two concurrent apply() requests
from the same student cannot both pass the eligibility check and
insert a row (the classic check-then-act race condition).

Two students applying in parallel still run in parallel — each gets
their own lock. Only requests for the same student serialize.

Maps to PPT syllabus: 'Synchronization', 'Mutual Exclusion'.
"""
from __future__ import annotations

import threading
from contextlib import contextmanager


class ApplicationMutex:
    """Per-key (per-student) mutex."""

    def __init__(self):
        self._locks: dict[int, threading.Lock] = {}
        self._guard = threading.Lock()   # protects the _locks dict itself
        self._contentions = 0            # instrumentation for the demo

    def _get_lock(self, key: int) -> threading.Lock:
        with self._guard:
            if key not in self._locks:
                self._locks[key] = threading.Lock()
            return self._locks[key]

    @contextmanager
    def acquire(self, key: int, timeout: float = 5.0):
        """Enter the critical section for a given student id."""
        lock = self._get_lock(key)
        acquired = lock.acquire(timeout=timeout)
        if not acquired:
            self._contentions += 1
            raise TimeoutError(
                f"Could not acquire application lock for student {key} "
                f"within {timeout}s — another request is in flight."
            )
        try:
            yield
        finally:
            lock.release()

    @property
    def active_locks(self) -> int:
        return len(self._locks)

    @property
    def total_contentions(self) -> int:
        return self._contentions


# Module-level singleton — imported by routes_student.py
application_mutex = ApplicationMutex()