const Watchlist = {
  get() { try { return JSON.parse(localStorage.getItem('wb_watchlist') || '[]'); } catch { return []; } },
  add(itemId) {
    const list = Watchlist.get();
    if (!list.includes(Number(itemId))) {
      list.push(Number(itemId));
      localStorage.setItem('wb_watchlist', JSON.stringify(list));
    }
  },
  remove(itemId) {
    const list = Watchlist.get().filter(id => id !== Number(itemId));
    localStorage.setItem('wb_watchlist', JSON.stringify(list));
  },
  has(itemId) { return Watchlist.get().includes(Number(itemId)); },
  toggle(itemId) {
    Watchlist.has(itemId) ? Watchlist.remove(itemId) : Watchlist.add(itemId);
  },
};

async function renderWatchlist(container) {
  const ids = Watchlist.get();

  container.innerHTML = `
    <div class="back-btn" onclick="navigate('#/')">← Back to Auctions</div>
    <div class="page-header">
      <div class="page-title">Watchlist</div>
      <div class="page-subtitle">Items you are watching</div>
    </div>
    <div id="watchlist-grid" class="items-grid">
      <div class="loading" style="grid-column:1/-1"><div class="spinner"></div><span>Loading…</span></div>
    </div>`;

  const grid = document.getElementById('watchlist-grid');

  if (!ids.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">🔖</div>
        <div class="empty-state-title">Your watchlist is empty</div>
        <p style="margin-bottom:16px">Click the heart on any auction to save it here</p>
        <button class="btn btn-primary" onclick="navigate('#/')">Browse Auctions</button>
      </div>`;
    return;
  }

  const results = await Promise.all(ids.map(async id => {
    const [itemRes, auctionRes] = await Promise.all([Api.getItem(id), Api.getAuctionState(id)]);
    return { item: itemRes.ok ? itemRes.data : null, auction: auctionRes.ok ? auctionRes.data : null };
  }));

  const valid = results.filter(r => r.item);
  if (!valid.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">📭</div><div class="empty-state-title">No valid items found</div></div>`;
    return;
  }

  grid.innerHTML = valid.map(({ item, auction }) => buildWatchlistCard(item, auction)).join('');
}

function buildWatchlistCard(item, auction) {
  const emoji    = categoryEmoji(item.category);
  const badgeCls = categoryBadgeClass(item.category);
  const endMs    = item.auctionEndTime ? new Date(item.auctionEndTime + 'Z').getTime() : 0;
  const secsLeft = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
  const cd       = formatCountdown(secsLeft);
  const isEnded  = secsLeft <= 0;
  const hasBids  = auction && auction.highestBidderId && String(auction.highestBidderId) !== 'none';
  const bidLabel = hasBids ? 'Current Bid' : 'Starting At';
  const bidValue = hasBids ? auction.currentHighestBid : item.startingPrice;

  const firstImg = parseImages(item.imageUrl)[0] || null;

  return `
    <div class="item-card">
      <div class="item-card-thumb" onclick="navigate('#/item/${item.id}')" style="cursor:pointer">
        ${firstImg ? `<img src="${firstImg}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">` : `<span style="font-size:68px;line-height:1">${emoji}</span>`}
        ${!isEnded ? `<span class="live-badge-card"><span class="live-badge-dot"></span>LIVE</span>` : '<span class="ended-badge-card">ENDED</span>'}
        <button class="watchlist-heart active" onclick="event.stopPropagation(); toggleWatchlistItem(${item.id}, this)" title="Remove from watchlist">♥</button>
      </div>
      <div class="item-card-body">
        <div class="item-card-header">
          <div class="item-card-name" onclick="navigate('#/item/${item.id}')" style="cursor:pointer">${item.name}</div>
          <span class="badge ${badgeCls}">${item.category || 'Other'}</span>
        </div>
        <div class="item-card-desc">${item.description || 'No description provided.'}</div>
        <div class="item-card-footer">
          <div>
            <div class="bid-label">${bidLabel}</div>
            <div class="bid-amount">${formatMoney(bidValue)}</div>
          </div>
          ${isEnded
            ? `<span class="countdown ended">Ended</span>`
            : `<span class="countdown ${cd.urgency}">${cd.text}</span>`}
        </div>
      </div>
    </div>`;
}

function toggleWatchlistItem(itemId, btn) {
  Watchlist.toggle(itemId);
  const isNowWatched = Watchlist.has(itemId);
  btn.classList.toggle('active', isNowWatched);
  if (!isNowWatched && window.location.hash === '#/watchlist') {
    btn.closest('.item-card')?.remove();
    const grid = document.getElementById('watchlist-grid');
    if (grid && !grid.querySelector('.item-card')) {
      renderWatchlist(document.getElementById('main'));
    }
  }
  toast(isNowWatched ? 'Added to watchlist' : 'Removed from watchlist', 'info');
}
