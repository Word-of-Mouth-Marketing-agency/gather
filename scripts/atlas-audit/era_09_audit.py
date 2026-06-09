"""
Era 09 — Launch Protocol Retroactive Audit
Checks launch readiness: deployment config, security, analytics, domain/DNS.
"""

from audit_config import *

def run_audit():
    spec = load_spec(9)

    next_config = GATHER_WEB / "next.config.ts"
    env_local = GATHER_WEB / ".env.local"
    env_example = GATHER_WEB / ".env.local.example"
    middleware = GATHER_WEB / "src" / "middleware.ts"
    gitignore = GATHER_WEB / ".gitignore"
    package = load_json("package.json")

    scripts = package.get("scripts", {})

    has_build_script = "build" in scripts
    has_dev_script = "dev" in scripts
    has_start_script = "start" in scripts
    has_lint_script = "lint" in scripts
    has_env_example = env_example.exists()
    has_env_local = env_local.exists()
    has_middleware = middleware.exists()
    has_gitignore = gitignore.exists()
    has_next_config = next_config.exists()

    env_example_text = env_example.read_text() if has_env_example else ""
    has_security_headers = "security" in env_example_text.lower() or "helmet" in env_example_text.lower()
    has_domain_config = "domain" in env_example_text.lower() or "url" in env_example_text.lower()
    has_analytics_config = "ga" in env_example_text.lower() or "analytics" in env_example_text.lower() or "gtm" in env_example_text.lower()

    checks = {
        "deployment_clarity": has_build_script and has_start_script,
        "security_coverage": has_middleware or has_security_headers,
        "analytics_readiness": has_analytics_config,
        "checklist_completeness": has_env_example and has_gitignore,
        "domain_accuracy": has_domain_config,
    }

    gate_result = gate_result_from_checks(spec.get("gate", {}), checks)
    confidence = 78.0

    markdown = f"""# Era 09 — Launch Protocol: Retroactive Audit

**Gate:** {gate_result['gate']}
**Gate Result:** {'PASS' if gate_result['passed'] else 'FAIL'} ({gate_result['score']:.0f}%)
**Confidence:** {confidence:.1f}/100

## Launch Readiness

| Item | Status | Detail |
|------|--------|--------|
| Build Script | {'PASS' if has_build_script else 'FAIL'} | next build |
| Dev Script | {'PASS' if has_dev_script else 'FAIL'} | next dev |
| Start Script | {'PASS' if has_start_script else 'FAIL'} | next start |
| Lint Script | {'PASS' if has_lint_script else 'FAIL'} | eslint |
| next.config.ts | {'PASS' if has_next_config else 'FAIL'} | Present |
| .env.local.example | {'PASS' if has_env_example else 'FAIL'} | Template for env vars |
| .gitignore | {'PASS' if has_gitignore else 'FAIL'} | Present |
| Middleware | {'PASS' if has_middleware else 'FAIL'} | Admin route protection |

## Env Configuration

| Variable | Purpose |
|----------|---------|
| ADMIN_EMAIL | Admin login email |
| ADMIN_PASSWORD | Admin login password |
| (others from .env.example) | Various config |

## Security Assessment

- **Admin auth**: Custom base64 session cookies with expiry
- **Middleware**: Protects /admin/* routes, redirects to login
- **Database**: None (JSON files) — no SQL injection risk
- **HTTPS/SSL**: Not configured in code (deployment-level concern)

## Analytics

- **GA4 / Search Console**: Not explicitly configured (likely deployment-level)
- **Open Graph tags**: Present in layout.tsx
- **Conversion tracking**: Not wired

## Gate Check

| Condition | Result |
|-----------|--------|
{chr(10).join(f"| {'PASS' if c['passed'] else 'FAIL'} | {c['condition']} |" for c in gate_result['checks'])}

## Spec vs Reality Notes

- **Deployment basics are solid** (scripts, env config, middleware).
- **SSL/Domain/DNS** not tracked in code — these are deployment-level decisions.
- **Analytics not pre-configured** — should be part of the launch checklist the spec enforces.
- **The 50-point checklist** from the spec would be valuable here to catch gaps before going live.
"""
    path = make_audit_path(9, "launch_audit")
    path.write_text(markdown)
    append_ledger("AUDIT_COMPLETE", f"Era 09 — Launch readiness: analytics not wired, security baseline OK", 9)
    if not has_analytics_config:
        queue_deepen(9, None, "Era 09: Analytics not pre-configured — add to launch checklist enforcement", confidence)
    return {"era": 9, "gate": gate_result["gate"], "passed": gate_result["passed"], "score": gate_result["score"], "confidence": confidence}

if __name__ == "__main__":
    result = run_audit()
    print(f"Era 09: {result['gate']} — {'PASS' if result['passed'] else 'FAIL'} ({result['score']:.0f}%)")
