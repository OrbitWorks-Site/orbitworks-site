// ── OrbitWorks Aerospace · Global JS ─────────────────────────────────────────

// ── SHARED DATA STORE ───────────────────────────────────────────────────────
const OW = {
  version: '3.0.0',

  // ── CART ──────────────────────────────────────────────────────────────────
  cart: JSON.parse(localStorage.getItem('ow_cart') || '[]'),

  saveCart() {
    localStorage.setItem('ow_cart', JSON.stringify(this.cart));
    this.renderCart();
    this.updateCartBadge();
  },

  addToCart(item) {
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
  },

  // Add to cart from a merch card with variant pickers
  addFromCard(btn) {
    const card = btn.closest('.merch-card') || btn.closest('.product-card') || btn.closest('.card');
    const id = card.dataset.productId;
    const name = card.dataset.productName;
    const price = parseFloat(card.dataset.productPrice);
    const icon = card.dataset.productIcon || 'OW';

    // Read selected variants
    const colorEl = card.querySelector('.swatch.selected');
    const sizeEl = card.querySelector('.size-btn.selected');
    const color = colorEl ? colorEl.dataset.value : null;
    const size = sizeEl ? sizeEl.dataset.value : null;

    // Validate required variants
    if (card.querySelector('.color-swatches') && !color) {
      this.showToast('Please select a color');
      return;
    }
    if (card.querySelector('.size-buttons') && !size) {
      this.showToast('Please select a size');
      return;
    }

    this.addToCart({ id, name, price, icon, color, size });
  },

  removeFromCart(key) {
    this.cart = this.cart.filter(i => (i._key || i.id) !== key);
    this.saveCart();
  },

  updateQty(key, delta) {
    const item = this.cart.find(i => (i._key || i.id) === key);
    if (!item) return;
    item.qty = Math.max(1, (item.qty || 1) + delta);
    this.saveCart();
  },

  cartTotal() {
    return this.cart.reduce((sum, i) => sum + i.price * (i.qty || 1), 0);
  },

  updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const count = this.cart.reduce((s, i) => s + (i.qty || 1), 0);
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  },

  renderCart() {
    const el = document.getElementById('cartItems');
    if (!el) return;
    if (this.cart.length === 0) {
      el.innerHTML = '<p style="color:var(--text2);text-align:center;padding:40px 0;">Your cart is empty</p>';
    } else {
      el.innerHTML = this.cart.map(item => {
        const key = item._key || item.id;
        const variants = [item.color, item.size].filter(Boolean).join(' / ');
        return `
        <div class="cart-item">
          <span class="cart-item-icon">${item.icon || 'OW'}</span>
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            ${variants ? `<div style="font-size:10px;color:var(--text3);font-family:var(--mono)">${variants}</div>` : ''}
            ${item.sku ? `<div class="cart-item-sku">SKU ${item.sku}</div>` : ''}
            <div class="cart-item-price">$${item.price.toFixed(2)} × ${item.qty || 1}</div>
          </div>
          <button class="cart-item-remove" onclick="OW.removeFromCart('${key}')">✕</button>
        </div>`;
      }).join('');
    }
    const total = document.getElementById('cartTotal');
    if (total) total.textContent = '$' + this.cartTotal().toFixed(2);
  },

  openCart() {
    const d = document.getElementById('cartDrawer');
    const o = document.getElementById('cartOverlay');
    if (d) d.classList.add('open');
    if (o) o.classList.add('open');
    this.renderCart();
  },

  closeCart() {
    const d = document.getElementById('cartDrawer');
    const o = document.getElementById('cartOverlay');
    if (d) d.classList.remove('open');
    if (o) o.classList.remove('open');
  },

  checkout() {
    if (this.cart.length === 0) {
      this.showToast('Your cart is empty!');
      return;
    }
    window.location.href = 'checkout.html';
  },

  // ── TOAST ─────────────────────────────────────────────────────────────────
  showToast(msg, duration = 3000) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('show'), duration);
  },

  // ── NAV ───────────────────────────────────────────────────────────────────
  initNav() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
      hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
    }
    const current = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(a => {
      if (a.getAttribute('href') === current) a.classList.add('active');
    });
  },

  // ── ANIMATE ON SCROLL ─────────────────────────────────────────────────────
  initScrollAnim() {
    const els = document.querySelectorAll('[data-anim]');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    els.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(24px)';
      el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      obs.observe(el);
    });
  },

  // ── TACTICAL GRID BACKGROUND (home page hero) ────────────────────────────
  initHexGrid() {
    const canvas = document.getElementById('hexCanvas');
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      canvas.style.display = 'none';
      return;
    }
    const ctx = canvas.getContext('2d');
    let w, h;
    function resize() {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
      draw();
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const spacing = 80;

      // Fine grid lines
      ctx.strokeStyle = 'rgba(59,130,246,0.04)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += spacing / 4) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += spacing / 4) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Major grid lines
      ctx.strokeStyle = 'rgba(59,130,246,0.07)';
      ctx.lineWidth = 0.8;
      for (let x = 0; x < w; x += spacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += spacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Intersection crosses at major grid points
      ctx.strokeStyle = 'rgba(59,130,246,0.1)';
      ctx.lineWidth = 1;
      const crossSize = 4;
      for (let x = 0; x < w; x += spacing) {
        for (let y = 0; y < h; y += spacing) {
          ctx.beginPath(); ctx.moveTo(x - crossSize, y); ctx.lineTo(x + crossSize, y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x, y - crossSize); ctx.lineTo(x, y + crossSize); ctx.stroke();
        }
      }

      // Diagonal accent lines (schematic/blueprint feel)
      ctx.strokeStyle = 'rgba(59,130,246,0.025)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([6, 12]);
      for (let i = -h; i < w + h; i += spacing * 2) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + h, h); ctx.stroke();
      }
      ctx.setLineDash([]);

      // Coordinate labels at select intersections
      ctx.fillStyle = 'rgba(59,130,246,0.06)';
      ctx.font = '9px "Space Mono", monospace';
      let labelIdx = 0;
      for (let x = spacing; x < w - spacing; x += spacing * 3) {
        for (let y = spacing; y < h - spacing; y += spacing * 3) {
          const lx = String.fromCharCode(65 + (labelIdx % 26));
          const ly = Math.floor(labelIdx / 26) + 1;
          ctx.fillText(`${lx}${ly}`, x + 6, y - 6);
          labelIdx++;
        }
      }
    }
    resize();
    window.addEventListener('resize', resize);
  },

  // ── SHOP HEX GRID (scroll-parallax honeycomb) ────────────────────────────
  initShopHexGrid() {
    const canvas = document.getElementById('shopHexCanvas');
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      canvas.style.display = 'none';
      return;
    }
    const ctx = canvas.getContext('2d');
    let w, h, lastScroll = -1, ticking = false;

    const HEX_RADIUS  = 35;
    const LINE_COLOR   = 'rgba(59,130,246,0.07)';
    const FILL_COLOR   = 'rgba(59,130,246,0.02)';
    const PARALLAX     = 0.35;

    function resize() {
      w = canvas.width  = window.innerWidth;
      h = canvas.height = window.innerHeight;
      drawGrid();
    }

    function drawHex(cx, cy, r) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
    }

    function drawGrid() {
      ctx.clearRect(0, 0, w, h);
      const r  = HEX_RADIUS;
      const dx = r * Math.sqrt(3);
      const dy = r * 1.5;

      // Scroll-driven vertical offset (parallax)
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const offset  = -(scrollY * PARALLAX) % (dy * 2);

      ctx.strokeStyle = LINE_COLOR;
      ctx.lineWidth   = 1;
      ctx.fillStyle   = FILL_COLOR;

      const rowCount = Math.ceil(h / dy) + 4;
      const colCount = Math.ceil(w / dx) + 4;

      for (let row = -2; row < rowCount; row++) {
        for (let col = -2; col < colCount; col++) {
          const x = col * dx + (row % 2 === 0 ? 0 : dx / 2);
          const y = row * dy + offset;

          // Skip if fully off-screen
          if (y < -r * 2 || y > h + r * 2) continue;

          drawHex(x, y, r);
          ctx.fill();
          ctx.stroke();
        }
      }

      lastScroll = scrollY;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          drawGrid();
          ticking = false;
        });
      }
    }

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, { passive: true });
  },

  // ── VARIANT PICKERS ───────────────────────────────────────────────────────
  initVariantPickers() {
    document.querySelectorAll('.color-swatches').forEach(group => {
      group.querySelectorAll('.swatch').forEach(btn => {
        btn.addEventListener('click', () => {
          group.querySelectorAll('.swatch').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          this.updateMerchSkuEl(btn.closest('.merch-card'));
        });
      });
    });
    document.querySelectorAll('.size-buttons').forEach(group => {
      group.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          group.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          this.updateMerchSkuEl(btn.closest('.merch-card'));
        });
      });
    });
  },

  // ── CHECKOUT PAGE ────────────────────────────────────────────────────────
  renderCheckout() {
    const el = document.getElementById('checkoutItems');
    if (!el) return;
    if (this.cart.length === 0) {
      el.innerHTML = '<p style="color:var(--text2);text-align:center;padding:20px 0;">Your cart is empty</p>';
    } else {
      el.innerHTML = this.cart.map(item => {
        const key = item._key || item.id;
        const variants = [item.color, item.size].filter(Boolean).join(' / ');
        return `
        <div class="checkout-item">
          <div class="checkout-item-icon">${item.icon || 'OW'}</div>
          <div class="checkout-item-info">
            <div class="checkout-item-name">${item.name}</div>
            ${variants ? `<div class="checkout-item-variant">${variants}</div>` : ''}
            ${item.sku ? `<div class="checkout-item-sku">SKU ${item.sku}</div>` : ''}
          </div>
          <div class="checkout-item-qty">
            <button class="qty-btn" onclick="OW.updateQty('${key}',-1);OW.renderCheckout()">−</button>
            <span style="font-family:var(--mono);font-size:13px;min-width:20px;text-align:center">${item.qty||1}</span>
            <button class="qty-btn" onclick="OW.updateQty('${key}',1);OW.renderCheckout()">+</button>
          </div>
          <div class="checkout-item-price">$${(item.price * (item.qty||1)).toFixed(2)}</div>
          <button class="cart-item-remove" onclick="OW.removeFromCart('${key}');OW.renderCheckout()">✕</button>
        </div>`;
      }).join('');
    }
    const total = document.getElementById('checkoutTotal');
    if (total) total.textContent = '$' + this.cartTotal().toFixed(2);
  },

  initPayTabs() {
    document.querySelectorAll('.pay-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.pay-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.pay-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.panel).classList.add('active');
      });
    });
  },

  copyText(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = orig, 1500);
    });
  },

  submitOrder(form) {
    if (this.cart.length === 0) {
      this.showToast('Your cart is empty!');
      return false;
    }
    // Build order summary text
    const lines = this.cart.map(item => {
      const variants = [item.color, item.size].filter(Boolean).join('/');
      return `${item.name}${variants ? ' ('+variants+')' : ''}${item.sku ? ' ['+item.sku+']' : ''} x${item.qty||1} — $${(item.price*(item.qty||1)).toFixed(2)}`;
    });
    lines.push('---');
    lines.push('TOTAL: $' + this.cartTotal().toFixed(2));

    // Inject into hidden field
    const orderField = form.querySelector('[name="order_details"]');
    if (orderField) orderField.value = lines.join('\n');

    const payMethod = document.querySelector('.pay-tab.active');
    const payField = form.querySelector('[name="payment_method"]');
    if (payField && payMethod) payField.value = payMethod.textContent.trim();

    return true; // allow form submission
  },

  clearCartAfterOrder() {
    this.cart = [];
    this.saveCart();
  },

  // ── LONG S (ſ) — opt-in decorative only (disabled for catalog/UI) ─────────
  // Auto-transform used to mangle product/UI titles (Course→Courſe, Basic→Baſic,
  // Partnerships→Partnerſhips). Colonial fonts stay via CSS; do not rewrite shop
  // copy. Opt-in: mark a single decorative motto with class="long-s" if desired.
  toLongS(text) {
    if (!text) return text;
    return String(text).replace(/[A-Za-z0-9'’]+/g, (word) => {
      // Skip tokens that look like codes, URLs fragments, emails, versions
      if (/@|https?|www\./i.test(word)) return word;
      if (/^\d/.test(word) && /[A-Za-z]/.test(word) === false) return word;
      // All-caps acronyms (FPV, IR, OWA) — leave alone
      if (word.length <= 4 && word === word.toUpperCase() && /[A-Z]/.test(word)) return word;
      let out = '';
      for (let i = 0; i < word.length; i++) {
        const ch = word[i];
        const atEnd = i === word.length - 1;
        // Lowercase medial/initial s → ſ; final s stays short; capital S unchanged
        if (ch === 's' && !atEnd) out += '\u017f'; // ſ
        else out += ch;
      }
      return out;
    });
  },

  applyLongS() {
    // Opt-in only: elements that already carry .long-s (e.g. a motto). Never
    // auto-apply to product titles, cards, or headings.
    document.querySelectorAll('.long-s').forEach((el) => {
      if (el.dataset.longSApplied === '1') return;
      if (el.closest('button, .btn, a.btn, label, input, textarea, select')) return;
      const original = el.textContent;
      if (!original || !/[sS]/.test(original)) {
        el.dataset.longSApplied = '1';
        return;
      }
      const transformed = this.toLongS(original);
      if (transformed === original) {
        el.dataset.longSApplied = '1';
        return;
      }
      // Keep accessible modern spelling for screen readers
      if (!el.getAttribute('aria-label')) el.setAttribute('aria-label', original.trim());
      el.dataset.originalText = original;
      el.textContent = transformed;
      el.dataset.longSApplied = '1';
    });
  },

