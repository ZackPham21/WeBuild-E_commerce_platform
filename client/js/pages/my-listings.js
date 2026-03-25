// ── My Listings ────────────────────────────────────────────────────────────
async function renderMyListings(container) {
  const user = Auth.getUser();

  container.innerHTML = `
    <div class="back-btn" onclick="navigate('#/')">← Back to Auctions</div>
    <div class="page-header">
      <div class="page-title">My Listings</div>
      <div class="page-subtitle">Items you've listed for auction</div>
    </div>
    <div id="my-listings-grid" class="items-grid">
      <div class="loading" style="grid-column:1/-1"><div class="spinner"></div><span>Loading your listings…</span></div>
    </div>`;

  const res = await Api.getItems();
  const grid = document.getElementById('my-listings-grid');
  if (!grid) return;

  if (!res.ok) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Failed to load listings</div></div>`;
    return;
  }

  const myItems = (Array.isArray(res.data) ? res.data : [])
    .filter(item => String(item.sellerId) === String(user.userId));

  if (!myItems.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">📦</div>
        <div class="empty-state-title">No active listings</div>
        <p style="margin-bottom:16px">Items you sell will appear here</p>
        <button class="btn btn-primary" onclick="navigate('#/sell')">🏷️ List an Item</button>
      </div>`;
    return;
  }

  grid.innerHTML = myItems.map(item => buildMyListingCard(item)).join('');
}

function buildMyListingCard(item) {
  const emoji    = categoryEmoji(item.category);
  const badgeCls = categoryBadgeClass(item.category);
  const endMs    = item.auctionEndTime ? new Date(item.auctionEndTime).getTime() : 0;
  const secsLeft = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
  const cd       = formatCountdown(secsLeft);
  const isEnded  = secsLeft <= 0;

  return `
    <div class="item-card">
      <div class="item-card-thumb" onclick="navigate('#/item/${item.id}')" style="cursor:pointer">${emoji}</div>
      <div class="item-card-body">
        <div class="item-card-header">
          <div class="item-card-name" onclick="navigate('#/item/${item.id}')" style="cursor:pointer">${item.name}</div>
          <span class="badge ${badgeCls}">${item.category || 'Other'}</span>
        </div>
        <div class="item-card-desc">${item.description || 'No description.'}</div>
        <div class="item-card-footer">
          <div>
            <div class="bid-label">Starting at</div>
            <div class="bid-amount">${formatMoney(item.startingPrice)}</div>
          </div>
          ${isEnded
            ? `<span class="countdown ended">Ended</span>`
            : `<span class="countdown ${cd.urgency}">${cd.text}</span>`
          }
        </div>
        <div style="margin-top:12px;display:flex;gap:8px">
          <button class="btn btn-outline" style="flex:1;font-size:13px" onclick="navigate('#/item/${item.id}')">View</button>
          <button class="btn btn-danger"  style="font-size:13px" onclick="confirmDelete(${item.id}, '${item.name.replace(/'/g,"\\'")}')">🗑 Delete</button>
        </div>
      </div>
    </div>`;
}

async function confirmDelete(itemId, itemName) {
  if (!confirm(`Delete "${itemName}"? This cannot be undone.`)) return;

  const res = await Api.deleteItem(itemId);
  if (res.ok && res.data.success) {
    toast(`"${itemName}" deleted.`, 'success');
    renderMyListings(document.getElementById('main'));
  } else {
    toast(res.data.error || 'Failed to delete item.', 'error');
  }
}
