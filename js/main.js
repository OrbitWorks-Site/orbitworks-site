// ── OrbitWorks Aerospace · Global JS ─────────────────────────────────────────

// ── SHARED DATA STORE ───────────────────────────────────────────────────────
const OW = {
  version: '2.2.0',

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
    this.showToast(`Added ${item.name} to cart`);
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
          <span class="cart-item-icon">${item.icon || 'OW'}</span>
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
    this.showToast('Checkout coming soon — email s.sanders@orbitworksaerospace.com');
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

  // ── HEXAGON GRID BACKGROUND (home page hero) ─────────────────────────────
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
    function drawHex(cx, cy, r) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const r = 40;
      const dx = r * Math.sqrt(3);
      const dy = r * 1.5;
      ctx.strokeStyle = 'rgba(0,212,255,0.06)';
      ctx.lineWidth = 1;
      for (let row = -1; row < h / dy + 1; row++) {
        for (let col = -1; col < w / dx + 1; col++) {
          const x = col * dx + (row % 2 === 0 ? 0 : dx / 2);
          const y = row * dy;
          drawHex(x, y, r);
        }
      }
    }
    resize();
    window.addEventListener('resize', resize);
  },

  // ── MOLECULE GRID BACKGROUND (shop page) ──────────────────────────────────
  initMoleculeGrid() {
    const canvas = document.getElementById('moleculeCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, nodes = [], time = 0;

    // Gold palette
    const GOLD      = 'rgba(184,148,46,';
    const GOLD_DARK = 'rgba(138,110,30,';

    function resize() {
      w = canvas.width  = window.innerWidth;
      h = canvas.height = window.innerHeight - 60;
      generateNodes();
      draw();
    }

    function generateNodes() {
      nodes = [];
      // Grid-based placement with organic jitter for 60-70% coverage
      const spacing = 90;
      const cols = Math.ceil(w / spacing) + 2;
      const rows = Math.ceil(h / spacing) + 2;
      const seed = 42;
      let idx = 0;

      for (let r = -1; r < rows; r++) {
        for (let c = -1; c < cols; c++) {
          idx++;
          // Pseudo-random based on position
          const px = Math.sin(idx * 127.1 + seed) * 43758.5453;
          const py = Math.sin(idx * 269.5 + seed * 1.7) * 43758.5453;
          const rndX = (px - Math.floor(px)) - 0.5;
          const rndY = (py - Math.floor(py)) - 0.5;

          // ~70% chance to place a node (coverage control)
          const chance = Math.sin(idx * 311.7) * 43758.5453;
          if ((chance - Math.floor(chance)) > 0.72) continue;

          const x = c * spacing + rndX * spacing * 0.7 + (r % 2 === 0 ? 0 : spacing * 0.5);
          const y = r * spacing + rndY * spacing * 0.5;

          // Randomize node type: hex, circle, or small dot
          const typeRnd = Math.sin(idx * 457.3) * 43758.5453;
          const t = (typeRnd - Math.floor(typeRnd));
          let type, radius;
          if (t < 0.35) {
            type = 'hex';
            radius = 12 + (rndX + 0.5) * 16;
          } else if (t < 0.6) {
            type = 'circle';
            radius = 4 + (rndY + 0.5) * 10;
          } else {
            type = 'dot';
            radius = 2 + (rndX + 0.5) * 4;
          }

          // Subtle drift parameters
          const driftSpeed = 0.2 + (rndX + 0.5) * 0.4;
          const driftAmp   = 2 + (rndY + 0.5) * 4;
          const driftPhase = idx * 0.7;

          nodes.push({ x, y, type, radius, driftSpeed, driftAmp, driftPhase,
                        opacity: 0.04 + (rndX + 0.5) * 0.08 });
        }
      }
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

    function draw() {
      ctx.clearRect(0, 0, w, h);
      time += 0.008;

      const maxDist = 140;

      // Draw bonds (connections) between nearby nodes
      ctx.lineWidth = 0.8;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        const ax = a.x + Math.sin(time * a.driftSpeed + a.driftPhase) * a.driftAmp;
        const ay = a.y + Math.cos(time * a.driftSpeed * 0.7 + a.driftPhase) * a.driftAmp * 0.6;
        // Only check forward to avoid double-drawing
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const bx = b.x + Math.sin(time * b.driftSpeed + b.driftPhase) * b.driftAmp;
          const by = b.y + Math.cos(time * b.driftSpeed * 0.7 + b.driftPhase) * b.driftAmp * 0.6;
          const dx = ax - bx;
          const dy = ay - by;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.06;
            ctx.strokeStyle = GOLD + alpha + ')';
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      for (const n of nodes) {
        const nx = n.x + Math.sin(time * n.driftSpeed + n.driftPhase) * n.driftAmp;
        const ny = n.y + Math.cos(time * n.driftSpeed * 0.7 + n.driftPhase) * n.driftAmp * 0.6;

        if (n.type === 'hex') {
          ctx.strokeStyle = GOLD + n.opacity + ')';
          ctx.lineWidth = 1;
          drawHex(nx, ny, n.radius);
          ctx.stroke();
          // Faint fill
          ctx.fillStyle = GOLD + (n.opacity * 0.25) + ')';
          drawHex(nx, ny, n.radius);
          ctx.fill();
        } else if (n.type === 'circle') {
          ctx.strokeStyle = GOLD_DARK + n.opacity + ')';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(nx, ny, n.radius, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = GOLD + (n.opacity * 0.3) + ')';
          ctx.fill();
        } else {
          // dot — small filled circles at bond intersections
          ctx.fillStyle = GOLD + (n.opacity * 1.5) + ')';
          ctx.beginPath();
          ctx.arc(nx, ny, n.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
  },

  // ── INIT ──────────────────────────────────────────────────────────────────
  init() {
    this.initNav();
    this.initScrollAnim();
    this.updateCartBadge();
    this.renderCart();
    this.initHexGrid();
    this.initMoleculeGrid();
  }
};

document.addEventListener('DOMContentLoaded', () => OW.init());

// ── NAV HTML (injected by each page) ─────────────────────────────────────────
function renderNav() {
  return `
  <nav class="nav">
    <a class="nav-logo" href="index.html">
      <div class="nav-logo-icon">
        <svg viewBox="0 0 32 32" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 2L28.66 9.5V24.5L16 32L3.34 24.5V9.5L16 2Z" stroke="#00d4ff" stroke-width="1.5" fill="rgba(0,212,255,0.08)"/>
          <path d="M16 8L22.93 12V20L16 24L9.07 20V12L16 8Z" stroke="#00d4ff" stroke-width="1" fill="rgba(0,212,255,0.12)"/>
          <circle cx="16" cy="16" r="3" fill="#00d4ff" opacity="0.6"/>
        </svg>
      </div>
      ORBITWORKS AEROSPACE
    </a>
    <ul class="nav-links">
      <li><a href="index.html">Home</a></li>
      <li><a href="about.html">About</a></li>
      <li><a href="shop.html">Shop</a></li>
      <li><a href="contact.html">Contact</a></li>
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
              <svg viewBox="0 0 32 32" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2L28.66 9.5V24.5L16 32L3.34 24.5V9.5L16 2Z" stroke="#00d4ff" stroke-width="1.5" fill="rgba(0,212,255,0.08)"/>
                <path d="M16 8L22.93 12V20L16 24L9.07 20V12L16 8Z" stroke="#00d4ff" stroke-width="1" fill="rgba(0,212,255,0.12)"/>
                <circle cx="16" cy="16" r="3" fill="#00d4ff" opacity="0.6"/>
              </svg>
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
            <li><a href="shop.html#training">Pilot Training</a></li>
            <li><a href="shop.html#merch">Merch</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Contact</h4>
          <ul>
            <li><a href="mailto:s.sanders@orbitworksaerospace.com">s.sanders@orbitworksaerospace.com</a></li>
            <li><a href="https://www.facebook.com/orbitworksaerospace" target="_blank">Facebook</a></li>
            <li><a href="https://orbitworksaerospace.substack.com" target="_blank">Substack</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} OrbitWorks Aerospace Inc. &middot; Binghamton, NY &middot; All rights reserved.</p>
        <span class="mono">v2.2.0 &middot; Built in-house</span>
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a0c10" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
    <span class="cart-badge" id="cartBadge" style="display:none">0</span>
  </div>
  <!-- Toast -->
  <div class="toast toast-accent" id="toast"></div>`;
}