// ── AMBIENT FLUTE (muted by default; localStorage; reduced-motion safe) ──
  initAmbient() {
    if (document.getElementById('ambientAudio')) return;

    const STORAGE_KEY = 'ow-ambient-muted';
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Default muted. Only '0' means user previously unmuted.
    let muted = localStorage.getItem(STORAGE_KEY);
    if (muted === null) muted = '1';
    muted = muted !== '0';

    const audio = document.createElement('audio');
    audio.id = 'ambientAudio';
    audio.loop = true;
    audio.preload = 'none';
    audio.volume = 0.28;
    audio.setAttribute('playsinline', '');
    // Never autoplay with sound — start muted/paused
    audio.muted = true;

    const mp3 = document.createElement('source');
    mp3.src = 'audio/flute-ambient.mp3';
    mp3.type = 'audio/mpeg';
    const ogg = document.createElement('source');
    ogg.src = 'audio/flute-ambient.ogg';
    ogg.type = 'audio/ogg';
    audio.appendChild(ogg);
    audio.appendChild(mp3);
    document.body.appendChild(audio);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ambient-toggle';
    btn.id = 'ambientToggle';
    btn.setAttribute('aria-pressed', muted ? 'false' : 'true');
    btn.setAttribute('aria-label', muted ? 'Play soft flute ambience' : 'Mute flute ambience');
    btn.title = muted ? 'Play soft flute ambience' : 'Mute flute ambience';
    btn.innerHTML = `
      <svg class="ambient-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
        <path d="M4 10c2-4 6-6 10-4s6 6 4 10-6 6-10 4-6-6-4-10z" opacity=".35"/>
        <path d="M8 14c1.5-3 4-5 7-4"/>
        <circle cx="9" cy="15" r="1.2" fill="currentColor" stroke="none"/>
        <circle cx="12" cy="12.5" r="1" fill="currentColor" stroke="none" opacity=".85"/>
        <circle cx="14.5" cy="10" r="0.9" fill="currentColor" stroke="none" opacity=".7"/>
      </svg>
      <span class="ambient-label">${muted ? 'Ambience off' : 'Ambience on'}</span>`;

    const iconMuted = `<svg class="ambient-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;
    const iconOn = `<svg class="ambient-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>`;

    function renderBtn(isMuted) {
      // aria-pressed true = ambience on (user unmuted)
      btn.setAttribute('aria-pressed', isMuted ? 'false' : 'true');
      btn.setAttribute('aria-label', isMuted ? 'Play soft flute ambience' : 'Mute flute ambience');
      btn.title = isMuted ? 'Play soft flute ambience' : 'Mute flute ambience';
      const label = isMuted ? 'Ambience off' : 'Ambience on';
      btn.innerHTML = (isMuted ? iconMuted : iconOn) + `<span class="ambient-label">${label}</span>`;
    }
    renderBtn(muted);

    async function setMuted(next) {
      muted = next;
      localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
      renderBtn(muted);
      if (muted) {
        audio.pause();
        audio.muted = true;
      } else {
        if (reduced) {
          // Still allow explicit user unmute, but never auto-start under reduced motion
        }
        audio.muted = false;
        try {
          await audio.play();
        } catch (e) {
          // Autoplay policies — stay paused until next gesture
          muted = true;
          localStorage.setItem(STORAGE_KEY, '1');
          renderBtn(true);
        }
      }
    }

    btn.addEventListener('click', () => setMuted(!muted));
    document.body.appendChild(btn);

    // Never autoplay unmuted. If user previously unmuted and motion OK, still require a gesture —
    // browsers block unmuted autoplay. Keep paused until click.
    // (Preference is restored on first click via button state; we do not call play() here.)
  },

  // ── INIT ──────────────────────────────────────────────────────────────────
  init() {
    this.initNav();
    this.initScrollAnim();
    this.updateCartBadge();
    this.renderCart();
    this.initHexGrid();
    this.initAmbient();
    this.initShopHexGrid();
    this.initVariantPickers();
    document.querySelectorAll('.merch-card').forEach(c => this.updateMerchSkuEl(c));
    this.renderCheckout();
    this.initPayTabs();
    this.applyLongS();
  }
};

