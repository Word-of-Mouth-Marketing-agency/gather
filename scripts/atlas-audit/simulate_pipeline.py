"""
ATLAS-WB Pipeline Dry-Run for Gather
Feeds gather-web data through ATLAS-WB era data models, produces speculative artifacts.
"""

import sys, json, datetime, os

BASE_ATLAS = r"A:\Projects\obsidian\WOM\New Upgrade\ATLAS-WB-Cognitive-System"
BASE_GATHER = r"A:\Projects\gather-web"

sys.path.insert(0, os.path.join(BASE_ATLAS, "scripts", "eras"))
sys.path.insert(0, os.path.join(BASE_ATLAS, "scripts"))

OUTPUT_DIR = os.path.join(BASE_ATLAS, "websites", "gather-audit", "pipeline-simulation")
STATE_PATH = os.path.join(BASE_ATLAS, "CANONICAL_STATE.json")
LEDGER_PATH = os.path.join(BASE_ATLAS, "tracking", "BUILD_LEDGER.jsonl")

ERA_NAMES = {
    1: "Client Discovery", 2: "Site Classification", 3: "Information Architecture",
    4: "Tech Stack Selection", 5: "Design System", 6: "Content Strategy",
    7: "E-Commerce Engine", 8: "Development Planning", 9: "Launch Protocol",
    10: "Post-Launch Optimization",
}


def load_state():
    with open(STATE_PATH) as f:
        return json.load(f)


def save_state(state):
    state["updated"] = datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%dT%H:%M:%SZ")
    with open(STATE_PATH, "w") as f:
        json.dump(state, f, indent=2)


def append_ledger(event, detail, client="gather"):
    entry = {
        "event": event, "ts": datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "system": "ATLAS-WB-Cognitive-System", "detail": detail, "client": client, "actor": "simulate_pipeline",
    }
    os.makedirs(os.path.dirname(LEDGER_PATH), exist_ok=True)
    with open(LEDGER_PATH, "a") as f:
        f.write(json.dumps(entry) + "\n")


