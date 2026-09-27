# OrbitWorks Aerospace — SKU Scheme Proposal (DRAFT)

**Status:** APPROVED — wired into live site (shop, index, defense, build, cart/checkout).  
**Generated:** 2026-09-26 (ET)  
**Catalog files:** `docs/sku-catalog.csv`, `docs/sku-catalog.json`

---

## Recommended format

### Civilian / commercial

```
OW-{CAT}-{SLUG}[-{VARIANT…}]
```

| Part | Meaning | Examples |
|------|---------|----------|
| `OW` | OrbitWorks commercial namespace | — |
| `{CAT}` | Family code (warehouse aisle) | `PLT`, `FW`, `BAT`, `MRC` |
| `{SLUG}` | Short stable item code | `SACAG`, `PICO`, `1300`, `TEE` |
| `{VARIANT}` | Optional size/color/pack | `BLK-M`, `2X` |

### Defense (strictly separate)

```
DEF-{FAMILY}-{SLUG}
```

| Family | Meaning |
|--------|---------|
| `RAD` | Radar / sensors |
| `INT` | Interceptors |
| `LCH` | Launchers |
| `SYS` | Complete systems / batteries |

Defense SKUs never use the `OW-` prefix. They live only on `defense.html` and are quote/NDA — not add-to-cart.

### Cart IDs vs SKUs

- **Cart `id`** (e.g. `atlas-pro`, `fw-pico`) stays as the internal/localStorage key.
- **SKU** is customer- and ops-facing (packing slips, invoices, warehouse labels, product cards).
- Mapping is 1:1 for most items; merch is 1 parent style → many variant SKUs.

---

## Category codes

| Code | Prefix | Category |
|------|--------|----------|
| PLT | `OW-PLT-` | Complete platforms (Americana line) |
| FW | `OW-FW-` | Fixed-wing airframes |
| MR | `OW-MR-` | Multirotor frames |
| FC | `OW-FC-` | Flight controllers |
| ESC | `OW-ESC-` | ESCs |
| MOT | `OW-MOT-` | Motors |
| GPS | `OW-GPS-` | GPS modules |
| RX | `OW-RX-` | Receivers |
| FPV | `OW-FPV-` | FPV air units / analog kits |
| CAM | `OW-CAM-` | Cameras & gimbals |
| BAT | `OW-BAT-` | Batteries (+ multipack suffix) |
| CRG | `OW-CRG-` | Cargo & payload |
| LNH | `OW-LNH-` | Launch & recovery |
| TRN | `OW-TRN-` | Transport & cases |
| GND | `OW-GND-` | Ground station & range |
| FLD | `OW-FLD-` | Field accessories |
| SRV | `OW-SRV-` | Servos |
| VTOL | `OW-VTOL-` | VTOL conversion kits |
| EDU | `OW-EDU-` | Education programs |
| MRC | `OW-MRC-` | Merch |
| SVC | `OW-SVC-` | Aerial services |
| BLD | `OW-BLD-` | Build / labor services |
| DEF | `DEF-*-` | Defense (separate series) |

### Merch variant codes

- **Color:** `BLK` `WHT` `RED` `BLU` `GRY` `GRN` `PNK` `PRP` `YLW`
- **Size:** `XS` `S` `M` `L` `XL` `2XL` `3XL` `4XL`
- Pattern: `OW-MRC-TEE-BLK-M`, `OW-MRC-HOOD-RED-2XL`, `OW-MRC-CAP-L`, `OW-MRC-BEAN` (one-size)

### Battery multipacks

Today the cart sells packs as separate products (`bat-1300-2x`, …). SKUs mirror that: `OW-BAT-1300-2X`.  
**Ops note:** longer-term, prefer base SKU `OW-BAT-1300` + quantity; keep pack SKUs until checkout is updated.

---

## Examples

| Display name | Cart id | SKU |
|--------------|---------|-----|
| Sacagawea Survey | `atlas-pro` | `OW-PLT-SACAG` |
| Adams 6K | `vista-6k` | `OW-PLT-ADAMS` |
| Daytona FPV | `volt-fpv` | `OW-PLT-DAYTN` |
| Iron Horse X8 | `titan-x8` | `OW-PLT-IRNHR` |
| Smokejumper IR | `ember-ir` | `OW-PLT-SMKJP` |
| Franklin Micro Kit | `spark-micro` | `OW-PLT-FRANK` |
| Pico Talon Airframe | `fw-pico` | `OW-FW-PICO` |
| CNHL 1300mAh 6S (2x) | `bat-1300-2x` | `OW-BAT-1300-2X` |
| OWA Classic Tee / Black / M | `tee-classic` | `OW-MRC-TEE-BLK-M` |
| FAA Part 107 Prep | `edu-part107` | `OW-EDU-P107` |
| Aerial Mapping & Survey | `svc-map` | `OW-SVC-MAP` |
| AERIS-10X Radar | `def-aeris` | `DEF-RAD-AERIS10X` |
| Talon Mk.I Interceptor | `def-talon` | `DEF-INT-TALON-MKI` |
| Vanguard Complete Battery | `def-vanguard` | `DEF-SYS-VANGUARD` |

