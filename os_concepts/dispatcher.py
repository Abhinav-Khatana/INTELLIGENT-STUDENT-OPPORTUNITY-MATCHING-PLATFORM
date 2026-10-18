"""OS CONCEPT: CPU Scheduling facade.

The dispatcher is the 'CPU' — it routes each scheduling request to
the chosen policy (FCFS, Priority, or Round Robin). The admin picks
the policy, the dispatcher decides which application gets the next
interview slot.

Maps to PPT syllabus: 'CPU Scheduling'.
"""
from .fcfs import FCFSScheduler
from .priority import PriorityScheduler
from .round_robin import RoundRobinScheduler


class InterviewScheduler:
    POLICIES = {
        "fcfs":     FCFSScheduler(),
        "priority": PriorityScheduler(),
        "rr":       RoundRobinScheduler(),
    }

    @classmethod
    def list_policies(cls) -> list[dict]:
        return [
            {"key": k, "name": v.name, "description": v.description}
            for k, v in cls.POLICIES.items()
        ]

    @classmethod
    def schedule(cls, applications: list, policy: str = "fcfs") -> list:
        if policy not in cls.POLICIES:
            raise ValueError(
                f"Unknown policy '{policy}'. "
                f"Valid: {list(cls.POLICIES.keys())}"
            )
        return cls.POLICIES[policy].schedule(applications)