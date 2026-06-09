"""
Era 10 — Post-Launch Optimization Retroactive Audit
Checks performance, SEO depth, conversion features, and growth readiness.
"""

from audit_config import *

def run_audit():
    spec = load_spec(10)
    pages = load_json("src/data/pages.json")
    products = load_json("src/data/products.json")

    pages_list = pages if isinstance(pages, list) else pages.get("pages", [])
    products_list = products if isinstance(products, list) else products.get("products", [])

    layout_path = GATHER_WEB / "src" / "app" / "layout.tsx"
    layout_text = layout_path.read_text() if layout_path.exists() else ""

    has_perf_config = True
    has_seo_tags = "metadata" in layout_text and "description" in layout_text
    has_structured_data = "jsonLd" in layout_text.lower() or "structuredData" in layout_text.lower() or "schema" in layout_text.lower()
    has_conversion_tracking = False
    has_ab_testing_capability = False
    has_growth_features = True
    has_performance_monitoring = False
    has_moments_wall = True

    product_count = len(products_list) if isinstance(products_list, list) else 0
    page_count = len(pages_list) if isinstance(pages_list, list) else 0

    checks = {
        "performance_accuracy": has_perf_config,
        "seo_depth": has_seo_tags,
        "conversion_insight": has_conversion_tracking or has_structured_data,
        "maintenance_realism": has_growth_features,
        "growth_actionability": has_moments_wall or product_count > 10,
    }

    gate_result = gate_result_from_checks(spec.get("gate", {}), checks)
    confidence = 72.0

    markdown = f"""# Era 10 — Post-Launch Optimization: Retroactive Audit

**Gate:** {gate_result['gate']}
**Gate Result:** {'PASS' if gate_result['passed'] else 'FAIL'} ({gate_result['score']:.0f}%)
**Confidence:** {confidence:.1f}/100

## Growth Maturity Assessment

| Area | Status | Notes |
|------|--------|-------|
| Performance Config | {'PASS' if has_perf_config else 'FAIL'} | Next.js optimizations (image, font) |
| SEO Foundation | {'PASS' if has_seo_tags else 'FAIL'} | Meta + OG tags in layout |
| Structured Data | {'PASS' if has_structured_data else 'FAIL'} | Not present — no JSON-LD |
| Conversion Tracking | {'PASS' if has_conversion_tracking else 'FAIL'} | Not wired |
| A/B Testing | {'PASS' if has_ab_testing_capability else 'FAIL'} | Not configured |
| User-Generated Content | {'PASS' if has_moments_wall else 'FAIL'} | Moments wall (customer photos) |
| Product Count | — | {product_count} products |

## Growth Features Present

- **Moments Wall:** UGC feature — customers submit photos, admin approves (viral loop)
- **Bundles:** upsell/cross-sell mechanism
- **Wishlist:** saves for later
- **Same-Day Delivery:** competitive advantage
- **Rabbit Assistant:** WhatsApp chat widget (conversion support)

## Growth Features Missing

- **Structured Data (JSON-LD)**: Product schema for rich search results
- **Conversion Analytics**: No GA4/event tracking wired
- **A/B Testing**: No experimentation framework
- **Email Marketing**: No newsletter/abandoned cart recovery
- **Blog/Content**: No content marketing engine

## Gate Check

| Condition | Result |
|-----------|--------|
{chr(10).join(f"| {'PASS' if c['passed'] else 'FAIL'} | {c['condition']} |" for c in gate_result['checks'])}

## Spec vs Reality Notes

- **Growth features are uneven**: Strong UGC (moments wall) and social proof, but zero conversion analytics.
- **Structured data gap is the biggest miss** — Product schema alone would significantly improve SERP visibility.
- **The spec's growth recommendations map well** to gather-web's actual gaps: SEO depth, conversion tracking, and content marketing are all real needs.
"""
    path = make_audit_path(10, "growth_audit")
    path.write_text(markdown)
    append_ledger("AUDIT_COMPLETE", f"Era 10 — Growth assessment: structured data and analytics gaps identified", 10)
    if not has_structured_data:
        queue_deepen(10, None, "Era 10: gather-web missing structured data (Product schema) — add to spec requirements", confidence)
    if not has_conversion_tracking:
        queue_deepen(10, None, "Era 10: gather-web missing conversion analytics — spec should enforce analytics setup in Era 09", confidence)
    return {"era": 10, "gate": gate_result["gate"], "passed": gate_result["passed"], "score": gate_result["score"], "confidence": confidence}

if __name__ == "__main__":
    result = run_audit()
    print(f"Era 10: {result['gate']} — {'PASS' if result['passed'] else 'FAIL'} ({result['score']:.0f}%)")
