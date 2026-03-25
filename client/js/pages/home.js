// ── Home / Browse Items ────────────────────────────────────────────────────
const _homeEndTimes = {}; // { itemId: endTimeMs }

async function renderHome(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-title">Live Auctions</div>
      <div class="page-subtitle">Browse and bid on unique items from sellers around the world</div>
    </div>
    <div class="search-bar">
      <input class="form-input" type="text" id="search-input" placeholder="Search by name or description…">
      <button class="btn btn-dark" onclick="doSearch()">Search</button>
      <button class="btn btn-outline" onclick="clearSearch()">Clear</button>
    </div>
    <div class="categories">
      <button class="cat-btn active" data-cat="" onclick="filterCategory(this)">All</button>
      <button class="cat-btn" data-cat="Electronics" onclick="filterCategory(this)">💻 Electronics</button>
      <button class="cat-btn" data-cat="Accessories" onclick="filterCategory(this)">⌚ Accessories</button>
      <button class="cat-btn" data-cat="Antiques"    onclick="filterCategory(this)">🏺 Antiques</button>
      <button class="cat-btn" data-cat="Sports"      onclick="filterCategory(this)">🚴 Sports</button>
      <button class="cat-btn" data-cat="Furniture"   onclick="filterCategory(this)">🛋️ Furniture</button>
    </div>
    <div id="items-grid" class="items-grid">
      <div class="loading"><div class="spinner"></div><span>Loading auctions…</span></div>
    </div>`;

  document.getElementById('search-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch();
  });

  await loadAllItems();
  startHomeTimers();
}

function startHomeTimers() {
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [id, endMs] of Object.entries(_homeEndTimes)) {
      const el = document.getElementById(`cd-${id}`);
      if (!el) continue;
      const secsLeft = Math.max(0, Math.floor((endMs - now) / 1000));
      const cd = formatCountdown(secsLeft);
      el.textContent = cd.text;
      el.className = `countdown ${cd.urgency}`;
    }
  }, 1000);
  registerCleanup(() => clearInterval(interval));
}

async function loadAllItems() {
  showGridLoading();
  const res = await Api.getItems();
  if (!res.ok) { showGridError('Failed to load items. Check that the server is running.'); return; }
  renderItemGrid(Array.isArray(res.data) ? res.data : []);
}

async function doSearch() {
  const kw = document.getElementById('search-input')?.value?.trim();
  if (!kw) { await loadAllItems(); return; }
  setActiveCategory(null);
  showGridLoading('Searching…');
  const res = await Api.searchItems(kw);
  renderItemGrid(Array.isArray(res.data) ? res.data : []);
}

async function clearSearch() {
  const input = document.getElementById('search-input');
  if (input) input.value = '';
  setActiveCategory('');
  await loadAllItems();
}

async function filterCategory(btn) {
  setActiveCategory(btn.dataset.cat);
  showGridLoading();
  const cat = btn.dataset.cat;
  if (!cat) { await loadAllItems(); return; }
  const res = await Api.getItemsByCategory(cat);
  renderItemGrid(Array.isArray(res.data) ? res.data : []);
}

function setActiveCategory(cat) {
  document.querySelectorAll('.cat-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.cat === (cat ?? '')));
}

function showGridLoading(msg = 'Loading auctions…') {
  const grid = document.getElementById('items-grid');
  if (grid) grid.innerHTML = `<div class="loading" style="grid-column:1/-1"><div class="spinner"></div><span>${msg}</span></div>`;
}

function showGridError(msg) {
  const grid = document.getElementById('items-grid');
  if (grid) grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">${msg}</div></div>`;
}

function renderItemGrid(items) {
  const grid = document.getElementById('items-grid');
  if (!grid) return;
  if (!items.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📭</div><div class="empty-state-title">No auctions found</div><p>Try a different search or category</p></div>`;
    return;
  }
  // Register end times for live timer
  items.forEach(item => {
    if (item.auctionEndTime) _homeEndTimes[item.id] = new Date(item.auctionEndTime).getTime();
  });
  grid.innerHTML = items.map(item => buildItemCard(item)).join('');
}

function buildItemCard(item) {
  const emoji    = categoryEmoji(item.category);
  const badgeCls = categoryBadgeClass(item.category);
  const endMs    = item.auctionEndTime ? new Date(item.auctionEndTime).getTime() : 0;
  const secsLeft = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
  const cd       = formatCountdown(secsLeft);
  const isEnded  = secsLeft <= 0;

  return `
    <div class="item-card" onclick="navigate('#/item/${item.id}')">
      <div class="item-card-thumb">${emoji}</div>
      <div class="item-card-body">
        <div class="item-card-header">
          <div class="item-card-name">${item.name}</div>
          <span class="badge ${badgeCls}">${item.category || 'Other'}</span>
        </div>
        <div class="item-card-desc">${item.description || 'No description provided.'}</div>
        <div class="item-card-footer">
          <div>
            <div class="bid-label">Starting at</div>
            <div class="bid-amount">${formatMoney(item.startingPrice)}</div>
          </div>
          ${isEnded
            ? `<span class="countdown ended">Ended</span>`
            : `<span class="countdown ${cd.urgency}" id="cd-${item.id}">${cd.text}</span>`
          }
        </div>
      </div>
    </div>`;
}
