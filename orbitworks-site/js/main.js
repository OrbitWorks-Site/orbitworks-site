// ── OrbitWorks Aerospace · Global JS ─────────────────────────────────────────

// ── SHARED DATA STORE (mimics Hub app sync) ──────────────────────────────────
const OW = {
  version: '1.0.0',

  // Simulated live data from Hub app
  hubData: {
    projects: [
      { id: 'p1', name: 'Vanguard SHORAD', progress: 67, status: 'active', color: '#00d4ff' },
      { id: 'p2', name: 'AERIS-10X Radar', progress: 82, status: 'active', color: '#a78bfa' },
      { id: 'p3', name: 'Talon Mk.I', progress: 34, status: 'pending', color: '#fb923c' },
      { id: 'p4', name: 'DDTC / Regulatory', progress: 90, status: 'review', color: '#ef4444' },
      { id: 'p5', name: 'Tier I Facility', progress: 18, status: 'planning', color: '#4ade80' },
    ],
    tasks: [
      { title: 'Finalize DDTC Registration', priority: 'high', status: 'todo', due: '2025-05-08' },
      { title: 'AERIS-10X simulation run', priority: 'high', status: 'inprogress', due: '2025-05-12' },
      { title: 'Tier I facility floor plan', priority: 'med', status: 'inprogress', due: '2025-05-20' },
    ],
    notifications: [
      { icon: '⚠️', title: 'Task Overdue', body: 'IQT follow-up email overdue.', time: Date.now() - 7200000, read: false },
      { icon: '✅', title: 'DDTC Filing Review complete', body: 'Marked complete by Steven Sanders.', time: Date.now() - 172800000, read: true },
    ],
    stats: { projects: 5, openTasks: 6, teamSize: 2, completedTasks: 12 },
  },

  // ── CART ──────────────────────────────────────────────────────────────────
  cart: JSON.parse(localStorage.getItem('ow_cart') || '[]'),

  saveCart() {
    localStorage.setItem('ow_cart', JSON.stringify(this.cart));
    this.renderCart();
    this.updateCartBadge();
  },

  addToCart(item) {
    const existing = this.cart.find(i => i.id === item.id);
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      this.cart.push({ ...item, qty: 1 });
    }
    this.saveCart();
    this.showToast(`✅ ${item.name} added to cart`);
    this.openCart();
  },

  removeFromCart(id) {
    this.cart = this.cart.filter(i => i.id !== id);
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
      el.innerHTML = this.cart.map(item => `
        <div class="cart-item">
          <span class="cart-item-icon">${item.icon || '📦'}</span>
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">$${item.price.toFixed(2)} × ${item.qty || 1}</div>
          </div>
          <button class="cart-item-remove" onclick="OW.removeFromCart('${item.id}')">✕</button>
        </div>
      `).join('');
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
    this.showToast('🚧 Checkout coming soon — email orders@orbitworksaerospace.com');
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
    // Set active link
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

  // ── INIT ──────────────────────────────────────────────────────────────────
  init() {
    this.initNav();
    this.initScrollAnim();
    this.updateCartBadge();
    this.renderCart();
  }
};

document.addEventListener('DOMContentLoaded', () => OW.init());

// ── NAV HTML (injected by each page) ─────────────────────────────────────────
function renderNav() {
  return `
  <nav class="nav">
    <a class="nav-logo" href="index.html">
      <div class="nav-logo-icon">🛡️</div>
      ORBITWORKS AEROSPACE
    </a>
    <ul class="nav-links">
      <li><a href="index.html">Home</a></li>
      <li><a href="about.html">About</a></li>
      <li><a href="drones.html">Drones</a></li>
      <li><a href="services.html">Services</a></li>
      <li><a href="merch.html">Merch</a></li>
      <li><a href="drone-aid.html">Drone Aid</a></li>
      <li><a href="contact.html">Contact</a></li>
      <li><a href="contact.html" class="btn btn-sm nav-cta">Get Quote</a></li>
      <li><a href="defense.html" class="btn btn-sm nav-defense">🔒 DEFENSE</a></li>
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
            <div class="nav-logo-icon">🛡️</div>
            ORBITWORKS AEROSPACE
          </a>
          <p>Innovative drone solutions for commercial, humanitarian, and defense applications. Based in Vestal, NY.</p>
          <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap;">
            <span class="badge badge-accent">FAA Part 107 Certified</span>
            <span class="badge badge-success">NDAA Compliant</span>
          </div>
        </div>
        <div class="footer-col">
          <h4>Company</h4>
          <ul>
            <li><a href="about.html">About Us</a></li>
            <li><a href="drone-aid.html">Drone Aid Operations</a></li>
            <li><a href="contact.html">Contact</a></li>
            <li><a href="https://orbitworksaerospace.substack.com" target="_blank">Substack Blog</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Products & Services</h4>
          <ul>
            <li><a href="drones.html">Commercial Drones</a></li>
            <li><a href="services.html">Aerial Photography</a></li>
            <li><a href="services.html">Mapping & Survey</a></li>
            <li><a href="services.html">Pilot Training</a></li>
            <li><a href="merch.html">Merch Shop</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Contact</h4>
          <ul>
            <li><a href="tel:6072062671">(607) 206-2671</a></li>
            <li><a href="mailto:s.sanders@orbitworksaerospace.com">s.sanders@orbitworksaerospace.com</a></li>
            <li><a href="mailto:orders@orbitworksaerospace.com">orders@orbitworksaerospace.com</a></li>
            <li><a href="https://twitter.com/OrbitworksA" target="_blank">@OrbitworksA</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>© 2025 OrbitWorks Aerospace Inc. · Vestal, NY · All rights reserved.</p>
        <span class="mono">v1.0.0 · Built in-house</span>
      </div>
    </div>
  </footer>
  <!-- Cart drawer -->
  <div class="cart-overlay" id="cartOverlay" onclick="OW.closeCart()"></div>
  <div class="cart-drawer" id="cartDrawer">
    <div class="cart-header">
      <h3>🛒 Cart</h3>
      <button class="cart-close" onclick="OW.closeCart()">✕</button>
    </div>
    <div class="cart-items" id="cartItems"></div>
    <div class="cart-footer">
      <div class="cart-total">Total <span id="cartTotal">$0.00</span></div>
      <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="OW.checkout()">Checkout →</button>
    </div>
  </div>
  <!-- Floating cart -->
  <div class="cart-icon" onclick="OW.openCart()">
    🛒
    <span class="cart-badge" id="cartBadge" style="display:none">0</span>
  </div>
  <!-- Toast -->
  <div class="toast toast-accent" id="toast"></div>`;
}
