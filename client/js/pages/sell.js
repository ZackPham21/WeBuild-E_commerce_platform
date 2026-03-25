// ── Sell an Item ───────────────────────────────────────────────────────────
function renderSell(container) {
  const user = Auth.getUser();

  // Default auction end = 7 days from now, formatted for datetime-local input
  const defaultEnd = new Date(Date.now() + 7 * 86400000);
  const pad = n => String(n).padStart(2, '0');
  const defaultEndStr = `${defaultEnd.getFullYear()}-${pad(defaultEnd.getMonth()+1)}-${pad(defaultEnd.getDate())}T${pad(defaultEnd.getHours())}:${pad(defaultEnd.getMinutes())}`;

  container.innerHTML = `
    <div class="back-btn" onclick="navigate('#/')">← Back to Auctions</div>

    <div class="page-header">
      <div class="page-title">List an Item</div>
      <div class="page-subtitle">Create a new auction listing</div>
    </div>

    <div style="max-width:640px">
      <div class="card">
        <div id="sell-error"></div>
        <form id="sell-form" autocomplete="off" novalidate>

          <div class="form-group">
            <label class="form-label">Item Name</label>
            <input class="form-input" type="text" id="sell-name" placeholder="e.g. Vintage Camera" required>
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea class="form-input" id="sell-desc" rows="3" placeholder="Describe your item…" style="resize:vertical"></textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="form-input" id="sell-category">
                <option value="Electronics">💻 Electronics</option>
                <option value="Accessories">⌚ Accessories</option>
                <option value="Antiques">🏺 Antiques</option>
                <option value="Sports">🚴 Sports</option>
                <option value="Furniture">🛋️ Furniture</option>
                <option value="Clothing">👗 Clothing</option>
                <option value="Jewelry">💎 Jewelry</option>
                <option value="Art">🎨 Art</option>
                <option value="Books">📚 Books</option>
                <option value="Other">📦 Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Starting Price ($)</label>
              <input class="form-input" type="number" id="sell-price" placeholder="10" min="1" step="1" required>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Auction End Date & Time</label>
            <input class="form-input" type="datetime-local" id="sell-endtime" value="${defaultEndStr}" required>
          </div>

          <div class="divider"></div>
          <div style="font-size:13px;font-weight:700;margin-bottom:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px">Shipping</div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Standard Shipping Cost ($)</label>
              <input class="form-input" type="number" id="sell-ship-cost" placeholder="10.00" min="0" step="0.01">
            </div>
            <div class="form-group">
              <label class="form-label">Shipping Days</label>
              <input class="form-input" type="number" id="sell-ship-days" placeholder="7" min="1" step="1">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Expedited Shipping Cost ($)</label>
            <input class="form-input" type="number" id="sell-expd-cost" placeholder="25.00" min="0" step="0.01">
          </div>

          <button class="btn btn-primary btn-full btn-lg" type="submit" id="sell-submit">
            🏷️ List Item for Auction
          </button>
        </form>
      </div>
    </div>`;

  document.getElementById('sell-form').addEventListener('submit', async e => {
    e.preventDefault();
    const errEl     = document.getElementById('sell-error');
    const submitBtn = document.getElementById('sell-submit');
    errEl.innerHTML = '';

    const name     = document.getElementById('sell-name').value.trim();
    const desc     = document.getElementById('sell-desc').value.trim();
    const category = document.getElementById('sell-category').value;
    const price    = parseFloat(document.getElementById('sell-price').value);
    const endInput = document.getElementById('sell-endtime').value;
    const shipCost = parseFloat(document.getElementById('sell-ship-cost').value) || 0;
    const shipDays = parseInt(document.getElementById('sell-ship-days').value)   || 1;
    const expdCost = parseFloat(document.getElementById('sell-expd-cost').value) || 0;

    if (!name) { errEl.innerHTML = `<div class="alert alert-error">Item name is required.</div>`; return; }
    if (!price || price < 1) { errEl.innerHTML = `<div class="alert alert-error">Starting price must be at least $1.</div>`; return; }
    if (!endInput) { errEl.innerHTML = `<div class="alert alert-error">Auction end time is required.</div>`; return; }
    if (new Date(endInput) <= new Date()) { errEl.innerHTML = `<div class="alert alert-error">End time must be in the future.</div>`; return; }

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Listing…';

    const now = new Date().toISOString().slice(0, 19);
    const end = new Date(endInput).toISOString().slice(0, 19);

    const res = await Api._req('POST', '/items', {
      name, description: desc, category,
      startingPrice: price,
      sellerId: user.userId,
      auctionStartTime: now,
      auctionEndTime: end,
      shippingDays: shipDays,
      shippingCost: shipCost,
      expeditedShippingCost: expdCost,
    });

    if (res.ok && res.data.id) {
      toast(`"${name}" listed successfully!`, 'success');
      navigate(`#/item/${res.data.id}`);
    } else {
      errEl.innerHTML = `<div class="alert alert-error">${res.data.message || res.data.error || 'Failed to list item.'}</div>`;
      submitBtn.disabled    = false;
      submitBtn.textContent = '🏷️ List Item for Auction';
    }
  });
}
