// ── Past / Ended Auctions ──────────────────────────────────────────────────
async function renderEndedAuctions(container) {
  container.innerHTML = `
    <div class="back-btn" onclick="navigate('#/')">← Back to Live Auctions</div>
    <div class="page-header">
      <div class="page-title">Past Auctions</div>
      <div class="page-subtitle">Auctions that have closed — final results and winners</div>
    </div>
    <div id="ended-grid" class="items-grid">
      <div class="loading" style="grid-column:1/-1"><div class="spinner"></div><span>Loading past auctions…</span></div>
    </div>`;

  const res = await Api.getEndedAuctions();
  const grid = document.getElementById('ended-grid');
  if (!grid) return;

  if (!res.ok) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Failed to load past auctions</div></div>`;
    return;
  }

  const auctions = Array.isArray(res.data) ? res.data : [];

  if (!auctions.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">🏁</div>
        <div class="empty-state-title">No ended auctions yet</div>
        <p>Check back once live auctions have closed</p>
      </div>`;
    return;
  }

  const user = Auth.getUser();
  grid.innerHTML = auctions.map(a => buildEndedCard(a, user)).join('');
}

function buildEndedCard(a, user) {
  const item     = a.item || {};
  const emoji    = categoryEmoji(item.category);
  const badgeCls = categoryBadgeClass(item.category);
  const name     = item.name || `Item #${a.itemId}`;
  const noBids   = !a.winnerId || String(a.winnerId) === 'none';
  const isWinner = user && !noBids && String(a.winnerId) === String(user.userId);
  const firstImg = parseImages(item.imageUrl)[0] || null;

  return `
    <div class="item-card" onclick="navigate('#/item/${a.itemId}')">
      <div class="item-card-thumb">
        ${firstImg
          ? `<img src="${firstImg}" alt="${name}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">`
          : `<span style="font-size:68px;line-height:1">${emoji}</span>`}
        <span class="ended-badge-card">ENDED</span>
      </div>
      <div class="item-card-body">
        <div class="item-card-header">
          <div class="item-card-name">${name}</div>
          <span class="badge ${badgeCls}">${item.category || 'Other'}</span>
        </div>
        <div class="item-card-desc">${item.description || 'No description provided.'}</div>
        <div class="item-card-footer">
          <div>
            <div class="bid-label">${noBids ? 'No Bids' : 'Final Price'}</div>
            <div class="bid-amount">${noBids ? '—' : formatMoney(a.finalBid)}</div>
          </div>
          <span class="countdown ended">Ended ${formatDate(a.endTime)?.split(',')[0] ?? ''}</span>
        </div>
        <div style="margin-top:10px;font-size:12px;padding-top:10px;border-top:1px solid var(--border)">
          ${noBids
            ? `<span style="color:var(--text-muted)">No bids were placed</span>`
            : isWinner
              ? `<span style="color:var(--success);font-weight:700">🏆 You won this auction!</span>`
              : `<span style="color:var(--text-muted)">Won by <strong>${a.winnerUsername}</strong></span>`
          }
        </div>
      </div>
    </div>`;
}
