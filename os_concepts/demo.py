"""Standalone demonstration — run with:

    python -m os_concepts.demo

Executes all six OS concepts on fake data and prints the results.
Useful for a PBL viva: no Flask, no DB, just the concepts running.
"""
import queue
import threading
import time

from .mutex import ApplicationMutex
from .dispatcher import InterviewScheduler


def demo_mutex():
    print("\n[1] MUTUAL EXCLUSION — per-student lock")
    mutex = ApplicationMutex()
    results = []

    def worker(tag):
        try:
            with mutex.acquire(42, timeout=2):
                results.append(f"{tag} ENTERED critical section")
                time.sleep(0.2)
                results.append(f"{tag} LEFT")
        except TimeoutError:
            results.append(f"{tag} BLOCKED (timeout)")

    t1 = threading.Thread(target=worker, args=("T1",))
    t2 = threading.Thread(target=worker, args=("T2",))
    t1.start(); time.sleep(0.05); t2.start()
    t1.join(); t2.join()
    for line in results:
        print("   ", line)
    print(f"    active locks: {mutex.active_locks}")


def demo_producer_consumer():
    print("\n[2] PRODUCER–CONSUMER — bounded buffer (size 3)")
    buf: queue.Queue = queue.Queue(maxsize=3)
    consumed = []

    def consumer():
        while True:
            item = buf.get()
            if item is None:
                break
            consumed.append(item)
            buf.task_done()

    c = threading.Thread(target=consumer, daemon=True)
    c.start()

    for i in range(6):
        try:
            buf.put(f"notif-{i}", timeout=1)
            print(f"    produced notif-{i}  (buffered={buf.qsize()})")
        except queue.Full:
            print(f"    producer BLOCKED on notif-{i}")

    buf.put(None)
    c.join(timeout=2)
    print(f"    consumed: {consumed}")


def demo_schedulers():
    print("\n[3] SCHEDULERS — FCFS / Priority / Round Robin")

    class FStudent:
        def __init__(self, sid, cgpa, bl): self.id, self.cgpa, self.backlog_count = sid, cgpa, bl
        def __repr__(self): return f"S{self.id}(cgpa={self.cgpa},bl={self.backlog_count})"

    class FOpp:
        def __init__(self, oid, cid): self.id, self.company_id = oid, cid

    class FApp:
        def __init__(self, sid, cgpa, bl, cid, order):
            self.student = FStudent(sid, cgpa, bl)
            self.opportunity = FOpp(order, cid)
            self.application_date = order
        def __repr__(self):
            return f"{self.student} @company{self.opportunity.company_id} arrive#{self.application_date}"

    apps = [
        FApp(1, 8.5, 0, cid=100, order=3),
        FApp(2, 9.2, 0, cid=100, order=1),
        FApp(3, 7.1, 2, cid=200, order=2),
        FApp(4, 8.9, 1, cid=200, order=4),
        FApp(5, 6.5, 0, cid=300, order=5),
    ]

    for sched in InterviewScheduler.POLICIES.values():
        print(f"\n    Policy: {sched.name} — {sched.description}")
        for a in sched.schedule(apps):
            print(f"      {a}")


if __name__ == "__main__":
    print("=" * 62)
    print("  CareerLink — OS Concepts Demonstration")
    print("=" * 62)
    demo_mutex()
    demo_producer_consumer()
    demo_schedulers()
    print("\n" + "=" * 62)
    print("  All six concepts demonstrated.")
    print("=" * 62)