// Auto-generated from docs/sku-catalog.json — do not edit by hand
// Parent cart_id → base SKU (merch variants resolved in OW.resolveSku)
OW.SKU_MAP = {
  "atlas-pro": "OW-PLT-SACAG",
  "bat-10k": "OW-BAT-10K",
  "bat-10k-2x": "OW-BAT-10K-2X",
  "bat-10k-3x": "OW-BAT-10K-3X",
  "bat-10k-5x": "OW-BAT-10K-5X",
  "bat-1300": "OW-BAT-1300",
  "bat-1300-2x": "OW-BAT-1300-2X",
  "bat-1300-3x": "OW-BAT-1300-3X",
  "bat-1300-5x": "OW-BAT-1300-5X",
  "bat-16k": "OW-BAT-16K",
  "bat-16k-2x": "OW-BAT-16K-2X",
  "bat-16k-3x": "OW-BAT-16K-3X",
  "bat-16k-5x": "OW-BAT-16K-5X",
  "bat-1800": "OW-BAT-1800",
  "bat-1800-2x": "OW-BAT-1800-2X",
  "bat-1800-3x": "OW-BAT-1800-3X",
  "bat-1800-5x": "OW-BAT-1800-5X",
  "bat-4s22": "OW-BAT-4S22",
  "bat-4s22-2x": "OW-BAT-4S22-2X",
  "bat-4s22-3x": "OW-BAT-4S22-3X",
  "bat-4s22-5x": "OW-BAT-4S22-5X",
  "bat-5000": "OW-BAT-5000",
  "bat-5000-2x": "OW-BAT-5000-2X",
  "bat-5000-3x": "OW-BAT-5000-3X",
  "bat-5000-5x": "OW-BAT-5000-5X",
  "bat-li22": "OW-BAT-LI22",
  "bat-li22-2x": "OW-BAT-LI22-2X",
  "bat-li22-3x": "OW-BAT-LI22-3X",
  "bat-li22-5x": "OW-BAT-LI22-5X",
  "beanie": "OW-MRC-BEAN",
  "bld-custom": "OW-BLD-CUSTOM",
  "bld-labor": "OW-BLD-LABOR",
  "cam-gm1": "OW-CAM-GM1",
  "cam-gm3": "OW-CAM-GM3",
  "cam-gp12": "OW-CAM-GP12",
  "cam-map": "OW-CAM-MAP",
  "cam-sony": "OW-CAM-SONY",
  "cam-therm": "OW-CAM-THERM",
  "cap": "OW-MRC-CAP",
  "crg-box": "OW-CRG-BOX",
  "crg-dual": "OW-CRG-DUAL",
  "crg-mag": "OW-CRG-MAG",
  "crg-srv": "OW-CRG-SRV",
  "crg-winch": "OW-CRG-WINCH",
  "def-aeris": "DEF-RAD-AERIS10X",
  "def-sentinel": "DEF-LCH-SENTINEL-MKI",
  "def-talon": "DEF-INT-TALON-MKI",
  "def-vanguard": "DEF-SYS-VANGUARD",
  "edu-cuas": "OW-EDU-CUAS",
  "edu-hobby": "OW-EDU-HOBBY",
  "edu-hs": "OW-EDU-HS",
  "edu-org": "OW-EDU-ORG",
  "edu-part107": "OW-EDU-P107",
  "edu-sar": "OW-EDU-SAR",
  "edu-sped": "OW-EDU-SPED",
  "ember-ir": "OW-PLT-SMKJP",
  "esc-30a": "OW-ESC-30A",
  "esc-50a": "OW-ESC-50A",
  "esc-fw40": "OW-ESC-FW40",
  "esc-hw60": "OW-ESC-HW60",
  "esc-hw80": "OW-ESC-HW80",
  "esc-sb55": "OW-ESC-SB55",
  "esc-sb60": "OW-ESC-SB60",
  "fc-cube": "OW-FC-CUBE",
  "fc-f405v4": "OW-FC-F405V4",
  "fc-f405w": "OW-FC-F405W",
  "fc-f405wm": "OW-FC-F405WM",
  "fc-f722": "OW-FC-F722",
  "fc-pix6c": "OW-FC-PIX6C",
  "fc-pix6cm": "OW-FC-PIX6CM",
  "fld-bag": "OW-FLD-BAG",
  "fld-chg": "OW-FLD-CHG",
  "fld-flag": "OW-FLD-FLAG",
  "fld-pad": "OW-FLD-PAD",
  "fld-padl": "OW-FLD-PADL",
  "fld-prop": "OW-FLD-PROP",
  "fld-straps": "OW-FLD-STRAPS",
  "fld-tarp": "OW-FLD-TARP",
  "fld-tool": "OW-FLD-TOOL",
  "fld-winds": "OW-FLD-WINDS",
  "fpv-ana": "OW-FPV-ANA",
  "fpv-cad": "OW-FPV-CAD",
  "fpv-dji": "OW-FPV-DJI",
  "fpv-djim": "OW-FPV-DJIM",
  "fpv-ws": "OW-FPV-WS",
  "fw-ar2": "OW-FW-AR2",
  "fw-lark": "OW-FW-LARK",
  "fw-moose": "OW-FW-MOOSE",
  "fw-nano": "OW-FW-NANO",
  "fw-pico": "OW-FW-PICO",
  "fw-plank": "OW-FW-PLANK",
  "fw-stallion": "OW-FW-STALLION",
  "fw-stingray": "OW-FW-STINGRAY",
  "fw-stork": "OW-FW-STORK",
  "fw-talon": "OW-FW-TALON",
  "gnd-ant": "OW-GND-ANT",
  "gnd-boost": "OW-GND-BOOST",
  "gnd-gog": "OW-GND-GOG",
  "gnd-gogd": "OW-GND-GOGD",
  "gnd-mon": "OW-GND-MON",
  "gnd-track": "OW-GND-TRACK",
  "gnd-tx12": "OW-GND-TX12",
  "gnd-tx16": "OW-GND-TX16",
  "gps-bn880": "OW-GPS-BN880",
  "gps-m10c": "OW-GPS-M10C",
  "gps-m10q": "OW-GPS-M10Q",
  "gps-m9n": "OW-GPS-M9N",
  "gps-rtk": "OW-GPS-RTK",
  "hoodie": "OW-MRC-HOOD",
  "lnch-bung": "OW-LNH-BUNG",
  "lnch-cat": "OW-LNH-CAT",
  "lnch-net": "OW-LNH-NET",
  "lnch-para": "OW-LNH-PARA",
  "lnch-paras": "OW-LNH-PARAS",
  "mot-2306": "OW-MOT-2306",
  "mot-2807": "OW-MOT-2807",
  "mot-2812": "OW-MOT-2812",
  "mot-bh910": "OW-MOT-BH910",
  "mot-f60": "OW-MOT-F60",
  "mot-f90": "OW-MOT-F90",
  "mot-fw13": "OW-MOT-FW13",
  "mot-fw17": "OW-MOT-FW17",
  "mot-u10": "OW-MOT-U10",
  "mot-u5": "OW-MOT-U5",
  "mot-u8": "OW-MOT-U8",
  "mr-10q": "OW-MR-10Q",
  "mr-5dc": "OW-MR-5DC",
  "mr-5q": "OW-MR-5Q",
  "mr-7q": "OW-MR-7Q",
  "mr-7x": "OW-MR-7X",
  "mr-hex": "OW-MR-HEX",
  "mr-hexf": "OW-MR-HEXF",
  "mr-hexl": "OW-MR-HEXL",
  "mr-octo": "OW-MR-OCTO",
  "mr-tri": "OW-MR-TRI",
  "rx-drg": "OW-RX-DRG",
  "rx-elrs24": "OW-RX-ELRS24",
  "rx-elrs9": "OW-RX-ELRS9",
  "rx-ghost": "OW-RX-GHOST",
  "rx-tbs": "OW-RX-TBS",
  "spark-micro": "OW-PLT-FRANK",
  "srv-ds": "OW-SRV-DS",
  "srv-es08": "OW-SRV-ES08",
  "srv-hw": "OW-SRV-HW",
  "srv-mg90": "OW-SRV-MG90",
  "srv-sa21": "OW-SRV-SA21",
  "svc-insp": "OW-SVC-INSP",
  "svc-map": "OW-SVC-MAP",
  "svc-photo": "OW-SVC-PHOTO",
  "tee-classic": "OW-MRC-TEE",
  "titan-x8": "OW-PLT-IRNHR",
  "trn-foam": "OW-TRN-FOAM",
  "trn-pel1": "OW-TRN-PEL1",
  "trn-pel2": "OW-TRN-PEL2",
  "trn-pel3": "OW-TRN-PEL3",
  "trn-soft": "OW-TRN-SOFT",
  "trn-tube": "OW-TRN-TUBE",
  "vista-6k": "OW-PLT-ADAMS",
  "volt-fpv": "OW-PLT-DAYTN",
  "vtol-kit": "OW-VTOL-KIT"
};
OW.MERCH_BASE = {
  "beanie": "OW-MRC-BEAN",
  "cap": "OW-MRC-CAP",
  "hoodie": "OW-MRC-HOOD",
  "tee-classic": "OW-MRC-TEE"
};
OW.COLOR_CODES = {
  "Black": "BLK",
  "White": "WHT",
  "Red": "RED",
  "Blue": "BLU",
  "Grey": "GRY",
  "Gray": "GRY",
  "Green": "GRN",
  "Pink": "PNK",
  "Purple": "PRP",
  "Yellow": "YLW"
};

