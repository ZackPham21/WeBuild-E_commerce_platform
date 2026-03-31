async function renderReceipt(container, itemId) {
  container.innerHTML = '<div class="loading"><div class="spinner"></div><span>Loading receipt…</span></div>';

  const [receiptRes, itemRes] = await Promise.all([
    Api.getReceipt(itemId),
    Api.getItem(itemId),
  ]);

  if (!receiptRes.ok || receiptRes.data.error) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🧾</div>
        <div class="empty-state-title">Receipt not found</div>
        <p style="color:var(--text-muted);margin-top:8px">No payment has been processed for this item yet.</p>
        <div style="display:flex;gap:10px;justify-content:center;margin-top:16px">
          <button class="btn btn-outline" onclick="navigate('#/item/${itemId}')">View Auction</button>
          <button class="btn btn-dark" onclick="navigate('#/')">Browse Auctions</button>
        </div>
      </div>`;
    return;
  }

  const r    = receiptRes.data;
  const item = itemRes.ok ? itemRes.data : null;

  container.innerHTML = `
    <div class="receipt-wrap">
      <div class="card">
        <div class="receipt-header">
          <div class="receipt-icon">✅</div>
          <div class="receipt-title">Payment Confirmed</div>
          <div class="receipt-sub">Receipt #${r.receiptId} · ${formatDate(r.processedAt)}</div>
        </div>

        <div style="margin-bottom:20px">
          <div class="section-label">Item Purchased</div>
          <div style="display:flex;align-items:center;gap:14px;padding:12px;background:var(--bg);border-radius:var(--radius-sm)">
            ${item && parseImages(item.imageUrl)[0]
              ? `<img src="${parseImages(item.imageUrl)[0]}" alt="${item.name}" style="width:56px;height:56px;object-fit:cover;border-radius:6px;flex-shrink:0;cursor:zoom-in" onclick="openLightbox(this.src, '${(item.name || '').replace(/'/g, "\\'")}')">`
              : `<div style="font-size:42px;flex-shrink:0">${item ? categoryEmoji(item.category) : '📦'}</div>`}
            <div>
              <div style="font-weight:700;font-size:16px">${item?.name || 'Item #' + itemId}</div>
              <div style="font-size:13px;color:var(--text-muted)">${item?.category || ''}</div>
            </div>
          </div>
        </div>

        <div style="margin-bottom:20px">
          <div class="section-label">Payment Breakdown</div>
          <div class="receipt-row">
            <span class="receipt-row-lbl">Winner</span>
            <span class="receipt-row-val">${r.winnerUsername}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-row-lbl">Winning Bid</span>
            <span class="receipt-row-val">${formatMoney(r.winningBid)}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-row-lbl">Shipping (${r.expedited ? 'Expedited' : 'Standard'})</span>
            <span class="receipt-row-val">${formatMoney(r.shippingCost)}</span>
          </div>
          <div class="receipt-row">
            <span class="receipt-row-lbl">Card</span>
            <span class="receipt-row-val" style="font-family:monospace;letter-spacing:1px">${r.maskedCardNumber}</span>
          </div>
          <div class="receipt-total">
            <span>Total Charged</span>
            <span>${formatMoney(r.totalAmount)}</span>
          </div>
        </div>

        ${r.shippingAddress ? `
        <div style="margin-bottom:20px">
          <div class="section-label">Shipping Address</div>
          <div style="padding:12px;background:var(--bg);border-radius:var(--radius-sm);font-size:13px;line-height:1.6">
            ${(() => {
              try {
                const a = JSON.parse(r.shippingAddress);
                return `${a.streetNumber} ${a.streetName}<br>${a.city}, ${a.country} ${a.postalCode}`;
              } catch { return r.shippingAddress; }
            })()}
          </div>
        </div>` : ''}

        <div style="text-align:center;padding-top:20px;border-top:1px solid var(--border)">
          <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">
            Thank you for your purchase on WeBuild! Your item is on its way.
          </p>
          <button class="btn btn-dark btn-lg" onclick="navigate('#/')">Browse More Auctions</button>
        </div>
      </div>
    </div>`;
}