def register_gather():
    state = load_state()
    existing = [s for s in state.get("sessions", []) if s["slug"] == "gather"]
    if not existing:
        session = {
            "client": "Gather", "slug": "gather", "site_type": "ECOM",
            "eras_completed": [], "eras_pending": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            "gates_passed": [], "confidence_scores": {}, "status": "SIMULATED",
            "created": datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        state.setdefault("sessions", []).append(session)
        save_state(state)
        append_ledger("SESSION_REGISTERED", "Gather registered for pipeline dry-run", "gather")
        print("  >> Registered Gather as ECOM client in CANONICAL_STATE.json")
    else:
        print("  >> Gather already registered in CANONICAL_STATE.json")


def simulate_era(era_num):
    era_name = ERA_NAMES[era_num]
    print(f"  Era {era_num:02d}: {era_name}")

    try:
        era_mod = __import__(f"era_{era_num:02d}_{['discovery','classification','architecture','tech_stack','design','content','commerce','development','launch','growth'][era_num-1]}", fromlist=[""])
    except ImportError as e:
        return {"era": era_num, "name": era_name, "simulated": False, "error": str(e)}

    artifact = None
    gate = None
    speculative_data = {}

    if era_num == 1:
        brief = era_mod.run_intake(
            "Gather", "E-Commerce (Grocery & Household)",
            audience=["Cairo families", "Young professionals", "Office workers"],
            location="Cairo, Egypt",
            business_model="B2C e-commerce with local delivery",
            goals=["Launch e-commerce storefront", "Manage 200+ products", "Accept online payments"],
            kpis=["Products listed", "Delivery zones covered", "Orders processed"],
            budget_tier="C", has_brand_assets=True,
        )
        brief.confidence = 92.0
        speculative_data = {"client": brief.client_name, "industry": brief.industry, "audience_count": len(brief.target_audience), "goal_count": len(brief.goals)}
        artifact = era_mod.render_markdown(brief)
        gate = era_mod.gate_check(brief)

    elif era_num == 2:
        c = era_mod.classify(
            "ECOM", ["product catalog", "cart", "checkout", "customer accounts", "admin panel"],
            must_have=["product catalog", "cart", "checkout", "admin panel"],
            nice_to_have=["wishlist", "product reviews", "multi-language"],
            out_of_scope=["subscriptions", "POS integration"],
            competitors=["talabat.com", "elmenus.com", "kiwee.com"],
            references=["talabat.com", "noon.com"],
        )
        c.confidence = 88.0
        speculative_data = {"type": c.site_type, "complexity": c.complexity_score, "must_have_count": len(c.features_must_have)}
        artifact = era_mod.render_markdown(c)
        gate = era_mod.gate_check(c)

    elif era_num == 3:
        ia = era_mod.build_architecture(
            "ECOM", ["Home", "Products", "Cart", "Checkout", "About", "Contact", "Blog", "Admin"],
            flows=[
                {"name": "Browse & Purchase", "steps": 5},
                {"name": "Admin Product Management", "steps": 4},
                {"name": "Category Browsing", "steps": 3},
            ],
        )
        ia.confidence = 90.0
        speculative_data = {"page_count": len(ia.pages), "flow_count": len(ia.user_flows)}
        artifact = era_mod.render_markdown(ia)
        gate = era_mod.gate_check(ia)

    elif era_num == 4:
        stack = era_mod.select_stack(
            "ECOM", "C",
            preferences=["next.js", "tailwind"],
        )
        if stack:
            stack.framework = "Next.js 16 with React 19"
            stack.cms = "Custom (JSON files in /public)"
            stack.hosting = "Cloudflare Pages"
            stack.monthly_cost_estimate = "$0 (within free tier)"
            stack.integrations = ["Odoo (ERP stubs)", "Fawry/Cash payment stubs", "WhatsApp contact"]
            stack.confidence = 85.0
        gate = era_mod.gate_check(stack, "ECOM")
        speculative_data = {"framework": stack.framework, "hosting": stack.hosting, "cost": stack.monthly_cost_estimate}
        artifact = era_mod.render_markdown(stack)

    elif era_num == 5:
        ds = era_mod.generate_design("ECOM", has_brand_assets=True, colors={"primary": "#10b981 (emerald)", "secondary": "#059669", "neutral": "#f8fafc", "accent": "#6366f1"},
                                     typography={"heading": "Inter / sans-serif", "body": "Inter / sans-serif", "scale": "1.25 (major third)"},
                                     components=["ProductCard", "CartDrawer", "SearchBar", "Navbar", "Footer", "Button", "Input", "Modal"],
                                     wireframes=["homepage_v1.txt", "product_listing.txt", "checkout_flow.txt"])
        ds.confidence = 87.0
        speculative_data = {"component_count": len(ds.components), "wireframe_count": len(ds.wireframes)}
        artifact = era_mod.render_markdown(ds)
        gate = era_mod.gate_check(ds)

    elif era_num == 6:
        cs = era_mod.plan_content(
            "ECOM", ["Home", "Products", "About", "Contact", "Blog"],
            keywords=["grocery delivery Cairo", "online supermarket Egypt", "buy groceries online"],
            tone="Friendly, trustworthy, local",
            media=["hero image (1920x1080)", "product photos (800x800)", "icon set (SVG)"],
        )
        cs.confidence = 82.0
        speculative_data = {"page_count": len(cs.page_content), "keyword_count": len(cs.seo_keywords)}
        artifact = era_mod.render_markdown(cs)
        gate = era_mod.gate_check(cs)

    elif era_num == 7:
        cs = era_mod.build_commerce(
            ["Groceries", "Household", "Beverages"], region="egypt",
            payment="Cash on delivery + Fawry stub",
            checkout_steps=["cart", "contact info", "delivery address", "payment method", "order confirmation"],
            inventory="JSON file (manual updates via admin panel)",
        )
        cs.confidence = 80.0
        speculative_data = {"product_types": 3, "checkout_steps": len(cs.checkout_steps), "payment": cs.payment_provider}
        artifact = era_mod.render_markdown(cs)
        gate = era_mod.gate_check(cs)

    elif era_num == 8:
        dp = era_mod.plan_development(
            "Next.js", ["ProductCard", "CartDrawer", "SearchBar", "Navbar", "Footer", "Button", "Input", "Modal"],
            sprints=[
                {"week": 1, "focus": "Foundation: Next.js setup + Layout shell + Tailwind config"},
                {"week": 2, "focus": "Product Catalog: JSON data layer + ProductCard + listing page"},
                {"week": 3, "focus": "Cart & Checkout: Cart context + localStorage + checkout form"},
                {"week": 4, "focus": "Admin & Polish: Admin panel + CRUD + SEO meta tags + launch prep"},
            ],
        )
        dp.confidence = 85.0
        speculative_data = {"sprint_count": len(dp.sprints), "qa_item_count": len(dp.qa_checklist)}
        artifact = era_mod.render_markdown(dp)
        gate = era_mod.gate_check(dp)

    elif era_num == 9:
        lp = era_mod.plan_launch("Vercel", "gather-web.vercel.app",
                                 steps=["Deploy to Vercel staging", "Run E2E tests on staging", "QA review", "DNS config for custom domain", "SSL verification", "Promote to production", "Smoke tests on live URL"],
                                 analytics=["Vercel Analytics", "Google Search Console"],
                                 dns="Cloudflare")
        lp.confidence = 78.0
        speculative_data = {"domain": lp.domain_info.get("domain"), "analytics_count": len(lp.analytics_tools)}
        artifact = era_mod.render_markdown(lp)
        gate = era_mod.gate_check(lp)

    elif era_num == 10:
        gp = era_mod.plan_growth(
            "ECOM",
            performance={"lcp": "1.8s (pass)", "cls": "0.08 (pass)", "inp": "120ms (pass)", "lighthouse": 82},
            funnels=[
                {"name": "Home → Product → Cart → Checkout", "current_cvr": "2.5%", "target": "4.0%"},
                {"name": "Blog → Product → Purchase", "current_cvr": "1.2%", "target": "2.5%"},
            ],
        )
        gp.confidence = 72.0
        speculative_data = {"performance_audit": True, "seo_recs": len(gp.seo_recommendations), "ab_tests": len(gp.ab_test_ideas)}
        artifact = era_mod.render_markdown(gp)
        gate = era_mod.gate_check(gp)

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    filepath = os.path.join(OUTPUT_DIR, f"{era_num:02d}_{era_name.lower().replace(' ', '_')}_artifact.md")
    with open(filepath, "w") as f:
        f.write(artifact)

    result = {
        "era": era_num, "name": era_name, "simulated": True,
        "gate_passed": gate["passed"], "gate_score": gate["score"],
        "confidence": speculative_data.get("confidence", 80.0),
        "speculative_data": speculative_data,
        "artifact": filepath,
    }
    status = "PASS" if gate["passed"] else "FAIL"
    print(f"    Gate: {status} ({gate['score']:.0f}%) -> {filepath}")
    return result


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("=" * 55)
    print("ATLAS-WB PIPELINE DRY-RUN: Gather (ECOM)")
    print("=" * 55)

    register_gather()

    results = []
    for era_num in range(1, 11):
        result = simulate_era(era_num)
        results.append(result)
        append_ledger("ERA_SIMULATED", f"Era {era_num:02d}: {result.get('gate_passed', False)} ({result.get('gate_score', 0):.0f}%)", "gather")

    passed = sum(1 for r in results if r.get("gate_passed"))
    total = len(results)

    summary_path = os.path.join(OUTPUT_DIR, "pipeline_summary.json")
    summary = {
        "system": "ATLAS-WB-Pipeline-DryRun",
        "target": "gather-web",
        "run_at": datetime.datetime.now(datetime.UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "passed": passed, "total": total,
        "note": "Simulates what ATLAS-WB would have produced had Gather been built through the pipeline",
        "results": results,
    }
    with open(summary_path, "w") as f:
        json.dump(summary, f, indent=2)

    print(f"\n{'='*55}")
    print(f"DRY-RUN COMPLETE: {passed}/{total} eras")
    print(f"{'='*55}\n")
    print(f"  ERA  {'GATE':<39} RESULT SCORE")
    print(f"  {'----':<4} {'---------------------------------------':<39} {'------':<6} {'-----':<5}")
    for r in results:
        status = "PASS" if r.get("gate_passed") else "FAIL"
        print(f"  {r['era']:>4} {r['name']:<39} {status:<6} {r['gate_score']:.0f}")
    print(f"\n  Artifacts: {OUTPUT_DIR}")

    return summary


if __name__ == "__main__":
    main()
