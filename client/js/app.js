let _cleanupFns = [];
function registerCleanup(fn) { _cleanupFns.push(fn); }

function navigate(hash) { window.location.hash = hash; }

function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function categoryEmoji(cat) {
  const map = { electronics: '💻', accessories: '⌚', antiques: '🏺', sports: '🚴', furniture: '🛋️', clothing: '👗', jewelry: '💎', art: '🎨', books: '📚' };
  return map[(cat || '').toLowerCase()] || '📦';
}

function categoryBadgeClass(cat) {
  const map = { electronics: 'badge-electronics', accessories: 'badge-accessories', antiques: 'badge-antiques', sports: 'badge-sports', furniture: 'badge-furniture' };
  return map[(cat || '').toLowerCase()] || 'badge-default';
}

function formatMoney(n) {
  return '$' + Number(n).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCountdown(seconds) {
  if (seconds <= 0) return { text: 'Ended', urgency: 'ended', d: 0, h: 0, m: 0, s: 0 };
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const urgency = seconds < 3600 ? 'urgent' : seconds < 86400 ? 'warning' : '';
  const text = d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`;
  return { text, urgency, d, h, m, s };
}

function parseImages(imageUrl) {
  if (!imageUrl) return [];
  const s = String(imageUrl).trimStart();
  if (s.startsWith('[')) {
    try { return JSON.parse(s).filter(Boolean); } catch {}
  }
  return [imageUrl];
}

function formatDate(iso) {
  if (!iso) return '—';
  // Append Z if no timezone info so the browser treats it as UTC and converts to local time
  const normalized = String(iso).endsWith('Z') || String(iso).includes('+') ? iso : iso + 'Z';
  return new Date(normalized).toLocaleString('en-CA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const Purchases = {
  get() { try { return JSON.parse(sessionStorage.getItem('wb_purchases') || '[]'); } catch { return []; } },
  add(itemId) {
    const list = Purchases.get();
    if (!list.includes(Number(itemId))) { list.push(Number(itemId)); sessionStorage.setItem('wb_purchases', JSON.stringify(list)); }
  },
};

const DarkMode = {
  init() {
    if (localStorage.getItem('wb_dark') === '1') document.body.classList.add('dark');
  },
  toggle() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('wb_dark', isDark ? '1' : '0');
  },
  isDark() { return document.body.classList.contains('dark'); },
};

// Canvas particle effect with mouse-tracking glow — used on the home hero and login panel
function startCanvasEffect(canvasId, parent, alwaysOrange = false) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const mouse  = { x: -999, y: -999, active: false };
  const smooth = { x: -999, y: -999 };

  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  }
  function onMouseLeave() { mouse.active = false; }
  parent.addEventListener('mousemove', onMouseMove);
  parent.addEventListener('mouseleave', onMouseLeave);

  const particles = Array.from({ length: 60 }, () => spawnParticle(true));

  function spawnParticle(randomY = false) {
    return {
      x:     Math.random() * canvas.width,
      y:     randomY ? Math.random() * canvas.height : canvas.height + 10,
      r:     Math.random() * 1.8 + 0.4,
      vx:    (Math.random() - 0.5) * 0.4,
      vy:    -(Math.random() * 0.5 + 0.25),
      alpha: Math.random() * 0.5 + 0.1,
      pulse: Math.random() * Math.PI * 2,
    };
  }

  let raf;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    smooth.x += (mouse.x - smooth.x) * 0.07;
    smooth.y += (mouse.y - smooth.y) * 0.07;

    const dark = !alwaysOrange && document.body.classList.contains('dark');

    if (mouse.active) {
      const gc = dark ? '20, 12, 8' : '200, 80, 42';
      const grad = ctx.createRadialGradient(smooth.x, smooth.y, 0, smooth.x, smooth.y, 260);
      grad.addColorStop(0,    `rgba(${gc}, 0.18)`);
      grad.addColorStop(0.35, `rgba(${gc}, 0.09)`);
      grad.addColorStop(0.7,  `rgba(${gc}, 0.03)`);
      grad.addColorStop(1,    `rgba(${gc}, 0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    for (const p of particles) {
      p.pulse += 0.02;
      p.x += p.vx;
      p.y += p.vy;
      const a = p.alpha * (0.6 + 0.4 * Math.sin(p.pulse));

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = dark ? `rgba(20, 12, 8, ${a * 1.4})` : `rgba(200, 80, 42, ${a})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x + p.r * 0.5, p.y - p.r * 0.5, p.r * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = dark ? `rgba(0, 0, 0, ${a})` : `rgba(255, 255, 255, ${a * 0.6})`;
      ctx.fill();

      if (p.y < -10 || p.x < -10 || p.x > canvas.width + 10) {
        Object.assign(p, spawnParticle());
      }
    }

    raf = requestAnimationFrame(draw);
  }

  draw();

  registerCleanup(() => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    parent.removeEventListener('mousemove', onMouseMove);
    parent.removeEventListener('mouseleave', onMouseLeave);
  });
}

function showModal({ title, body, confirmText = 'Confirm', confirmClass = 'btn-danger', onConfirm }) {
  const existing = document.getElementById('wb-modal-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'wb-modal-overlay';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box" role="dialog" aria-modal="true">
      <div class="modal-header">
        <div class="modal-title">${title}</div>
        <button class="modal-close" onclick="closeModal()" aria-label="Close">✕</button>
      </div>
      <div class="modal-body">${body}</div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button class="btn ${confirmClass}" id="modal-confirm-btn">${confirmText}</button>
      </div>
    </div>`;

  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('modal-open'));

  document.getElementById('modal-confirm-btn').addEventListener('click', () => {
    closeModal();
    onConfirm();
  });
}

function closeModal() {
  const overlay = document.getElementById('wb-modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('modal-open');
  overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
}

function renderNav() {
  const user = Auth.getUser();

  document.getElementById('header').innerHTML = `
    <nav class="nav">
      <div class="nav-brand" onclick="navigate('#/')">We<span>Build</span></div>
      <div class="nav-spacer"></div>
      <div class="nav-right">
        <button class="nav-icon-btn" onclick="DarkMode.toggle(); renderNav()" title="Toggle dark mode" id="dark-toggle">
          ${DarkMode.isDark() ? '☀️' : '🌙'}
        </button>
        ${user ? `
          <span class="nav-user-label">Signed in as <strong>${user.username}</strong></span>
          <div class="nav-menu" id="nav-menu">
            <button class="nav-menu-btn" onclick="toggleNavMenu(event)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <div class="nav-dropdown" id="nav-dropdown">
              <button class="nav-dropdown-item" onclick="closeNavMenu(); navigate('#/sell')"><span class="nav-dropdown-icon">🏷️</span> Sell an Item</button>
              <button class="nav-dropdown-item" onclick="closeNavMenu(); navigate('#/my-listings')"><span class="nav-dropdown-icon">📦</span> My Listings</button>
              <button class="nav-dropdown-item" onclick="closeNavMenu(); navigate('#/watchlist')"><span class="nav-dropdown-icon">🔖</span> Watchlist</button>
              <button class="nav-dropdown-item" onclick="closeNavMenu(); navigate('#/purchases')"><span class="nav-dropdown-icon">🧾</span> My Purchases</button>
              <button class="nav-dropdown-item" onclick="closeNavMenu(); navigate('#/ended')"><span class="nav-dropdown-icon">🏁</span> Past Auctions</button>
              <button class="nav-dropdown-item" onclick="closeNavMenu(); navigate('#/account')"><span class="nav-dropdown-icon">⚙️</span> Account Settings</button>
              <div class="nav-dropdown-divider"></div>
              <button class="nav-dropdown-item nav-dropdown-item-danger" onclick="closeNavMenu(); doLogout()"><span class="nav-dropdown-icon">🚪</span> Log Out</button>
            </div>
          </div>
        ` : `
          <button class="btn btn-outline nav-auth-btn" onclick="navigate('#/login')">Log In</button>
          <button class="btn btn-primary nav-auth-btn" onclick="navigate('#/signup')">Sign Up</button>
        `}
      </div>
    </nav>`;
}

function toggleNavMenu(e) {
  e.stopPropagation();
  document.getElementById('nav-dropdown').classList.toggle('open');
}

function closeNavMenu() {
  document.getElementById('nav-dropdown')?.classList.remove('open');
}

document.addEventListener('click', () => closeNavMenu());

async function doLogout() {
  await Api.signout();
  Auth.clear();
  renderNav();
  toast('Signed out successfully.', 'info');
  navigate('#/login');
}

const PUBLIC_ROUTES = ['#/login', '#/signup'];

async function route() {
  _cleanupFns.forEach(fn => { try { fn(); } catch {} });
  _cleanupFns = [];

  const hash = window.location.hash || '#/';
  const main = document.getElementById('main');

  renderNav();

  if (hash !== '#/' && hash !== '#') {
    const h = document.getElementById('home-hero');
    if (h) h.remove();
  }

  if (!Auth.isLoggedIn() && !PUBLIC_ROUTES.includes(hash)) {
    navigate('#/login');
    return;
  }

  if (Auth.isLoggedIn() && PUBLIC_ROUTES.includes(hash)) {
    navigate('#/');
    return;
  }

  if      (hash === '#/' || hash === '#')  renderHome(main);
  else if (hash === '#/login')             renderLogin(main);
  else if (hash === '#/signup')            renderSignup(main);
  else if (hash.startsWith('#/item/'))     renderItem(main, hash.split('/')[2]);
  else if (hash.startsWith('#/payment/'))  renderPayment(main, hash.split('/')[2]);
  else if (hash.startsWith('#/receipt/'))  renderReceipt(main, hash.split('/')[2]);
  else if (hash === '#/sell')              renderSell(main);
  else if (hash === '#/my-listings')       renderMyListings(main);
  else if (hash === '#/purchases')         renderPurchases(main);
  else if (hash === '#/ended')             renderEndedAuctions(main);
  else if (hash === '#/account')           renderAccount(main);
  else if (hash === '#/watchlist')         renderWatchlist(main);
  else                                     navigate('#/');
}

function buildChatBotButton() {
  if (document.getElementById('chatbot')) return;
  const button = document.createElement('button');
  button.id = 'chatbot';
  button.title = 'Chat Assistant';
  button.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>`;
  button.addEventListener('click', openChatBotWindow);
  document.body.appendChild(button);
}

function openChatBotWindow() {
  const existing = document.getElementById('chatbot-window');
  if (existing) {
    existing.classList.remove('chatbot-hidden');
    document.getElementById('chatbot-input')?.focus();
    return;
  }

  const win = document.createElement('div');
  win.id = 'chatbot-window';
  win.innerHTML = `
    <div id="chatbot-header">
      <div id="chatbot-header-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <div id="chatbot-header-text">
        <div id="chatbot-header-title">AI Chat Assistant</div>
        <div id="chatbot-header-sub">Ask about items or auctions</div>
      </div>
      <button class="chatbot-header-btn" title="Reset chat" onclick="resetChatBot()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.47"/>
        </svg>
      </button>
      <button class="chatbot-header-btn" title="Close" onclick="closeChatBotWindow()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div id="chatbot-messages">
      <div class="chatbot-msg chatbot-msg--ai">Hello! I can help you find items, check auction prices, or answer questions about WeBuild. What would you like to know?</div>
    </div>
    <div id="chatbot-input-row">
      <input id="chatbot-input" type="text" placeholder="Type your question…">
      <button id="chatbot-submit">Send</button>
    </div>`;
  document.body.appendChild(win);
  document.getElementById('chatbot-submit').addEventListener('click', submitChatBotPrompt);
  document.getElementById('chatbot-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitChatBotPrompt();
  });
  document.getElementById('chatbot-input').focus();
}

async function submitChatBotPrompt() {
  const input    = document.getElementById('chatbot-input');
  const messages = document.getElementById('chatbot-messages');
  const userText = input?.value?.trim();
  if (!userText) return;

  messages.innerHTML += `<div class="chatbot-msg chatbot-msg--user">${userText}</div>`;
  const loadingId = `chatbot-loading-${Date.now()}`;
  messages.innerHTML += `<div class="chatbot-msg chatbot-msg--ai" id="${loadingId}"><div class="spinner"></div> Thinking…</div>`;
  input.value = '';
  input.disabled = true;
  messages.scrollTop = messages.scrollHeight;

  try {
    const res = await Api.prompt(userText);
    document.getElementById(loadingId)?.remove();
    if (!res.ok) {
      const raw = res.data?.message || '';
      let errMsg;
      if (res.status === 0) {
        errMsg = 'Sorry, I\'m having trouble connecting. Please check your connection and try again.';
      } else if (res.status === 429 || raw.toLowerCase().includes('quota') || raw.toLowerCase().includes('too many')) {
        errMsg = 'Sorry, I\'m currently rate-limited due to high demand. Please try again in a moment.';
      } else if (raw.toLowerCase().includes('api key') || raw.toLowerCase().includes('invalid')) {
        errMsg = 'Sorry, the assistant is temporarily unavailable. Please try again later.';
      } else {
        errMsg = 'Sorry, I\'m having trouble processing your request right now. Please try again.';
      }
      messages.innerHTML += `<div class="chatbot-msg chatbot-msg--error">${errMsg}</div>`;
    } else {
      const aiText = res.data?.response ?? res.data?.message ?? JSON.stringify(res.data);
      messages.innerHTML += `<div class="chatbot-msg chatbot-msg--ai">${aiText}</div>`;
    }
  } catch {
    document.getElementById(loadingId)?.remove();
    messages.innerHTML += `<div class="chatbot-msg chatbot-msg--error">Could not reach the assistant. Please check your connection.</div>`;
  } finally {
    input.disabled = false;
    input.focus();
    messages.scrollTop = messages.scrollHeight;
  }
}

function closeChatBotWindow() {
  document.getElementById('chatbot-window')?.classList.add('chatbot-hidden');
}

function resetChatBot() {
  const messages = document.getElementById('chatbot-messages');
  if (messages) {
    messages.innerHTML = `<div class="chatbot-msg chatbot-msg--ai">Hello! I can help you find items, check auction prices, or answer questions about WeBuild. What would you like to know?</div>`;
  }
}
function openLightbox(src, alt) {
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.innerHTML = `
    <button class="lightbox-close" aria-label="Close">✕</button>
    <img class="lightbox-img" src="${src}" alt="${alt || ''}">`;
  overlay.addEventListener('click', e => {
    if (e.target === overlay || e.target.classList.contains('lightbox-close')) {
      overlay.remove();
    }
  });
  document.addEventListener('keydown', function onKey(e) {
    if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', onKey); }
  }, { once: true });
  document.body.appendChild(overlay);
}

window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', () => {
  const tc = document.createElement('div');
  tc.id = 'toast-container';
  tc.className = 'toast-container';
  document.body.appendChild(tc);
  DarkMode.init();
  route();
});
