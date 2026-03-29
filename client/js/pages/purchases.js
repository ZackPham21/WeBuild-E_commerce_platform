// ── My Purchases ───────────────────────────────────────────────────────────
async function renderPurchases(container) {
  container.innerHTML = `
    <div class="back-btn" onclick="navigate('#/')">← Back to Auctions</div>
    <div class="page-header">
      <div class="page-title">My Activity</div>
      <div class="page-subtitle">Your purchases and bidding history</div>
    </div>
    <div class="tab-bar">
      <button class="tab-btn active" id="tab-purchases"   onclick="switchPurchasesTab('purchases')">Purchases</button>
      <button class="tab-btn"        id="tab-bid-history" onclick="switchPurchasesTab('bids')">Bid History</button>
    </div>
    <div id="purchases-panel">
      <div class="loading"><div class="spinner"></div><span>Loading…</span></div>
    </div>`;

  // Load both in parallel
  const [purchasesData, bidsData] = await Promise.all([
    loadPurchasesData(),
    Api.getMyBidHistory(),
  ]);

  window._purchasesData   = purchasesData;
  window._bidHistoryData  = Array.isArray(bidsData.data) ? bidsData.data : [];

  renderPurchasesTab('purchases');
}

async function loadPurchasesData() {
  const itemIds = Purchases.get();
  if (!itemIds.length) return [];
  return Promise.all(itemIds.map(async id => {
    const [itemRes, receiptRes] = await Promise.all([Api.getItem(id), Api.getReceipt(id)]);
    return { id, item: itemRes.ok ? itemRes.data : null, receipt: receiptRes.ok && !receiptRes.data?.error ? receiptRes.data : null };
  }));
}

function switchPurchasesTab(tab) {
  document.getElementById('tab-purchases')?.classList.toggle('active',   tab === 'purchases');
  document.getElementById('tab-bid-history')?.classList.toggle('active', tab === 'bids');
  renderPurchasesTab(tab);
}

function renderPurchasesTab(tab) {
  const panel = document.getElementById('purchases-panel');
  if (!panel) return;

  if (tab === 'purchases') {
    const results = window._purchasesData || [];
    if (!results.length) {
      panel.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🧾</div>
          <div class="empty-state-title">No purchases yet</div>
          <p style="margin-bottom:16px">Items you win and pay for will appear here</p>
          <button class="btn btn-dark" onclick="navigate('#/')">Browse Auctions</button>
        </div>`;
      return;
    }
    panel.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:16px;max-width:700px">
        ${results.map(r => buildPurchaseCard(r)).join('')}
      </div>`;
    return;
  }

  // Bid history tab
  const bids = window._bidHistoryData || [];
  if (!bids.length) {
    panel.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔨</div>
        <div class="empty-state-title">No bids placed yet</div>
        <p>Your bidding history across all auctions will appear here</p>
      </div>`;
    return;
  }

  panel.innerHTML = `
    <div style="max-width:700px">
      <table class="bid-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Your Bid</th>
            <th>Result</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${bids.map(b => buildBidHistoryRow(b)).join('')}
        </tbody>
      </table>
    </div>`;
}

function buildBidHistoryRow(b) {
  const itemId   = b.itemId;
  const itemLink = itemId
    ? `<a class="auth-link" onclick="navigate('#/item/${itemId}')" style="cursor:pointer">Item #${itemId}</a>`
    : '—';

  const isClosed = b.auctionStatus === 'CLOSED';
  let resultBadge;
  if (!isClosed) {
    resultBadge = `<span class="badge badge-open">Live</span>`;
  } else if (b.won) {
    resultBadge = `<span class="badge badge-open" style="background:#d1fae5;color:#065f46">🏆 Won</span>`;
  } else {
    resultBadge = `<span class="badge badge-closed">Outbid</span>`;
  }

  return `
    <tr class="${b.won ? 'bid-winner-row' : ''}">
      <td>${itemLink}</td>
      <td><strong>${formatMoney(b.amount)}</strong></td>
      <td>${resultBadge}</td>
      <td style="color:var(--text-muted);font-size:12px">${formatDate(b.timestamp)}</td>
    </tr>`;
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
