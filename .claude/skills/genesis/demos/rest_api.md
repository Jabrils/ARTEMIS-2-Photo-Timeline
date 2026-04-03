# Demo: Build a REST API

**Pipeline**: Proactive (finding → design → blueprint → plan → implement → review)
**Duration**: ~30 minutes
**Stack**: Python / FastAPI / SQLite
**Difficulty**: Beginner

## Project Description

A task management REST API with CRUD endpoints. Users can create, read, update, and delete tasks. Each task has a title, description, status (todo/in_progress/done), and timestamps.

## Scaffold Files

<!-- file: pyproject.toml -->
```toml
[project]
name = "task-api"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.115",
    "uvicorn>=0.34",
]

[dependency-groups]
dev = ["pytest>=8.0", "httpx>=0.28"]

[project.scripts]
serve = "src.main:start"
```

<!-- file: src/__init__.py -->
```python
```

<!-- file: src/main.py -->
```python
"""Task Management API — starter scaffold."""

from fastapi import FastAPI

app = FastAPI(title="Task API", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok"}


def start():
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
```

<!-- file: README.md -->
```markdown
# Task Management API

A REST API for managing tasks. Built with Wrought.

## Quick Start

1. `uv sync` to install dependencies
2. `uv run serve` to start the dev server
3. Visit http://localhost:8000/health

## What's Next

Open `DEMO_WALKTHROUGH.md` for a guided tour of building this API with Wrought.
```

## Walkthrough

<!-- walkthrough -->

# Demo Walkthrough: Build a REST API

**Pipeline**: Proactive
**Goal**: Build a complete CRUD API for task management using the Wrought proactive pipeline.

## Step 1: Create a Finding

Run:
```
/finding
```

When prompted, describe: "Task API needs CRUD endpoints (create, read, update, delete) for task management. Each task has title, description, status, and timestamps. Need SQLite storage and proper error handling."

This creates a Findings Tracker to track the work.

## Step 2: Design the Architecture

Run:
```
/design tradeoff "REST API architecture for task management service"
```

The design skill will research approaches and recommend an architecture. Follow the interactive checkpoints.

## Step 3: Create the Blueprint

Run:
```
/blueprint
```

This creates an implementation specification with acceptance criteria from the design.

## Step 4: Create the Plan

Run:
```
/plan
```

This enters plan mode and creates a step-by-step implementation plan.

## Step 5: Implement

Run:
```
/wrought-implement
```

This starts the autonomous implementation loop. Wrought will implement the plan and verify with tests.

## Step 6: Review

Run:
```
/forge-review --scope=diff
```

This runs a multi-agent code review on your changes.

## Done!

You've just built a REST API using the Wrought proactive pipeline. Every step is tracked in your Findings Tracker.
<!-- /walkthrough -->
