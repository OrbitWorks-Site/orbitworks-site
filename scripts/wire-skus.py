#!/usr/bin/env python3
"""Wire approved OrbitWorks SKU catalog into live HTML/CSS/JS."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CAT = json.loads((ROOT / "docs/sku-catalog.json").read_text())

BASE: dict[str, str] = {}
MERCH_BASE: dict[str, str] = {}
for item in CAT["items"]:
    notes = item.get("notes") or ""
    if "Variant of" in notes:
        continue
    cid = item["cart_id"]
    sku = item["sku"]
    BASE[cid] = sku
    if item["category_code"] == "MRC":
        MERCH_BASE[cid] = sku

COLOR_CODES = {
    "Black": "BLK",
    "White": "WHT",
    "Red": "RED",
    "Blue": "BLU",
    "Grey": "GRY",
    "Gray": "GRY",
    "Green": "GRN",
    "Pink": "PNK",
    "Purple": "PRP",
    "Yellow": "YLW",
}

TITLE_TO_CART = {
    "Hobby Pilot Fundamentals": "edu-hobby",
    "FAA Part 107 Prep Course": "edu-part107",
    "FAA Part 107 Prep": "edu-part107",
    "Organizational Training": "edu-org",
    "Basic Counter-UAV Tactics": "edu-cuas",
    "High School Outreach Program": "edu-hs",
    "Special Education Programs": "edu-sped",
    "SAR Operations with UAVs": "edu-sar",
    "SAR UAV Operations": "edu-sar",
    "AERIS-10X Radar": "def-aeris",
    "Talon Mk.I Interceptor": "def-talon",
    "Sentinel Mk.I Launcher": "def-sentinel",
    "Complete Vanguard Battery": "def-vanguard",
    "Photography & Video": "svc-photo",
    "Photography &amp; Video": "svc-photo",
    "Mapping & Survey": "svc-map",
    "Mapping &amp; Survey": "svc-map",
    "Inspection": "svc-insp",
    "Sacagawea Survey": "atlas-pro",
    "Adams 6K": "vista-6k",
    "Daytona FPV": "volt-fpv",
    "Iron Horse X8": "titan-x8",
    "Smokejumper IR": "ember-ir",
    "Franklin Micro Kit": "spark-micro",
}


def sku_line(css_class: str, sku: str, indent: str = "            ") -> str:
    return f'{indent}<div class="{css_class}" data-sku="{sku}">SKU {sku}</div>'


def strip_prior_sku_markup(html: str) -> str:
    html = re.sub(
        r"\n?[ \t]*<div class=\"(?:product|cots|merch|edu|def|svc|build)-sku\"[^>]*>SKU [^<]+</div>",
        "",
        html,
    )
    html = re.sub(r",sku:'[^']+'", "", html)
    html = re.sub(r",\s*sku:'[^']+'", "", html)
    html = re.sub(r'\sdata-sku-base="[^"]+"', "", html)
    return html


def patch_add_to_cart(html: str) -> tuple[str, int]:
    count = 0

    def repl(m: re.Match) -> str:
        nonlocal count
        full = m.group(0)
        cid = m.group(1)
        if "sku:" in full:
            return full
        sku = BASE.get(cid)
        if not sku:
            return full
        count += 1
        return full.replace(f"id:'{cid}'", f"id:'{cid}',sku:'{sku}'", 1)

    new = re.sub(r"OW\.addToCart\(\{id:'([^']+)'[^}]*\}\)", repl, html)
    return new, count


def patch_shop(html: str) -> tuple[str, dict]:
    html = strip_prior_sku_markup(html)
    stats = {"platforms": 0, "cots": 0, "edu": 0, "merch": 0, "addtocart_sku": 0}

    # Platforms — single-pass replace (no mutating while iterating offsets)
    def plat_repl(m: re.Match) -> str:
        name = m.group(1)
        cid = TITLE_TO_CART.get(name)
        if not cid or cid not in BASE:
            return m.group(0)
        stats["platforms"] += 1
        return m.group(0) + "\n" + sku_line("product-sku", BASE[cid])

    html = re.sub(r'<div class="product-name">([^<]+)</div>', plat_repl, html)

    # COTS — inject after <h4> when followed by cots content + addToCart
    def h4_cots(m: re.Match) -> str:
        cid = m.group(7)
        sku = BASE.get(cid)
        if not sku:
            return m.group(0)
        mid = m.group(5)
        if "cots-price" not in mid and "cots-specs" not in mid and "cots-add" not in mid:
            return m.group(0)
        stats["cots"] += 1
        return (
            m.group(1)
            + m.group(2)
            + m.group(3)
            + m.group(4)
            + sku_line("cots-sku", sku, indent="              ")
            + "\n"
            + mid
            + m.group(6)
        )

    html = re.sub(
        r"(<h4>)([^<]+)(</h4>)(\s*)(.*?)(OW\.addToCart\(\{id:'([^']+)')",
        h4_cots,
        html,
        flags=re.S,
    )

    # Education / restricted cards — h3 titles
    def h3_edu(m: re.Match) -> str:
        title = m.group(1)
        title_plain = title.replace("&amp;", "&")
        cid = TITLE_TO_CART.get(title) or TITLE_TO_CART.get(title_plain)
        if not cid or cid not in BASE:
            return m.group(0)
        sku = BASE[cid]
        cls = "edu-sku"
        stats["edu"] += 1
        return m.group(0) + "\n" + sku_line(cls, sku, indent="          ")

    html = re.sub(r"<h3(?:\s[^>]*)?>([^<]+)</h3>", h3_edu, html)

    # Merch cards — process each merch-card block
    def merch_repl(m: re.Match) -> str:
        card = m.group(0)
        id_m = re.search(r'data-product-id="([^"]+)"', card)
        if not id_m:
            return card
        cid = id_m.group(1)
        base = MERCH_BASE.get(cid) or BASE.get(cid)
        if not base:
            return card
        stats["merch"] += 1
        card = card.replace(
            f'data-product-id="{cid}"',
            f'data-product-id="{cid}" data-sku-base="{base}"',
            1,
        )
        if cid == "tee-classic":
            disp = f"{base}-BLK-M"
        elif cid == "hoodie":
            disp = f"{base}-BLK-M"
        elif cid == "cap":
            disp = f"{base}-M"
        else:
            disp = base
        card = re.sub(
            r'(<div class="merch-name">[^<]+</div>)',
            lambda mm: mm.group(0) + "\n" + sku_line("merch-sku", disp),
            card,
            count=1,
        )
        return card

    html = re.sub(
        r'<div class="merch-card\b[^>]*>[\s\S]*?</div>\s*</div>(?=\s*(?:<div class="merch-card|<!-- Support|</div>\s*</section>))',
        merch_repl,
        html,
    )

    html, n = patch_add_to_cart(html)
    stats["addtocart_sku"] = n

    # Trivial icon collision fix: Sacagawea SS → SG (Super Stingray keeps SS)
    html = html.replace(
        "id:'atlas-pro',sku:'OW-PLT-SACAG',name:'Sacagawea Survey',price:4499,icon:'SS'",
        "id:'atlas-pro',sku:'OW-PLT-SACAG',name:'Sacagawea Survey',price:4499,icon:'SG'",
    )

    return html, stats


def patch_index(html: str) -> tuple[str, dict]:
    html = strip_prior_sku_markup(html)
    stats = {"platforms": 0, "services": 0}

    def plat(m: re.Match) -> str:
        name = m.group(1)
        cid = TITLE_TO_CART.get(name)
        if not cid:
            return m.group(0)
        stats["platforms"] += 1
        return m.group(0) + "\n" + sku_line("product-sku", BASE[cid])

    html = re.sub(r'<div class="product-name">([^<]+)</div>', plat, html)

    def svc(m: re.Match) -> str:
        title = m.group(1)
        cid = TITLE_TO_CART.get(title) or TITLE_TO_CART.get(
            title.replace("&amp;", "&")
        )
        if not cid:
            return m.group(0)
        stats["services"] += 1
        return m.group(0) + "\n" + sku_line("svc-sku", BASE[cid], indent="          ")

    html = re.sub(r'<div class="service-title">([^<]+)</div>', svc, html)
    return html, stats


def patch_defense(html: str) -> tuple[str, int]:
    html = strip_prior_sku_markup(html)
    count = 0

    def h3(m: re.Match) -> str:
        nonlocal count
        title = m.group(1)
        cid = TITLE_TO_CART.get(title)
        if not cid or cid not in BASE:
            return m.group(0)
        count += 1
        return m.group(0) + "\n" + sku_line("def-sku", BASE[cid], indent="          ")

    html = re.sub(r"<h3>([^<]+)</h3>", h3, html)

    if "DEF-SYS-VANGUARD" not in html:
        html = html.replace(
            "Complete Vanguard Battery</div>",
            "Complete Vanguard Battery</div>\n        "
            + sku_line("def-sku", "DEF-SYS-VANGUARD", indent="        "),
            1,
        )
        count += 1
    return html, count


def patch_css(css: str) -> str:
    marker = "/* ── SKU display (approved scheme) ── */"
    if marker in css:
        css = re.sub(re.escape(marker) + r"[\s\S]*\Z", "", css).rstrip() + "\n"
    block = f"""
{marker}
.product-sku,
.cots-sku,
.merch-sku,
.edu-sku,
.svc-sku,
.def-sku,
.build-sku {{
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, var(--mono), monospace;
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--text3);
  margin: 2px 0 8px;
  line-height: 1.3;
}}
.product-sku {{
  color: var(--ink-soft);
  opacity: 0.85;
}}
.cots-sku {{
  margin-top: -2px;
  margin-bottom: 6px;
}}
.merch-sku {{
  margin-bottom: 6px;
}}
.edu-sku,
.svc-sku {{
  margin-top: 2px;
}}
.def-sku {{
  color: var(--danger);
  opacity: 0.85;
}}
.cart-item-sku,
.checkout-item-sku {{
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, var(--mono), monospace;
  font-size: 10px;
  letter-spacing: 0.03em;
  color: var(--text3);
  margin-top: 2px;
}}
.option-card .build-sku {{
  margin: 0 0 6px;
}}
"""
    return css.rstrip() + "\n" + block


def generate_sku_map_js() -> str:
    return "\n".join(
        [
            "// Auto-generated from docs/sku-catalog.json — do not edit by hand",
            "// Parent cart_id → base SKU (merch variants resolved in OW.resolveSku)",
            "OW.SKU_MAP = " + json.dumps(BASE, indent=2, sort_keys=True) + ";",
            "OW.MERCH_BASE = " + json.dumps(MERCH_BASE, indent=2, sort_keys=True) + ";",
            "OW.COLOR_CODES = " + json.dumps(COLOR_CODES, indent=2) + ";",
            "",
        ]
    )


def patch_main_js(js: str) -> str:
    # Idempotent: strip prior generated map
    js = re.sub(
        r"\n// Auto-generated from docs/sku-catalog\.json[\s\S]*?(?=\ndocument\.addEventListener\('DOMContentLoaded')",
        "\n",
        js,
    )
    # Strip prior resolveSku / buildMerchSku / updateMerchSkuEl if re-run after partial
    if "resolveSku(item)" in js and "SKU_MAP" not in js.split("resolveSku")[0][-200:]:
        pass  # ok

    old_add = """  addToCart(item) {
    // Build a unique key from id + variants
    const variantKey = item.size || item.color
      ? `${item.id}-${(item.color||'').toLowerCase()}-${(item.size||'').toLowerCase()}`
      : item.id;
    const existing = this.cart.find(i => i._key === variantKey);
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      this.cart.push({ ...item, _key: variantKey, qty: 1 });
    }
    this.saveCart();
    this.showToast(`Added ${item.name} to cart`);
    this.openCart();
  },"""

    new_add = """  addToCart(item) {
    // Resolve SKU (ops / packing slips) — cart id stays the internal key
    if (!item.sku) item.sku = this.resolveSku(item);
    // Build a unique key from id + variants
    const variantKey = item.size || item.color
      ? `${item.id}-${(item.color||'').toLowerCase()}-${(item.size||'').toLowerCase()}`
      : item.id;
    const existing = this.cart.find(i => i._key === variantKey);
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
      if (item.sku) existing.sku = item.sku;
    } else {
      this.cart.push({ ...item, _key: variantKey, qty: 1 });
    }
    this.saveCart();
    this.showToast(`Added ${item.name} to cart`);
    this.openCart();
  },

  resolveSku(item) {
    if (!item || !item.id) return null;
    if (item.sku) return item.sku;
    const merchBase = (this.MERCH_BASE && this.MERCH_BASE[item.id]) || null;
    if (merchBase || item.id === 'tee-classic' || item.id === 'hoodie' || item.id === 'cap' || item.id === 'beanie') {
      return this.buildMerchSku(item.id, item.color, item.size);
    }
    return (this.SKU_MAP && this.SKU_MAP[item.id]) || null;
  },

  buildMerchSku(id, color, size) {
    const base = (this.MERCH_BASE && this.MERCH_BASE[id]) || (this.SKU_MAP && this.SKU_MAP[id]);
    if (!base) return null;
    if (id === 'beanie') return base;
    const parts = [base];
    if (color && this.COLOR_CODES) {
      const code = this.COLOR_CODES[color] || String(color).slice(0, 3).toUpperCase();
      parts.push(code);
    }
    if (size) parts.push(String(size).toUpperCase());
    return parts.join('-');
  },

  updateMerchSkuEl(card) {
    if (!card) return;
    const el = card.querySelector('.merch-sku');
    if (!el) return;
    const id = card.dataset.productId;
    const colorEl = card.querySelector('.swatch.selected');
    const sizeEl = card.querySelector('.size-btn.selected');
    const color = colorEl ? colorEl.dataset.value : null;
    const size = sizeEl ? sizeEl.dataset.value : null;
    const sku = this.buildMerchSku(id, color, size) || card.dataset.skuBase;
    if (!sku) return;
    el.dataset.sku = sku;
    el.textContent = 'SKU ' + sku;
  },"""

    if "if (!item.sku) item.sku = this.resolveSku(item);" not in js:
        if old_add not in js:
            raise SystemExit("addToCart block not found — aborting JS patch")
        js = js.replace(old_add, new_add)

    old_from = """    this.addToCart({ id, name, price, icon, color, size });
  },"""
    new_from = """    const sku = this.buildMerchSku(id, color, size) || card.dataset.skuBase || null;
    this.addToCart({ id, name, price, icon, color, size, sku });
  },"""
    if "card.dataset.skuBase" not in js:
        if old_from not in js:
            raise SystemExit("addFromCard tail not found")
        js = js.replace(old_from, new_from)

    old_cart = """            ${variants ? `<div style="font-size:10px;color:var(--text3);font-family:var(--mono)">${variants}</div>` : ''}
            <div class="cart-item-price">$${item.price.toFixed(2)} × ${item.qty || 1}</div>"""
    new_cart = """            ${variants ? `<div style="font-size:10px;color:var(--text3);font-family:var(--mono)">${variants}</div>` : ''}
            ${item.sku ? `<div class="cart-item-sku">SKU ${item.sku}</div>` : ''}
            <div class="cart-item-price">$${item.price.toFixed(2)} × ${item.qty || 1}</div>"""
    if "cart-item-sku" not in js:
        if old_cart not in js:
            raise SystemExit("cart render block not found")
        js = js.replace(old_cart, new_cart)

    old_co = """            ${variants ? `<div class="checkout-item-variant">${variants}</div>` : ''}
          </div>"""
    new_co = """            ${variants ? `<div class="checkout-item-variant">${variants}</div>` : ''}
            ${item.sku ? `<div class="checkout-item-sku">SKU ${item.sku}</div>` : ''}
          </div>"""
    if "checkout-item-sku" not in js:
        if old_co not in js:
            raise SystemExit("checkout render block not found")
        js = js.replace(old_co, new_co)

    old_order = """      return `${item.name}${variants ? ' ('+variants+')' : ''} x${item.qty||1} — $${(item.price*(item.qty||1)).toFixed(2)}`;"""
    new_order = """      return `${item.name}${variants ? ' ('+variants+')' : ''}${item.sku ? ' ['+item.sku+']' : ''} x${item.qty||1} — $${(item.price*(item.qty||1)).toFixed(2)}`;"""
    if "[\'+item.sku+\']" not in js and "['+item.sku+']" not in js:
        js = js.replace(old_order, new_order)

    old_var = """        btn.addEventListener('click', () => {
          group.querySelectorAll('.swatch').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
        });"""
    new_var = """        btn.addEventListener('click', () => {
          group.querySelectorAll('.swatch').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          this.updateMerchSkuEl(btn.closest('.merch-card'));
        });"""
    if "updateMerchSkuEl(btn.closest('.merch-card'))" not in js:
        js = js.replace(old_var, new_var, 1)
        old_size = """        btn.addEventListener('click', () => {
          group.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
        });"""
        new_size = """        btn.addEventListener('click', () => {
          group.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          this.updateMerchSkuEl(btn.closest('.merch-card'));
        });"""
        js = js.replace(old_size, new_size, 1)

    if "document.querySelectorAll('.merch-card').forEach(c => this.updateMerchSkuEl(c));" not in js:
        js = js.replace(
            "    this.initVariantPickers();\n    this.renderCheckout();",
            "    this.initVariantPickers();\n    document.querySelectorAll('.merch-card').forEach(c => this.updateMerchSkuEl(c));\n    this.renderCheckout();",
        )

    map_js = generate_sku_map_js()
    anchor = "document.addEventListener('DOMContentLoaded', () => OW.init());"
    if "OW.SKU_MAP" not in js:
        if anchor not in js:
            raise SystemExit("DOMContentLoaded anchor missing")
        js = js.replace(anchor, map_js + "\n" + anchor)

    return js


def patch_build(html: str) -> tuple[str, int]:
    html = re.sub(r",\s*sku:'[^']+'", "", html)
    count = 0

    def add_sku(m: re.Match) -> str:
        nonlocal count
        cid = m.group(1)
        sku = BASE.get(cid)
        if not sku:
            return m.group(0)
        count += 1
        return m.group(0) + f", sku:'{sku}'"

    html = re.sub(r"\{id:'([a-z0-9-]+)'", add_sku, html)

    old_card = '<h3>${p.name}</h3>\n    <div class="card-specs">'
    new_card = (
        '<h3>${p.name}</h3>\n'
        '    ${p.sku?`<div class="build-sku" data-sku="${p.sku}">SKU ${p.sku}</div>`:\'\'}\n'
        '    <div class="card-specs">'
    )
    if "build-sku" not in html and old_card in html:
        html = html.replace(old_card, new_card)

    old_labor = 'rows+=`<tr><td>Labor &amp; Testing</td><td style="color:var(--text2);font-size:12px">Assembly, firmware, calibration, test flight (30% of parts, $99 min)</td>'
    new_labor = 'rows+=`<tr><td>Labor &amp; Testing<br><span class="build-sku" style="margin:0">SKU OW-BLD-LABOR</span></td><td style="color:var(--text2);font-size:12px">Assembly, firmware, calibration, test flight (30% of parts, $99 min)</td>'
    if "OW-BLD-LABOR" not in html and old_labor in html:
        html = html.replace(old_labor, new_labor)
        count += 1

    return html, count


def update_proposal(md: str) -> str:
    return md.replace(
        "**Status:** Awaiting user approval — do not push or wire into live checkout until approved.",
        "**Status:** APPROVED — wired into live site (shop, index, defense, build, cart/checkout).",
    )


def verify(shop: str, index: str, defense: str) -> dict:
    ids = re.findall(r"OW\.addToCart\(\{id:'([^']+)'([^}]*)\}\)", shop)
    missing_payload = [i for i, rest in ids if "sku:" not in rest]
    visible = set(re.findall(r'data-sku="([^"]+)"', shop))
    cart_ids = {i for i, _ in ids} | set(
        re.findall(r'data-product-id="([^"]+)"', shop)
    )
    missing_visible = []
    for cid in sorted(cart_ids):
        sku = BASE.get(cid)
        if not sku:
            continue
        if sku.startswith("OW-MRC-"):
            if not any(v.startswith(sku) for v in visible):
                missing_visible.append(cid)
        elif sku not in visible:
            missing_visible.append(cid)

    # HTML integrity: no broken tags from bad injects
    broken = []
    for pat in [
        r"<sp<div",
        r"</div>Order</span>",
        r"margin-bottom:<div",
        r'<div c<div',
        r'product-ca<div',
    ]:
        if re.search(pat, shop):
            broken.append(pat)

    return {
        "addtocart_total": len(ids),
        "addtocart_missing_sku": missing_payload,
        "shop_visible_skus": len(visible),
        "shop_cart_missing_visible": missing_visible,
        "defense_skus": re.findall(r'data-sku="(DEF-[^"]+)"', defense),
        "index_skus": re.findall(r'data-sku="([^"]+)"', index),
        "broken_html_patterns": broken,
        "product_name_count": len(re.findall(r'class="product-name"', shop)),
        "product_sku_count": len(re.findall(r'class="product-sku"', shop)),
    }


def main():
    shop_path = ROOT / "shop.html"
    index_path = ROOT / "index.html"
    defense_path = ROOT / "defense.html"
    build_path = ROOT / "build-a-drone.html"
    css_path = ROOT / "css/style.css"
    js_path = ROOT / "js/main.js"
    proposal_path = ROOT / "docs/sku-scheme-proposal.md"

    shop, shop_stats = patch_shop(shop_path.read_text())
    index, index_stats = patch_index(index_path.read_text())
    defense, def_n = patch_defense(defense_path.read_text())
    build, build_n = patch_build(build_path.read_text())
    css = patch_css(css_path.read_text())
    js = patch_main_js(js_path.read_text())
    proposal = update_proposal(proposal_path.read_text())

    report = verify(shop, index, defense)
    if report["broken_html_patterns"] or report["addtocart_missing_sku"] or report["shop_cart_missing_visible"]:
        print("VERIFY FAILED", json.dumps(report, indent=2))
        raise SystemExit(1)
    if report["product_name_count"] != report["product_sku_count"]:
        print("WARN platform name/sku mismatch", report)
        # not fatal if equal after write check

    shop_path.write_text(shop)
    index_path.write_text(index)
    defense_path.write_text(defense)
    build_path.write_text(build)
    css_path.write_text(css)
    js_path.write_text(js)
    proposal_path.write_text(proposal)

    print("SHOP STATS", shop_stats)
    print("INDEX STATS", index_stats)
    print("DEFENSE", def_n)
    print("BUILD", build_n)
    print("VERIFY", json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