document.addEventListener('DOMContentLoaded', () => OW.init());

// ── NAV HTML (injected by each page) ─────────────────────────────────────────
function renderNav() {
  return `
  <nav class="nav">
    <a class="nav-logo" href="index.html">
      <div class="nav-logo-icon">
        <img src="img/logo-mark.webp" alt="OrbitWorks" width="34" height="34" loading="eager" decoding="async">
      </div>
      ORBITWORKS AEROSPACE
    </a>
    <ul class="nav-links">
      <li><a href="index.html" class="btn btn-sm nav-hex">Home</a></li>
      <li><a href="shop.html" class="btn btn-sm nav-hex">Shop</a></li>
      <li><a href="build-a-drone.html" class="btn btn-sm nav-hex">Build</a></li>
      <li><a href="about.html" class="btn btn-sm nav-hex">About</a></li>
      <li><a href="contact.html" class="btn btn-sm nav-cta">Contact</a></li>
      <li><a href="defense.html" class="btn btn-sm nav-defense">Defense</a></li>
    </ul>
    <div class="hamburger" id="hamburger">
      <span></span><span></span><span></span>
    </div>
  </nav>`;
}

function renderFooter() {
  return `
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a class="nav-logo" href="index.html" style="margin-bottom:0">
            <div class="nav-logo-icon">
              <img src="img/logo-mark.webp" alt="OrbitWorks" width="34" height="34" loading="eager" decoding="async">
            </div>
            ORBITWORKS AEROSPACE
          </a>
          <p>US-built drones for photography, FPV, mapping, education, and commercial ops. Designed and assembled in Binghamton, NY — American makers, open skies.</p>
        </div>
        <div class="footer-col">
          <h4>Company</h4>
          <ul>
            <li><a href="about.html">About Us</a></li>
            <li><a href="about.html#board">The Board</a></li>
            <li><a href="contact.html">Contact</a></li>
            <li><a href="privacy.html">Privacy</a></li>
            <li><a href="terms.html">Terms</a></li>
            <li><a href="https://orbitworksaerospace.substack.com" target="_blank" rel="noopener">Substack Blog</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Products & Services</h4>
          <ul>
            <li><a href="shop.html">Shop</a></li>
            <li><a href="build-a-drone.html">Build Your Drone</a></li>
            <li><a href="shop.html#drones">Drone Platforms</a></li>
            <li><a href="index.html#services">Aerial Services</a></li>
            <li><a href="shop.html#education">Education</a></li>
            <li><a href="shop.html#merch">Merch</a></li>
            <li><a href="defense.html">Defense Portal</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Contact</h4>
          <ul>
            <li><a href="mailto:s.sanders@orbitworksaerospace.com">s.sanders@orbitworksaerospace.com</a></li>
            <li><a href="https://orbitworksaerospace.substack.com" target="_blank">Substack</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} OrbitWorks Aerospace Inc. &middot; Binghamton, NY &middot; All rights reserved. &middot; <a href="privacy.html" style="color:inherit;text-decoration:underline">Privacy</a> &middot; <a href="terms.html" style="color:inherit;text-decoration:underline">Terms</a></p>
        <span class="mono">v3.0.0 &middot; Built in-house</span>
      </div>
    </div>
  </footer>
  <!-- Cart drawer -->
  <div class="cart-overlay" id="cartOverlay" onclick="OW.closeCart()"></div>
  <div class="cart-drawer" id="cartDrawer">
    <div class="cart-header">
      <h3>Cart</h3>
      <button class="cart-close" onclick="OW.closeCart()">✕</button>
    </div>
    <div class="cart-items" id="cartItems"></div>
    <div class="cart-footer">
      <div class="cart-total">Total <span id="cartTotal">$0.00</span></div>
      <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="OW.checkout()">Checkout</button>
    </div>
  </div>
  <!-- Floating cart -->
  <div class="cart-icon" onclick="OW.openCart()">
    <img src="img/logo-mark.webp" alt="OrbitWorks" width="40" height="40" style="width:100%;height:100%;object-fit:contain;border-radius:50%" loading="lazy" decoding="async">
    <span class="cart-badge" id="cartBadge" style="display:none">0</span>
  </div>
  <!-- Toast -->
  <div class="toast toast-accent" id="toast"></div>`;
}
