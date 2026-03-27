// ── My Purchases ───────────────────────────────────────────────────────────
async function renderPurchases(container) {
  container.innerHTML = `
    <div class="back-btn" onclick="navigate('#/')">← Back to Auctions</div>
    <div class="page-header">
      <div class="page-title">My Purchases</div>
      <div class="page-subtitle">Items you've won and paid for</div>
    </div>
    <div id="purchases-list">
      <div class="loading"><div class="spinner"></div><span>Loading purchases…</span></div>
    </div>`;

  const itemIds = Purchases.get();
  const list    = document.getElementById('purchases-list');
  if (!list) return;

  if (!itemIds.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🧾</div>
        <div class="empty-state-title">No purchases yet</div>
        <p style="margin-bottom:16px">Items you win and pay for will appear here</p>
        <button class="btn btn-dark" onclick="navigate('#/')">Browse Auctions</button>
      </div>`;
    return;
  }

  // Fetch item info and receipt for each purchased item in parallel
  const results = await Promise.all(itemIds.map(async id => {
    const [itemRes, receiptRes] = await Promise.all([Api.getItem(id), Api.getReceipt(id)]);
    return { id, item: itemRes.ok ? itemRes.data : null, receipt: receiptRes.ok && !receiptRes.data.error ? receiptRes.data : null };
  }));

  if (!results.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🧾</div><div class="empty-state-title">No purchases found</div></div>`;
    return;
  }

  list.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px;max-width:700px">
      ${results.map(r => buildPurchaseCard(r)).join('')}
    </div>`;
}

function buildPurchaseCard({ id, item, receipt }) {
  const name  = item?.name  || `Item #${id}`;
  const emoji = categoryEmoji(item?.category);
  const cat   = item?.category || '';

  if (!receipt) {
    return `
      <div class="card" style="display:flex;align-items:center;gap:16px;opacity:.7">
        <div style="font-size:40px">${emoji}</div>
        <div style="flex:1">
          <div style="font-weight:700">${name}</div>
          <div style="font-size:13px;color:var(--text-muted)">${cat}</div>
          <div style="font-size:13px;color:var(--danger);margin-top:4px">Receipt unavailable</div>
        </div>
      </div>`;
  }

  return `
    <div class="card" style="display:flex;align-items:center;gap:16px">
      <div style="font-size:44px;flex-shrink:0">${emoji}</div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:700;font-size:16px;margin-bottom:2px">${name}</div>
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px">${cat} · Purchased ${formatDate(receipt.processedAt)}</div>
        <div style="display:flex;flex-wrap:wrap;gap:16px;font-size:13px">
          <span>Winning bid: <strong>${formatMoney(receipt.winningBid)}</strong></span>
          <span>Shipping: <strong>${formatMoney(receipt.shippingCost)}${receipt.expedited ? ' (Expedited)' : ''}</strong></span>
          <span>Total: <strong>${formatMoney(receipt.totalAmount)}</strong></span>
        </div>
      </div>
      <button class="btn btn-outline" style="flex-shrink:0;font-size:13px" onclick="navigate('#/receipt/${id}')">
        🧾 Receipt
      </button>
    </div>`;
}
