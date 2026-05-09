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
      ctx.strokeStyle = 'rgba(16,185,129,0.04)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < w; x += spacing / 4) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += spacing / 4) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Major grid lines
      ctx.strokeStyle = 'rgba(16,185,129,0.07)';
      ctx.lineWidth = 0.8;
      for (let x = 0; x < w; x += spacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y < h; y += spacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      // Intersection crosses at major grid points
      ctx.strokeStyle = 'rgba(16,185,129,0.1)';
      ctx.lineWidth = 1;
      const crossSize = 4;
      for (let x = 0; x < w; x += spacing) {
        for (let y = 0; y < h; y += spacing) {
          ctx.beginPath(); ctx.moveTo(x - crossSize, y); ctx.lineTo(x + crossSize, y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x, y - crossSize); ctx.lineTo(x, y + crossSize); ctx.stroke();
        }
      }

      // Diagonal accent lines (schematic/blueprint feel)
      ctx.strokeStyle = 'rgba(16,185,129,0.025)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([6, 12]);
      for (let i = -h; i < w + h; i += spacing * 2) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + h, h); ctx.stroke();
      }
      ctx.setLineDash([]);

      // Coordinate labels at select intersections
      ctx.fillStyle = 'rgba(16,185,129,0.06)';
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
    const LINE_COLOR   = 'rgba(16,185,129,0.07)';
    const FILL_COLOR   = 'rgba(16,185,129,0.02)';
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

  // ── INIT ──────────────────────────────────────────────────────────────────
  init() {
    this.initNav();
    this.initScrollAnim();
    this.updateCartBadge();
    this.renderCart();
    this.initHexGrid();
    this.initShopHexGrid();
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
          <path d="M16 2L28.66 9.5V24.5L16 32L3.34 24.5V9.5L16 2Z" stroke="#10b981" stroke-width="1.5" fill="rgba(16,185,129,0.08)"/>
          <path d="M16 8L22.93 12V20L16 24L9.07 20V12L16 8Z" stroke="#10b981" stroke-width="1" fill="rgba(16,185,129,0.12)"/>
          <circle cx="16" cy="16" r="3" fill="#10b981" opacity="0.6"/>
        </svg>
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
              <svg viewBox="0 0 32 32" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2L28.66 9.5V24.5L16 32L3.34 24.5V9.5L16 2Z" stroke="#10b981" stroke-width="1.5" fill="rgba(16,185,129,0.08)"/>
                <path d="M16 8L22.93 12V20L16 24L9.07 20V12L16 8Z" stroke="#10b981" stroke-width="1" fill="rgba(16,185,129,0.12)"/>
                <circle cx="16" cy="16" r="3" fill="#10b981" opacity="0.6"/>
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
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="#0a0c10" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <!-- Cargo drone: body -->
      <rect x="11" y="13" width="10" height="7" rx="1.5"/>
      <!-- Arms -->
      <line x1="11" y1="14.5" x2="5" y2="10"/>
      <line x1="21" y1="14.5" x2="27" y2="10"/>
      <line x1="11" y1="18.5" x2="5" y2="23"/>
      <line x1="21" y1="18.5" x2="27" y2="23"/>
      <!-- Rotors -->
      <circle cx="5" cy="10" r="3"/>
      <circle cx="27" cy="10" r="3"/>
      <circle cx="5" cy="23" r="3"/>
      <circle cx="27" cy="23" r="3"/>
      <!-- Cargo package -->
      <rect x="13" y="22" width="6" height="4" rx="0.5" stroke-dasharray="2 1"/>
      <line x1="16" y1="20" x2="16" y2="22"/>
    </svg>
    <span class="cart-badge" id="cartBadge" style="display:none">0</span>
  </div>
  <!-- Toast -->
  <div class="toast toast-accent" id="toast"></div>`;
}
