#!/usr/bin/env python3
"""Wrought statusline: displays context + cost, writes bridge file for hooks."""

import json
import os
import sys
import time

data = json.load(sys.stdin)

# Extract fields with null-safe defaults
model = data.get("model", {}).get("display_name", "?")
pct_raw = data.get("context_window", {}).get("used_percentage")
pct = int(pct_raw) if pct_raw is not None else None
remaining = data.get("context_window", {}).get("remaining_percentage")
cost = data.get("cost", {}).get("total_cost_usd", 0) or 0
session_id = data.get("session_id", "")
ctx_size = data.get("context_window", {}).get("context_window_size", 200000)
model_id = data.get("model", {}).get("id", "")

# Compute effective percentage from all token types
cu = data.get("context_window", {}).get("current_usage", {})
input_tok = cu.get("input_tokens", 0)
output_tok = cu.get("output_tokens", 0)
cache_create = cu.get("cache_creation_input_tokens", 0)
cache_read = cu.get("cache_read_input_tokens", 0)

if ctx_size > 0 and (input_tok + output_tok + cache_create + cache_read) > 0:
    total_tokens = input_tok + output_tok + cache_create + cache_read
    effective_pct = min(100, int(total_tokens * 100 / ctx_size))
else:
    effective_pct = pct if pct is not None else 0  # Fallback to platform-reported

# Write bridge file (only when we have valid data)
if pct is not None:
    bridge_dir = os.path.join(data.get("cwd", "."), ".claude", "bridge")
    os.makedirs(bridge_dir, exist_ok=True)
    bridge = {
        "used_percentage": pct,
        "effective_pct": effective_pct,
        "remaining_percentage": int(remaining) if remaining is not None else None,
        "session_id": session_id,
        "context_window_size": ctx_size,
        "model": model_id,
        "timestamp": time.time(),
    }
    bridge_path = os.path.join(bridge_dir, "context-bridge.json")
    with open(bridge_path, "w") as f:
        json.dump(bridge, f)

    # Append to diagnostic log
    log_path = os.path.join(bridge_dir, "context-history.log")
    ts = time.strftime("%Y-%m-%dT%H:%M:%S")
    with open(log_path, "a") as f:
        f.write(f"{ts},{pct},{effective_pct}\n")

# Display statusline — use effective_pct for bar and color thresholds
display_pct = effective_pct

# Color thresholds: green <50%, yellow 50-64%, red 65%+
GREEN, YELLOW, RED, RESET = "\033[32m", "\033[33m", "\033[31m", "\033[0m"
if display_pct >= 65:
    color = RED
elif display_pct >= 50:
    color = YELLOW
else:
    color = GREEN

filled = display_pct * 10 // 100
bar = "\u2593" * filled + "\u2591" * (10 - filled)

print(f"[{model}] {color}{bar} {display_pct}%{RESET} | ${cost:.2f}")