---

## Inventory counts

### Base offerings (unique sellable items / styles — no merch color×size explosion)

| Category | Count |
|----------|------:|
| Batteries (incl. multipack SKUs as sold today) | 28 |
| Motors | 11 |
| Fixed Wing Airframes | 10 |
| Multirotor Frames | 10 |
| Field Accessories | 10 |
| Ground Station & Range | 8 |
| Flight Controllers | 7 |
| ESCs | 7 |
| Education (3 cart + 4 quote) | 7 |
| Platforms | 6 |
| Cameras & Gimbals | 6 |
| Transport & Protection | 6 |
| GPS / RX / FPV / Cargo / Launch / Servos | 5 each (30) |
| Merch parent styles | 4 |
| Defense | 4 |
| Aerial Services | 3 |
| Build Services | 2 |
| VTOL Kits | 1 |
| **Total base** | **160** |

### Full SKU catalog (including merch variants)

| | Count |
|--|------:|
| Merch variants (color×size) | 147 |
| Merch parents | 4 |
| All other items | 156 |
| **Total SKU rows** | **307** |

Sources inventoried: `shop.html` (platforms, COTS, education, merch), `build-a-drone.html` (configurator parts + labor), `index.html#services` (aerial), `defense.html` (Vanguard family). Redirect stubs (`merch.html`, `services.html`, `drones.html`) have no unique SKUs.

---

## Quote-only / missing-price items

| SKU | Name | Notes |
|-----|------|-------|
| `OW-EDU-ORG` | Organizational Training | Request Program |
| `OW-EDU-CUAS` | Basic Counter-UAV Tactics | Gov / bulk pricing |
| `OW-EDU-HS` | High School Outreach | Inquire |
| `OW-EDU-SPED` | Special Education Programs | Inquire |
| `OW-SVC-PHOTO` | Aerial Photography & Video | Contact quote |
| `OW-SVC-MAP` | Aerial Mapping & Survey | Contact quote |
| `OW-SVC-INSP` | Aerial Inspection | Contact quote |
| `OW-BLD-LABOR` | Build Labor & Testing | 30% of parts, $99 min |
| `OW-BLD-CUSTOM` | Custom Build Configuration | Composite order |
| `DEF-RAD-AERIS10X` | AERIS-10X Radar | NDA |
| `DEF-INT-TALON-MKI` | Talon Mk.I | NDA |
| `DEF-LCH-SENTINEL-MKI` | Sentinel Mk.I | NDA; TRL 4–5 |
| `DEF-SYS-VANGUARD` | Vanguard Complete Battery | NDA |

---

## Collisions & ops notes

1. **Cart icon collision (not SKU):** Sacagawea Survey and Super Stingray both use cart `icon:'SS'`. SKUs are unique (`OW-PLT-SACAG` vs `OW-FW-STINGRAY`); recommend changing Stingray icon to e.g. `SR` when wiring UI.
2. **Legacy cart ids:** Platform cart ids still use pre-Americana names (`atlas-pro`, `vista-6k`, …). SKUs use Americana codes; leave cart ids stable.
3. **Battery multipacks:** 21 of 28 battery cart lines are pack variants. SKUs assigned; consider consolidating later.
4. **Build “none” options** (`fpv-none`, `cam-none`, …): price $0, not SKU’d — configurator UI only.
5. **No SKU collisions** in generated catalog.

---

## Suggested on-site display (do not ship until approved)

See `docs/sku-display-draft.html` for a copy-paste pattern.

### Pattern

- Mono, muted, small: under product name or above price.
- Platforms / COTS / merch / education: show SKU on card.
- Merch: show **resolved variant SKU** after color+size selected (update via JS).
- Defense: show `DEF-…` SKU + “ITAR / quote” — never a cart button.
- Quote-only education/services: show SKU + “Quote” instead of price.

### CSS sketch

```css
.product-sku, .cots-sku, .merch-sku, .edu-sku, .def-sku {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--text3);
  margin: 2px 0 6px;
}
.def-sku { color: var(--danger); opacity: 0.85; }
```

### HTML sketch (platform card)

```html
<div class="product-name">Sacagawea Survey</div>
<div class="product-sku" data-sku="OW-PLT-SACAG">SKU OW-PLT-SACAG</div>
<div class="product-price">$4,499</div>
```

### Wiring notes (post-approval)

1. Add `data-sku` on cards; optionally extend `OW.addToCart` payload with `sku` (and merch variant SKU from color/size).
2. Checkout / email confirmation: print SKU next to line item.
3. Keep `id` for cart merge keys; do not replace cart ids with SKUs.
4. Defense page only: static `DEF-…` labels; no cart integration.

---

## Approval checklist

- [ ] Confirm prefix style (`OW-` + `DEF-`) vs alternatives (`OW-D-` for defense)
- [ ] Confirm Americana platform slugs (`SACAG`, `ADAMS`, …)
- [ ] Confirm merch variant encoding
- [ ] Confirm whether battery multipacks stay as separate SKUs
- [ ] Then: implement display + cart `sku` field (still no push until asked)
