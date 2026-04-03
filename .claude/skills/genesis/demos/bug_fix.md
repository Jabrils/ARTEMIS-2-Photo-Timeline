# Demo: Fix a Production Bug

**Pipeline**: Reactive (incident → investigate → rca-bugfix → plan → rca-fix → review)
**Duration**: ~20 minutes
**Stack**: Python / stdlib threading
**Difficulty**: Intermediate

## Project Description

A concurrent job processor that processes items from a shared queue using a thread pool. The processor has a known intermittent bug — the completed job count is sometimes wrong after processing, causing flaky test failures.

The bug: Multiple worker threads increment a shared `completed_count` integer without synchronization. This is a classic read-modify-write race condition.

## Scaffold Files

<!-- file: pyproject.toml -->
```toml
[project]
name = "job-processor"
version = "0.1.0"
requires-python = ">=3.11"

[dependency-groups]
dev = ["pytest>=8.0"]
```

<!-- file: src/__init__.py -->
```python
```

<!-- file: src/processor.py -->
```python
"""Job processor — coordinates workers to process jobs from a queue."""

import time
from src.queue import JobQueue
from src.worker import Worker


class JobProcessor:
    def __init__(self, num_workers=8):
        self.num_workers = num_workers
        self.completed_count = 0
        self.queue = JobQueue()

    def record_completion(self):
        """Record that a job has been completed."""
        current = self.completed_count
        time.sleep(0)  # Yield to other threads (simulates real work)
        self.completed_count = current + 1

    def process_all(self, jobs):
        """Process all jobs using a thread pool."""
        for job in jobs:
            self.queue.put(job)

        workers = []
        for _ in range(self.num_workers):
            w = Worker(self.queue, self)
            w.start()
            workers.append(w)

        for w in workers:
            w.join()

        return self.completed_count
```

<!-- file: src/queue.py -->
```python
"""Thread-safe job queue."""

import queue


class JobQueue:
    def __init__(self):
        self._q = queue.Queue()

    def put(self, item):
        self._q.put(item)

    def get(self, timeout=1.0):
        try:
            return self._q.get(timeout=timeout)
        except queue.Empty:
            return None

    def task_done(self):
        self._q.task_done()

    def empty(self):
        return self._q.empty()
```

<!-- file: src/worker.py -->
```python
"""Worker thread — processes jobs from the queue."""

import threading


class Worker(threading.Thread):
    def __init__(self, job_queue, processor):
        super().__init__(daemon=True)
        self.job_queue = job_queue
        self.processor = processor

    def run(self):
        while True:
            job = self.job_queue.get()
            if job is None:
                break
            # "Process" the job (simulate work)
            _ = job.upper() if isinstance(job, str) else str(job)
            self.processor.record_completion()
            self.job_queue.task_done()
```

<!-- file: tests/test_processor.py -->
```python
"""Tests for job processor."""

from src.processor import JobProcessor


def test_process_all_completes_all_jobs():
    """All jobs should be processed and counted."""
    processor = JobProcessor(num_workers=8)
    jobs = [f"job-{i}" for i in range(100)]
    result = processor.process_all(jobs)
    assert result == 100, f"Expected 100 completed, got {result}"


def test_process_single_job():
    """A single job should process correctly."""
    processor = JobProcessor(num_workers=1)
    result = processor.process_all(["single-job"])
    assert result == 1


def test_process_empty_queue():
    """Processing an empty queue should return 0."""
    processor = JobProcessor(num_workers=2)
    result = processor.process_all([])
    assert result == 0
```

<!-- file: README.md -->
```markdown
# Job Processor

A concurrent job processor using Python threading.

## Quick Start

1. `uv sync` to install dependencies
2. `uv run pytest` to run tests (note: some tests may fail intermittently)

## Known Issue

The test `test_process_all_completes_all_jobs` fails intermittently. The completed count is sometimes less than the number of jobs submitted.

## What's Next

Open `DEMO_WALKTHROUGH.md` for a guided tour of fixing this bug with Wrought.
```

## Walkthrough

<!-- walkthrough -->

# Demo Walkthrough: Fix a Production Bug

**Pipeline**: Reactive
**Goal**: Find and fix a race condition in the job processor using the Wrought reactive pipeline.

## Step 0: Reproduce the Bug

Run the tests a few times to see the flaky failure:
```
uv sync && uv run pytest -v
```

You should see `test_process_all_completes_all_jobs` fail intermittently with a message like "Expected 100 completed, got 93".

## Step 1: Report the Incident

Run:
```
/incident "Flaky test failures in job processor — completed_count is sometimes less than expected after processing 100 jobs across 8 worker threads"
```

This documents the incident with symptoms and timeline.

## Step 2: Investigate

Run:
```
/investigate
```

The investigation skill will analyze the codebase, identify the race condition in `processor.py`, and produce an investigation report.

## Step 3: Root Cause Analysis + Fix Specification

Run:
```
/rca-bugfix
```

This produces an RCA report identifying the root cause (unsynchronized read-modify-write on `completed_count`) and specifies the fix (add `threading.Lock`).

## Step 4: Create the Fix Plan

Run:
```
/plan
```

This enters plan mode and creates a step-by-step fix plan.

## Step 5: Implement the Fix

Run:
```
/wrought-rca-fix
```

This starts the autonomous fix loop. Wrought will apply the fix and verify tests pass consistently.

## Step 6: Review

Run:
```
/forge-review --scope=diff
```

This reviews the fix for quality and completeness.

## Done!

You've just fixed a concurrency bug using the Wrought reactive pipeline. The root cause, fix, and verification are all tracked in your Findings Tracker.
<!-- /walkthrough -->
