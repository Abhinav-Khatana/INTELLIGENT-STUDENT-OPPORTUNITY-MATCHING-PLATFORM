"""OS concept implementations for the CareerLink / PIMS project.

Each concept lives in its own module:

    mutex.py              → Mutual Exclusion + Synchronization
    producer_consumer.py  → Process Management + Producer–Consumer
    fcfs.py               → FCFS Scheduling
    priority.py           → Priority Scheduling
    round_robin.py        → Round Robin (CPU Scheduling)
    dispatcher.py         → CPU Scheduling facade

See README_OS.md for the mapping to the PBL syllabus.
"""
from .mutex import ApplicationMutex, application_mutex
from .producer_consumer import NotificationQueue, init_notification_queue, get_queue
from .dispatcher import InterviewScheduler
from .fcfs import FCFSScheduler
from .priority import PriorityScheduler
from .round_robin import RoundRobinScheduler

__all__ = [
    "ApplicationMutex", "application_mutex",
    "NotificationQueue", "init_notification_queue", "get_queue",
    "InterviewScheduler",
    "FCFSScheduler", "PriorityScheduler", "RoundRobinScheduler",
]