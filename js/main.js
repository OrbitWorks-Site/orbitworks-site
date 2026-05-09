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
        });
      });
    });
    document.querySelectorAll('.size-buttons').forEach(group => {
      group.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          group.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
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
      return `${item.name}${variants ? ' ('+variants+')' : ''} x${item.qty||1} — $${(item.price*(item.qty||1)).toFixed(2)}`;
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

  // ── INIT ──────────────────────────────────────────────────────────────────
  init() {
    this.initNav();
    this.initScrollAnim();
    this.updateCartBadge();
    this.renderCart();
    this.initHexGrid();
    this.initShopHexGrid();
    this.initVariantPickers();
    this.renderCheckout();
    this.initPayTabs();
  }
};

document.addEventListener('DOMContentLoaded', () => OW.init());

// ── NAV HTML (injected by each page) ─────────────────────────────────────────
function renderNav() {
  return `
  <nav class="nav">
    <a class="nav-logo" href="index.html">
      <div class="nav-logo-icon">
        <img src="img/logo.png" alt="OrbitWorks Logo" width="28" height="28" style="object-fit:contain;">
      </div>
      ORBITWORKS AEROSPACE
    </a>
    <ul class="nav-links">
      <li><a href="index.html" class="btn btn-sm nav-hex">Home</a></li>
      <li><a href="about.html" class="btn btn-sm nav-hex">About</a></li>
      <li><a href="shop.html" class="btn btn-sm nav-hex">Shop</a></li>
      <li><a href="contact.html" class="btn btn-sm nav-cta">Get Quote</a></li>
      <li><a href="defense.html" class="btn btn-sm nav-defense">DEFENSE</a></li>
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
              <img src="img/logo.png" alt="OrbitWorks Logo" width="28" height="28" style="object-fit:contain;">
            </div>
            ORBITWORKS AEROSPACE
          </a>
          <p>Advanced aerospace defense and drone technology. Protecting the skies for the United States and our allies. Binghamton, NY.</p>
        </div>
        <div class="footer-col">
          <h4>Company</h4>
          <ul>
            <li><a href="about.html">About Us</a></li>
            <li><a href="about.html#board">The Board</a></li>
            <li><a href="contact.html">Contact</a></li>
            <li><a href="https://orbitworksaerospace.substack.com" target="_blank">Substack Blog</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Products & Services</h4>
          <ul>
            <li><a href="shop.html">Shop</a></li>
            <li><a href="shop.html#drones">Commercial Drones</a></li>
            <li><a href="shop.html#services">Aerial Services</a></li>
            <li><a href="shop.html#education">Education Services</a></li>
            <li><a href="shop.html#merch">Merch</a></li>
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
        <p>&copy; ${new Date().getFullYear()} OrbitWorks Aerospace Inc. &middot; Binghamton, NY &middot; All rights reserved.</p>
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="5" r="2.5"/><circle cx="19" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><line x1="7" y1="6.5" x2="10.5" y2="10.5"/><line x1="17" y1="6.5" x2="13.5" y2="10.5"/><line x1="7" y1="17.5" x2="10.5" y2="13.5"/><line x1="17" y1="17.5" x2="13.5" y2="13.5"/><rect x="10" y="10" width="4" height="4" rx="1"/></svg>
    <span class="cart-badge" id="cartBadge" style="display:none">0</span>
  </div>
  <!-- Toast -->
  <div class="toast toast-accent" id="toast"></div>`;
}
