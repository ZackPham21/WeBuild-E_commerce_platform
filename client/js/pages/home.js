const _homeEndTimes = {}; // { itemId: endTimeMs }

async function renderHome(container) {
  let hero = document.getElementById('home-hero');
  if (!hero) {
    hero = document.createElement('div');
    hero.id = 'home-hero';
    hero.className = 'home-hero';
    document.getElementById('main').before(hero);
  }
  hero.innerHTML = `
    <canvas id="hero-canvas" class="hero-canvas"></canvas>
    <div class="home-hero-inner">
      <h1 class="home-hero-title">Live <em>Auctions</em><br>happening now</h1>
      <p class="home-hero-sub">Place your bid before the timer runs out. Highest bid wins.</p>
      <div class="home-hero-search">
        <div class="hero-search-wrap">
          <span class="hero-search-icon">🔍</span>
          <input type="text" id="search-input" class="hero-search-input" placeholder="Search items…">
        </div>
        <button class="btn-hero-search" onclick="doSearch()">Search</button>
        <button class="btn-hero-all" onclick="clearSearch()">All Items</button>
      </div>
    </div>`;

  container.innerHTML = `
    <div class="home-filters">
      <span class="filter-label">Category:</span>
      <button class="cat-btn active" data-cat="" onclick="filterCategory(this)">All</button>
      <button class="cat-btn" data-cat="Electronics" onclick="filterCategory(this)">Electronics</button>
      <button class="cat-btn" data-cat="Accessories" onclick="filterCategory(this)">Accessories</button>
      <button class="cat-btn" data-cat="Antiques"    onclick="filterCategory(this)">Antiques</button>
      <button class="cat-btn" data-cat="Sports"      onclick="filterCategory(this)">Sports</button>
      <button class="cat-btn" data-cat="Furniture"   onclick="filterCategory(this)">Furniture</button>
    </div>
    <p class="results-info" id="results-info"></p>
    <div id="items-grid" class="items-grid">
      <div class="loading"><div class="spinner"></div><span>Loading auctions…</span></div>
    </div>`;

  document.getElementById('search-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch();
  });

  startCanvasEffect('hero-canvas', hero);

  registerCleanup(() => {
    const h = document.getElementById('home-hero');
    if (h) h.remove();
  });

  await loadAllItems();
  startHomeTimers();
  buildChatBotButton();
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

async function renderItemGrid(items) {
  const grid = document.getElementById('items-grid');
  if (!grid) return;
  const info = document.getElementById('results-info');
  if (!items.length) {
    if (info) info.textContent = '';
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📭</div><div class="empty-state-title">No auctions found</div><p>Try a different search or category</p></div>`;
    return;
  }
  if (info) info.innerHTML = `Showing <strong>${items.length}</strong> active auction${items.length !== 1 ? 's' : ''}`;
  items.forEach(item => {
    if (item.auctionEndTime) _homeEndTimes[item.id] = new Date(item.auctionEndTime + 'Z').getTime();
  });

  // Fetch all auction states in parallel
  const auctionResults = await Promise.all(items.map(item => Api.getAuctionState(item.id)));
  const auctionMap = {};
  items.forEach((item, i) => {
    if (auctionResults[i].ok) auctionMap[item.id] = auctionResults[i].data;
  });

  grid.innerHTML = items.map(item => buildItemCard(item, auctionMap[item.id])).join('');
}

function buildItemCard(item, auction) {
  const emoji    = categoryEmoji(item.category);
  const badgeCls = categoryBadgeClass(item.category);
  const endMs    = item.auctionEndTime ? new Date(item.auctionEndTime + 'Z').getTime() : 0;
  const secsLeft = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
  const cd       = formatCountdown(secsLeft);
  const isEnded  = secsLeft <= 0;

  const hasBids  = auction && auction.highestBidderId && String(auction.highestBidderId) !== 'none';
  const bidLabel = hasBids ? 'Current Bid' : 'Starting At';
  const bidValue = hasBids ? auction.currentHighestBid : item.startingPrice;

  const firstImg  = parseImages(item.imageUrl)[0] || null;
  const isWatched = Watchlist.has(item.id);

  return `
    <div class="item-card" onclick="navigate('#/item/${item.id}')">
      <div class="item-card-thumb">
        ${firstImg
          ? `<img src="${firstImg}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">`
          : emoji}
        ${!isEnded ? `<span class="live-badge-card"><span class="live-badge-dot"></span>LIVE</span>` : ''}
        <button class="watchlist-heart${isWatched ? ' active' : ''}" onclick="event.stopPropagation(); toggleWatchlistItem(${item.id}, this)" title="${isWatched ? 'Remove from watchlist' : 'Add to watchlist'}">♥</button>
      </div>
      <div class="item-card-body">
        <div class="item-card-header">
          <div class="item-card-name">${item.name}</div>
          <span class="badge ${badgeCls}">${item.category || 'Other'}</span>
          ${item.condition ? `<span class="badge" style="background:#f3f4f6;color:#374151;font-size:10px">${item.condition}</span>` : ''}
        </div>
        <div class="item-card-desc">${item.description || 'No description provided.'}</div>
        <div class="item-card-footer">
          <div>
            <div class="bid-label">${bidLabel}</div>
            <div class="bid-amount">${formatMoney(bidValue)}</div>
          </div>
          ${isEnded
            ? `<span class="countdown ended">Ended</span>`
            : `<span class="countdown ${cd.urgency}" id="cd-${item.id}">${cd.text}</span>`
          }
        </div>
      </div>
    </div>`;
}
