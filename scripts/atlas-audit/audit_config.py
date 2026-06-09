"""
ATLAS-WB Audit — Shared config and helpers for retroactive era auditing.
"""

import json, os, sys
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional

GATHER_WEB = Path(__file__).resolve().parent.parent.parent
ATLAS_WB = Path(r"A:\Projects\obsidian\WOM\New Upgrade\ATLAS-WB-Cognitive-System")

SPECS_DIR = ATLAS_WB / "specs"
OUTPUT_DIR = ATLAS_WB / "websites" / "gather-audit"
LEDGER_PATH = ATLAS_WB / "tracking" / "BUILD_LEDGER.jsonl"
DEEPEN_PATH = ATLAS_WB / "tracking" / "DEEPEN_QUEUE.json"

def load_spec(era_num: int) -> dict:
    matches = list(SPECS_DIR.glob(f"era_{era_num:02d}_*_spec.json"))
    if not matches:
        return {"era": era_num, "name": f"Era {era_num:02d}", "agents": 0, "gate": {}, "confidence_rubric": {}}
    with open(matches[0]) as f:
        return json.load(f)

def load_json(rel_path: str) -> dict:
    full = GATHER_WEB / rel_path
    if not full.exists():
        return {}
    with open(full) as f:
        return json.load(f)

def append_ledger(event: str, detail: str, era: int, client: str = "gather-audit"):
    entry = {
        "event": event,
        "ts": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "system": "ATLAS-WB-Audit",
        "detail": detail,
        "client": client,
        "era": era,
        "actor": "atlas-audit",
    }
    LEDGER_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(LEDGER_PATH, "a") as f:
        f.write(json.dumps(entry) + "\n")

def queue_deepen(era: Optional[int], agent: Optional[str], description: str, confidence_before: Optional[float]):
    items = []
    if DEEPEN_PATH.exists():
        with open(DEEPEN_PATH) as f:
            items = json.load(f).get("items", [])
    items.append({
        "id": f"DEEPEN-AUDIT-{len(items)+1:03d}",
        "era": era,
        "agent": agent,
        "description": description,
        "source": "gather-audit",
        "confidence_before": confidence_before,
        "confidence_after": None,
        "status": "OPEN",
        "created": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    })
    with open(DEEPEN_PATH, "w") as f:
        json.dump({"_doc": "THOTH DEEPEN organ — improvement backlog", "system": "ATLAS-WB-Cognitive-System", "items": items, "rules": {}}, f, indent=2)

def make_audit_path(era_num: int, suffix: str = "audit") -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    return OUTPUT_DIR / f"{era_num:02d}_{suffix}.md"

def gate_result_from_checks(gate: dict, checks: dict) -> dict:
    raw_conditions = gate.get("conditions", [])
    results = []
    matched_any = False
    for cond in raw_conditions:
        key = cond.lower().replace(" ", "_").replace(".", "").replace("-", "_").replace(",", "").replace("/", "_")[:50]
        if key in checks:
            passed = checks[key]
            matched_any = True
        else:
            passed = checks.get(cond, None)
            if passed is not None:
                matched_any = True
        if passed is not None:
            results.append({"condition": cond, "passed": passed})
    if not matched_any:
        for k, v in checks.items():
            results.append({"condition": k.replace("_", " ").title(), "passed": v})
    passed_count = sum(1 for r in results if r["passed"])
    total = len(results) if results else 1
    score = (passed_count / total) * 100 if results else 0
    return {
        "gate": gate.get("name", "Unknown"),
        "passed": passed_count == total and score >= 60,
        "score": score,
        "checks": results,
    }
