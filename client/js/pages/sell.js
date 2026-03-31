let _sellImages = [];

function sellSwitchImgTab(tab) {
  document.getElementById('img-tab-url').classList.toggle('active', tab === 'url');
  document.getElementById('img-tab-upload').classList.toggle('active', tab === 'upload');
  document.getElementById('sell-img-url-panel').style.display    = tab === 'url'    ? '' : 'none';
  document.getElementById('sell-img-upload-panel').style.display = tab === 'upload' ? '' : 'none';
  if (tab === 'url') _sellImages = [];
}

function sellRenderPreviews() {
  const container = document.getElementById('sell-img-previews');
  if (!container) return;
  container.innerHTML = _sellImages.map((src, i) => `
    <div style="position:relative">
      <img src="${src}" style="width:72px;height:72px;object-fit:cover;border-radius:6px;border:1px solid var(--border)">
      <button type="button" onclick="sellRemoveImage(${i})"
              style="position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;background:#e63946;color:#fff;border:none;font-size:11px;line-height:1;cursor:pointer">✕</button>
    </div>`).join('');
}

function sellRemoveImage(index) {
  _sellImages.splice(index, 1);
  sellRenderPreviews();
}

async function renderSell(container) {
  const user = Auth.getUser();

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
          <div class="divider"></div>
          <div style="font-size:13px;font-weight:700;margin-bottom:12px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.5px">Item Details</div>
          <div class="form-row">
            <div class="form-group" style="flex:2">
              <label class="form-label">Images <span style="color:var(--text-muted);font-weight:400">(optional · up to 5)</span></label>
              <div style="display:flex;gap:4px;margin-bottom:8px">
                <button type="button" class="sell-img-tab active" id="img-tab-url"    onclick="sellSwitchImgTab('url')">🔗 URL</button>
                <button type="button" class="sell-img-tab"        id="img-tab-upload" onclick="sellSwitchImgTab('upload')">📁 Upload</button>
              </div>
              <div id="sell-img-url-panel">
                <input class="form-input" type="url" id="sell-image" placeholder="https://example.com/image.jpg">
              </div>
              <div id="sell-img-upload-panel" style="display:none">
                <input type="file" id="sell-files" accept="image/*" multiple style="display:none">
                <button type="button" class="btn btn-outline" style="font-size:13px;margin-bottom:8px" onclick="document.getElementById('sell-files').click()">
                  📁 Choose images…
                </button>
                <div id="sell-img-previews" style="display:flex;gap:8px;flex-wrap:wrap"></div>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Condition</label>
              <select class="form-input" id="sell-condition">
                <option value="New">New</option>
                <option value="Like New">Like New</option>
                <option value="Good" selected>Good</option>
                <option value="Fair">Fair</option>
                <option value="For Parts">For Parts</option>
              </select>
            </div>
          </div>
          <button class="btn btn-primary btn-full btn-lg" type="submit" id="sell-submit">
            🏷️ List Item for Auction
          </button>
        </form>
      </div>
    </div>`;

  _sellImages = [];

  document.getElementById('sell-files').addEventListener('change', async e => {
    const files = Array.from(e.target.files).slice(0, 5 - _sellImages.length);
    for (const file of files) {
      const base64 = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = ev => resolve(ev.target.result);
        reader.readAsDataURL(file);
      });
      if (_sellImages.length < 5) _sellImages.push(base64);
    }
    e.target.value = '';
    sellRenderPreviews();
  });

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
    const shipCost  = parseFloat(document.getElementById('sell-ship-cost').value) || 0;
    const shipDays  = parseInt(document.getElementById('sell-ship-days').value)   || 1;
    const expdCost  = parseFloat(document.getElementById('sell-expd-cost').value) || 0;
    const urlInput  = document.getElementById('sell-image').value.trim();
    const imageUrl  = _sellImages.length > 1  ? JSON.stringify(_sellImages)
                    : _sellImages.length === 1 ? _sellImages[0]
                    : urlInput || null;
    const condition = document.getElementById('sell-condition').value;

    if (!name)               { errEl.innerHTML = `<div class="alert alert-error">Item name is required.</div>`; return; }
    if (!price || price < 1) { errEl.innerHTML = `<div class="alert alert-error">Starting price must be at least $1.</div>`; return; }
    if (!endInput)           { errEl.innerHTML = `<div class="alert alert-error">Auction end time is required.</div>`; return; }
    if (new Date(endInput) <= new Date()) { errEl.innerHTML = `<div class="alert alert-error">End time must be in the future.</div>`; return; }
    if (name.length > 100) { errEl.innerHTML = `<div class="alert alert-error">Item name must be 100 characters or fewer.</div>`; return; }
    if (desc.length > 2000) { errEl.innerHTML = `<div class="alert alert-error">Description must be 2000 characters or fewer.</div>`; return; }
    if (shipDays < 1 || shipDays > 365) { errEl.innerHTML = `<div class="alert alert-error">Shipping days must be between 1 and 365.</div>`; return; }
    if (shipCost < 0) { errEl.innerHTML = `<div class="alert alert-error">Shipping cost cannot be negative.</div>`; return; }
    if (expdCost < 0) { errEl.innerHTML = `<div class="alert alert-error">Expedited shipping cost cannot be negative.</div>`; return; }

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Listing…';

  const now = new Date().toISOString().slice(0, 19);
  const end = new Date(endInput).toISOString().slice(0, 19);

  const res = await Api.createItem({
      name,
      description: desc,
      category,
      startingPrice: price,
      sellerId: user.userId,
      auctionStartTime: now,
      auctionEndTime: end,
      shippingDays: shipDays,
      shippingCost: shipCost,
      expeditedShippingCost: expdCost,
      imageUrl: imageUrl || null,
      condition,
  });

    if (res.ok && res.data.id) {
      toast(`"${name}" listed successfully!`, 'success');
      navigate(`#/item/${res.data.id}`);
    } else {
      errEl.innerHTML = `<div class="alert alert-error">${res.data.message || res.data.error || 'Failed to list item. Make sure you are signed in.'}</div>`;
      submitBtn.disabled    = false;
      submitBtn.textContent = '🏷️ List Item for Auction';
    }
  });

  buildChatBotButton();
}