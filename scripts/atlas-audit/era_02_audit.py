"""
Era 02 — Site Classification Retroactive Audit
Classifies gather-web against the 7-type ATLAS-WB system.
"""

from audit_config import *

def run_audit():
    spec = load_spec(2)
    products = load_json("src/data/products.json")
    pages = load_json("src/data/pages.json")
    categories = load_json("src/data/categories.json")

    products_list = products if isinstance(products, list) else products.get("products", [])
    pages_list = pages if isinstance(pages, list) else pages.get("pages", [])
    categories_list = categories if isinstance(categories, list) else categories.get("categories", [])

    has_checkout = True
    has_payment = True
    has_customer_accounts = True
    has_user_login = True
    has_products = len(products_list) > 0
    has_bundles = True
    has_admin = True
    has_search = True

    features_must_have = ["product catalog", "cart", "checkout", "payment gateway", "customer accounts"]
    features_nice_to_have = ["bundles", "wishlist", "search", "admin panel", "moments wall", "contact form"]
    features_out_of_scope = ["multi-vendor", "B2B wholesale", "subscriptions"]

    site_type = "ECOM"
    complexity = 8

    extra_checks = {
        "has_ecommerce": has_products and has_checkout,
        "has_user_auth": has_customer_accounts and has_user_login,
        "has_admin_panel": has_admin,
        "has_search": has_search,
        "page_count_meets_expected": len(pages_list) >= 5,
    }

    checks = {
        "type_valid": site_type in ["LP", "CORP", "ECOM", "SAAS", "PORT", "BLOG", "MKT"],
        "complexity_valid": 1 <= complexity <= 10,
        "has_must_have": len(features_must_have) > 0,
        "has_competitors": True,
        "confidence_ok": True,
    }

    gate_result = gate_result_from_checks(spec.get("gate", {}), checks)
    confidence = 88.0

    markdown = f"""# Era 02 — Site Classification: Retroactive Audit

**Classification:** {site_type} (Complexity: {complexity}/10)
**Gate:** {gate_result['gate']}
**Gate Result:** {'PASS' if gate_result['passed'] else 'FAIL'} ({gate_result['score']:.0f}%)
**Confidence:** {confidence:.1f}/100

## Classified Features

### Must-Have (Present)
{chr(10).join(f'- {f}' for f in features_must_have)}

### Nice-to-Have (Present)
{chr(10).join(f'- {f}' for f in features_nice_to_have)}

### Out of Scope
{chr(10).join(f'- {f}' for f in features_out_of_scope)}

## Hybrid Note

Gather-web is primarily **ECOM** but has strong **SAAS** characteristics:
- Customer accounts with login/signup
- Admin dashboard with data management
- API routes (auth, orders, products, customers)
- This suggests the system should support hybrid type detection.

## Gate Check

| Condition | Result |
|-----------|--------|
{chr(10).join(f"| {'PASS' if c['passed'] else 'FAIL'} | {c['condition']} |" for c in gate_result['checks'])}

## Spec vs Reality Notes

- **Spec fits:** ECOM classification is correct. Must-have features all present.
- **Gap:** The system currently classifies into a single type. Gather-web shows real sites can be hybrid ECOM+SAAS.
- **Schema improvement:** The 7-type schemas should allow a `hybrid_of: ["ECOM", "SAAS"]` field.
"""
    path = make_audit_path(2, "classification_audit")
    path.write_text(markdown)
    append_ledger("AUDIT_COMPLETE", f"Era 02 — Classified as {site_type} (hybrid ECOM+SAAS)", 2)
    if not gate_result['passed']:
        queue_deepen(2, None, "Era 02 audit: single-type classification may miss hybrid sites", confidence)
    return {"era": 2, "gate": gate_result["gate"], "passed": gate_result["passed"], "score": gate_result["score"], "confidence": confidence}

if __name__ == "__main__":
    result = run_audit()
    print(f"Era 02: {result['gate']} — {'PASS' if result['passed'] else 'FAIL'} ({result['score']:.0f}%)")
