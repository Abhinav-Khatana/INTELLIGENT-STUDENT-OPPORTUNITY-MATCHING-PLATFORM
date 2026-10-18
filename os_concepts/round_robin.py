"""OS CONCEPT: Round Robin (CPU Scheduling).

Distributes interview slots evenly across companies: one turn per
company per round, cycling until every application is scheduled.
Prevents a single recruiter from occupying every interview slot.

Maps to PPT syllabus: 'CPU Scheduling' — the third named algorithm
alongside FCFS and Priority.
"""
from collections import defaultdict, deque


class RoundRobinScheduler:
    name = "Round Robin"
    description = "Even distribution across companies, quantum = 1"

    def __init__(self, quantum: int = 1):
        self.quantum = quantum

    def schedule(self, applications: list) -> list:
        groups: dict[int, deque] = defaultdict(deque)
        for a in applications:
            groups[a.opportunity.company_id].append(a)

        order = []
        company_ids = list(groups.keys())
        while any(groups[c] for c in company_ids):
            for c in company_ids:
                for _ in range(self.quantum):
                    if groups[c]:
                        order.append(groups[c].popleft())
        return order