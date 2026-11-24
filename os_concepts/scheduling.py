"""CPU scheduling algorithms applied to shortlisted interview applications.
- FCFS, SJF, Priority (non-preemptive), Round Robin (preemptive)."""


def _gantt_row(pid, student, start, end, **extra):
    row = {"pid": pid, "student": student, "start": start, "end": end}
    row.update(extra)
    return row


def fcfs(procs):
    procs = sorted(procs, key=lambda p: p["arrival"])
    t, gantt, wait = 0, [], 0
    for p in procs:
        wait += max(0, t - p["arrival"])
        gantt.append(_gantt_row(p["pid"], p["student"], t, t + p["burst"]))
        t += p["burst"]
    return {"algorithm": "FCFS", "gantt": gantt,
            "avg_wait": round(wait / len(procs), 2) if procs else 0}


def sjf(procs):
    procs = sorted(procs, key=lambda p: (p["burst"], p["arrival"]))
    t, gantt, wait = 0, [], 0
    for p in procs:
        wait += max(0, t - p["arrival"])
        gantt.append(_gantt_row(p["pid"], p["student"], t, t + p["burst"]))
        t += p["burst"]
    return {"algorithm": "SJF", "gantt": gantt,
            "avg_wait": round(wait / len(procs), 2) if procs else 0}


def priority(procs):
    procs = sorted(procs, key=lambda p: (p["priority"], p["arrival"]))
    t, gantt, wait = 0, [], 0
    for p in procs:
        wait += max(0, t - p["arrival"])
        gantt.append(_gantt_row(p["pid"], p["student"], t, t + p["burst"],
                                priority=p["priority"]))
        t += p["burst"]
    return {"algorithm": "Priority", "gantt": gantt,
            "avg_wait": round(wait / len(procs), 2) if procs else 0}


def round_robin(procs, quantum=2):
    from collections import deque
    queue = deque(procs)
    t, gantt = 0, []
    remaining = {p["pid"]: p["burst"] for p in procs}
    while queue:
        p = queue.popleft()
        run = min(quantum, remaining[p["pid"]])
        gantt.append(_gantt_row(p["pid"], p["student"], t, t + run))
        t += run
        remaining[p["pid"]] -= run
        if remaining[p["pid"]] > 0:
            queue.append(p)
    wait = 0
    for p in procs:
        finishes = [g["end"] for g in gantt if g["pid"] == p["pid"]]
        finish = max(finishes) if finishes else t
        wait += finish - p["arrival"] - p["burst"]
    return {"algorithm": f"Round Robin (q={quantum})", "gantt": gantt,
            "avg_wait": round(wait / len(procs), 2) if procs else 0}