// ── Globals ────────────────────────────────────────────────────────────────
let _cleanupFns = [];
function registerCleanup(fn) { _cleanupFns.push(fn); }

// ── Navigation helpers ─────────────────────────────────────────────────────
function navigate(hash) { window.location.hash = hash; }

// ── Toast ──────────────────────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// ── Shared helpers ─────────────────────────────────────────────────────────
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
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-CA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Purchases tracking (localStorage) ────────────────────────────────────
const Purchases = {
  get() { try { return JSON.parse(localStorage.getItem('wb_purchases') || '[]'); } catch { return []; } },
  add(itemId) {
    const list = Purchases.get();
    if (!list.includes(Number(itemId))) { list.push(Number(itemId)); localStorage.setItem('wb_purchases', JSON.stringify(list)); }
  },
};

// ── Pre-seeded test accounts ───────────────────────────────────────────────
const TEST_ACCOUNTS = [
  { username: 'winner789', password: 'WinPass!1',    label: 'winner789 (Buyer)'  },
  { username: 'loser456',  password: 'LosePass!1',   label: 'loser456 (Buyer)'   },
  { username: 'seller1',   password: 'SellerPass!1', label: 'seller1 (Seller)'   },
];

// ── Nav ────────────────────────────────────────────────────────────────────
function renderNav() {
  const user    = Auth.getUser();
  const options = TEST_ACCOUNTS.map(a =>
    `<option value="${a.username}" ${user?.username === a.username ? 'selected' : ''}>${a.label}</option>`
  ).join('');

  document.getElementById('header').innerHTML = `
    <nav class="nav">
      <div class="nav-brand" onclick="navigate('#/')">We<span>Build</span></div>
      <div class="nav-spacer"></div>
      <div class="nav-right">
        <select class="nav-select" id="account-select" onchange="switchAccount(this.value)">
          ${!user ? `<option value="">— Pick account —</option>` : ''}
          ${options}
        </select>
        <div class="nav-menu" id="nav-menu">
          <button class="nav-menu-btn" onclick="toggleNavMenu(event)">☰ Menu</button>
          <div class="nav-dropdown" id="nav-dropdown">
            <button class="nav-dropdown-item" onclick="closeNavMenu(); navigate('#/sell')">🏷️ Sell an Item</button>
            <button class="nav-dropdown-item" onclick="closeNavMenu(); navigate('#/my-listings')">📦 My Listings</button>
            <div class="nav-dropdown-divider"></div>
            <button class="nav-dropdown-item" onclick="closeNavMenu(); navigate('#/purchases')">🧾 My Purchases</button>
          </div>
        </div>
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

// Close dropdown on outside click
document.addEventListener('click', () => closeNavMenu());

async function switchAccount(username) {
  if (!username) return;
  const account = TEST_ACCOUNTS.find(a => a.username === username);
  if (!account) return;
  const res = await Api.signin(account.username, account.password);
  if (res.ok && res.data.success) {
    Auth.setAuth(res.data.token, res.data.userId, res.data.username);
    renderNav();
    toast(`Signed in as ${account.username}`, 'success');
    route();
  } else {
    toast('Sign-in failed. Is the server running?', 'error');
  }
}

// ── Auto sign-in ───────────────────────────────────────────────────────────
async function ensureAuth() {
  if (Auth.isLoggedIn()) return true;
  const res = await Api.signin(TEST_ACCOUNTS[0].username, TEST_ACCOUNTS[0].password);
  if (res.ok && res.data.success) {
    Auth.setAuth(res.data.token, res.data.userId, res.data.username);
    return true;
  }
  return false;
}

// ── Router ─────────────────────────────────────────────────────────────────
async function route() {
  _cleanupFns.forEach(fn => { try { fn(); } catch {} });
  _cleanupFns = [];

  const hash = window.location.hash || '#/';
  const main = document.getElementById('main');

  const authed = await ensureAuth();
  renderNav();

  if (!authed) {
    main.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Cannot connect to server</div><p style="margin-top:8px">Make sure all 5 Spring Boot services are running, then refresh.</p></div>`;
    return;
  }

  if      (hash === '#/' || hash === '#')     renderHome(main);
  else if (hash.startsWith('#/item/'))        renderItem(main, hash.split('/')[2]);
  else if (hash.startsWith('#/payment/'))     renderPayment(main, hash.split('/')[2]);
  else if (hash.startsWith('#/receipt/'))     renderReceipt(main, hash.split('/')[2]);
  else if (hash === '#/sell')                 renderSell(main);
  else if (hash === '#/my-listings')          renderMyListings(main);
  else if (hash === '#/purchases')            renderPurchases(main);
  else                                        navigate('#/');
}

window.addEventListener('hashchange', route);
window.addEventListener('DOMContentLoaded', () => {
  const tc = document.createElement('div');
  tc.id = 'toast-container';
  tc.className = 'toast-container';
  document.body.appendChild(tc);
  route();
});
