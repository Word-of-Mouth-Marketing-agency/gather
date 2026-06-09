"""
ATLAS-WB Retroactive Audit — Full Orchestrator
Runs all 10 era audits against gather-web, prints summary, logs to ledger.
"""

import sys, json
from pathlib import Path
from datetime import datetime, timezone
from audit_config import ATLAS_WB, LEDGER_PATH, DEEPEN_PATH

sys.path.insert(0, str(Path(__file__).parent))

from era_01_audit import run_audit as audit_01
from era_02_audit import run_audit as audit_02
from era_03_audit import run_audit as audit_03
from era_04_audit import run_audit as audit_04
from era_05_audit import run_audit as audit_05
from era_06_audit import run_audit as audit_06
from era_07_audit import run_audit as audit_07
from era_08_audit import run_audit as audit_08
from era_09_audit import run_audit as audit_09
from era_10_audit import run_audit as audit_10


def run_all():
    auditors = [audit_01, audit_02, audit_03, audit_04, audit_05,
                audit_06, audit_07, audit_08, audit_09, audit_10]

    results = []
    for i, auditor in enumerate(auditors, 1):
        print(f"\n{'='*60}")
        print(f"ERA {i:02d} / 10")
        print(f"{'='*60}")
        try:
            result = auditor()
            results.append(result)
            print(f"  >> Gate: {result['gate']}: {'PASS' if result['passed'] else 'FAIL'} ({result['score']:.0f}%)")
            print(f"  >> Confidence: {result['confidence']:.1f}/100")
        except Exception as e:
            print(f"  >> ERROR: {e}")
            results.append({"era": i, "gate": f"Era {i:02d}", "passed": False, "score": 0, "confidence": 0})

    passed = sum(1 for r in results if r["passed"])
    total = len(results)
    avg_confidence = sum(r["confidence"] for r in results) / total if total else 0

    print(f"\n{'='*60}")
    print(f"AUDIT COMPLETE: {passed}/{total} eras passed")
    print(f"Average Confidence: {avg_confidence:.1f}/100")
    print(f"{'='*60}")
    print(f"\n{'ERA':>5} {'GATE':<40} {'RESULT':<6} {'SCORE':<6} {'CONFIDENCE':<10}")
    print(f"{'-'*70}")
    for r in results:
        status = "PASS" if r["passed"] else "FAIL"
        print(f"{r['era']:>5} {r['gate']:<40} {status:<6} {r['score']:<6.0f} {r['confidence']:<10.1f}")

    summary = {
        "system": "ATLAS-WB-Audit",
        "target": "gather-web",
        "run_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "passed": passed,
        "total": total,
        "avg_confidence": round(avg_confidence, 1),
        "results": results,
    }

    summary_path = ATLAS_WB / "websites" / "gather-audit" / "audit_summary.json"
    summary_path.write_text(json.dumps(summary, indent=2))
    print(f"\nSummary written to: {summary_path}")

    # Print deepen queue
    if DEEPEN_PATH.exists():
        with open(DEEPEN_PATH) as f:
            deepen = json.load(f)
        open_items = [i for i in deepen.get("items", []) if i.get("status") == "OPEN"]
        if open_items:
            print(f"\nDEEPEN_QUEUE: {len(open_items)} open items")
            for item in open_items:
                print(f"  [{item.get('era') or '??'}] {item['description'][:80]}")

    return summary


if __name__ == "__main__":
    run_all()
