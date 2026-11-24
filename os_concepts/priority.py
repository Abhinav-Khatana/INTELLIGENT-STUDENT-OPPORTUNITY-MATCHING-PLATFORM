"""OS CONCEPT: Priority Scheduling.

Higher-priority students surface first. Priority is computed from
CGPA minus a backlog penalty, and implemented with Python's heapq
(min-heap) — so we push negative scores so the largest pops first.

Maps to PPT syllabus: 'Priority Scheduling'.
"""
import heapq


class PriorityScheduler:
    name = "Priority"
    description = "Ranked by CGPA − 0.5 × backlogs"

    def __init__(self, cgpa_weight: float = 1.0, backlog_penalty: float = 0.5):
        self.cgpa_weight = cgpa_weight
        self.backlog_penalty = backlog_penalty

    def _priority(self, a) -> float:
        return (a.student.cgpa * self.cgpa_weight
                - a.student.backlog_count * self.backlog_penalty)

    def schedule(self, applications: list) -> list:
        heap = []
        for a in applications:
            # negative priority → highest priority pops first
            heapq.heappush(heap, (-self._priority(a), a.application_date, a))
        out = []
        while heap:
            _, _, a = heapq.heappop(heap)
            out.append(a)
        return out