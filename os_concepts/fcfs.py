"""OS CONCEPT: FCFS (First-Come, First-Serve) Scheduling.

Applications are reviewed in arrival order. Simple, fair,
non-preemptive — the classic baseline policy.

Maps to PPT syllabus: 'FCFS'.
"""


class FCFSScheduler:
    name = "FCFS"
    description = "First-Come, First-Serve — applications in arrival order"

    def schedule(self, applications: list) -> list:
        return sorted(applications, key=lambda a: a.application_date)