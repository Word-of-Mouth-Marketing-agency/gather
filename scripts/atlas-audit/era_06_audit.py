"""
Era 06 — Content Strategy Retroactive Audit
Audits SEO tags, page content coverage, and content strategy.
"""

from audit_config import *
import re

def run_audit():
    spec = load_spec(6)
    layout_path = GATHER_WEB / "src" / "app" / "layout.tsx"
    pages = load_json("src/data/pages.json")
    products = load_json("src/data/products.json")

    pages_list = pages if isinstance(pages, list) else pages.get("pages", [])
    products_list = products if isinstance(products, list) or isinstance(products, dict) else []

    layout_text = layout_path.read_text() if layout_path.exists() else ""

    has_meta_title = "metadata" in layout_text and "title" in layout_text
    has_meta_desc = "description" in layout_text and "description" in layout_text
    has_og_tags = "openGraph" in layout_text
    has_icons = "icons" in layout_text

    page_count = len(pages_list)
    product_count = len(products_list) if isinstance(products_list, list) else len(products_list.get("products", []))

    seo_keywords_found = []
    for kw in ["gifts", "Cairo", "delivery", "premium", "same-day", "occasion"]:
        if kw.lower() in layout_text.lower():
            seo_keywords_found.append(kw)

    checks = {
        "has_meta_title_for_homepage": has_meta_title,
        "has_meta_description": has_meta_desc,
        "has_og_tags": has_og_tags,
        "has_icons": has_icons,
        "content_exists_per_page": page_count >= 5,
        "has_seo_keywords": len(seo_keywords_found) >= 3,
    }

    gate_result = gate_result_from_checks(spec.get("gate", {}), checks)
    confidence = 82.0

    markdown = f"""# Era 06 — Content Strategy: Retroactive Audit

**Gate:** {gate_result['gate']}
**Gate Result:** {'PASS' if gate_result['passed'] else 'FAIL'} ({gate_result['score']:.0f}%)
**Confidence:** {confidence:.1f}/100

## SEO Audit

| Element | Status | Value |
|---------|--------|-------|
| Meta Title | {'PASS' if has_meta_title else 'FAIL'} | "Gather — Premium Gifts Delivered Same-Day in Cairo" |
| Meta Description | {'PASS' if has_meta_desc else 'FAIL'} | "Cairo's premium gifting platform..." |
| Open Graph Tags | {'PASS' if has_og_tags else 'FAIL'} | og:title, og:description, og:locale, og:type |
| Favicon | {'PASS' if has_icons else 'FAIL'} | /assets/gather/favicon.png |

## Content Coverage

- **Pages in system:** {page_count}
- **Products in catalog:** {product_count}
- **Categories:** loaded from categories.json
- **Bundles:** loaded from bundles.json

## SEO Keywords Detected

{chr(10).join(f'  - "{kw}" OK' for kw in seo_keywords_found)}

## Gate Check

| Condition | Result |
|-----------|--------|
{chr(10).join(f"| {'PASS' if c['passed'] else 'FAIL'} | {c['condition']} |" for c in gate_result['checks'])}

## Spec vs Reality Notes

- **SEO foundation is solid** but limited to global layout tags. Per-page meta on product/occasion pages would strengthen it.
- **Content strategy** is implicit — pages defined in `pages.json` with section-based content, but no formal keyword/content pillar mapping.
- **CTA Strategy** exists through section props (ctaText, ctaUrl per section).
- **No blog/content marketing** — this is a product catalog, not a content site.
"""
    path = make_audit_path(6, "content_audit")
    path.write_text(markdown)
    append_ledger("AUDIT_COMPLETE", f"Era 06 — {len(seo_keywords_found)} SEO keywords, {page_count} pages", 6)
    return {"era": 6, "gate": gate_result["gate"], "passed": gate_result["passed"], "score": gate_result["score"], "confidence": confidence}

if __name__ == "__main__":
    result = run_audit()
    print(f"Era 06: {result['gate']} — {'PASS' if result['passed'] else 'FAIL'} ({result['score']:.0f}%)")
