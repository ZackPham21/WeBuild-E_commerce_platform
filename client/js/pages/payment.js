// ── Payment Form ───────────────────────────────────────────────────────────
async function renderPayment(container, itemId) {
  container.innerHTML = '<div class="loading"><div class="spinner"></div><span>Loading payment details…</span></div>';

  const [itemRes, winnerRes] = await Promise.all([
    Api.getItem(itemId),
    Api.getWinner(itemId),
  ]);

  if (!itemRes.ok) {
    container.innerHTML = notFoundHtml(itemId);
    return;
  }

  const item   = itemRes.data;
  const winner = winnerRes.data;

  // Auction still open or no winner yet
  if (!winnerRes.ok || winner?.error) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⏳</div>
        <div class="empty-state-title">Auction not ended yet</div>
        <p style="margin-top:8px;color:var(--text-muted)">Payment is only available after the auction closes.</p>
        <button class="btn btn-outline" onclick="navigate('#/item/${itemId}')" style="margin-top:16px">View Auction</button>
      </div>`;
    return;
  }

  const user     = Auth.getUser();
  const isWinner = user && String(user.userId) === String(winner.winnerUserId);

  if (!isWinner) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔒</div>
        <div class="empty-state-title">Access Denied</div>
        <p style="margin-top:8px;color:var(--text-muted)">Only the auction winner can complete payment.</p>
        <button class="btn btn-outline" onclick="navigate('#/item/${itemId}')" style="margin-top:16px">View Auction</button>
      </div>`;
    return;
  }

  const winningBid  = Number(winner.winningBid);
  const stdShip     = Number(item.shippingCost)          || 0;
  const expdShip    = Number(item.expeditedShippingCost) || 0;

  container.innerHTML = `
    <div class="back-btn" onclick="navigate('#/item/${itemId}')">← Back to Auction</div>

    <div class="page-header">
      <div class="page-title">Complete Payment</div>
      <div class="page-subtitle">You won "${item.name}" — secure your item below</div>
    </div>

    <div class="payment-grid">
      <!-- Payment form -->
      <div class="card">
        <h2 style="font-size:17px;font-weight:700;margin-bottom:20px">Card Details</h2>

        <div id="pay-error"></div>

        <form id="pay-form" autocomplete="off" novalidate>
          <div class="form-group">
            <label class="form-label">Card Number</label>
            <input class="form-input card-input" type="text" id="pay-card"
                   placeholder="1234 5678 9012 3456" maxlength="19" required>
          </div>
          <div class="form-group">
            <label class="form-label">Cardholder Name</label>
            <input class="form-input" type="text" id="pay-name"
                   placeholder="John Doe" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Expiry Date</label>
              <input class="form-input" type="text" id="pay-expiry"
                     placeholder="MM/YY" maxlength="5" required>
            </div>
            <div class="form-group">
              <label class="form-label">CVV</label>
              <input class="form-input" type="text" id="pay-cvv"
                     placeholder="123" maxlength="4" required>
            </div>
          </div>

          <div class="divider"></div>

          <h3 style="font-size:15px;font-weight:700;margin-bottom:12px">Shipping Method</h3>
          <div class="shipping-options">
            <label class="shipping-option selected" id="opt-std">
              <input type="radio" name="shipping" value="standard" checked
                     onchange="onShippingChange(${winningBid}, ${stdShip}, ${expdShip})">
              <div class="shipping-option-info">
                <div class="shipping-option-name">Standard Shipping</div>
                <div class="shipping-option-detail">${item.shippingDays || '?'} business days</div>
              </div>
              <div class="shipping-option-price">${formatMoney(stdShip)}</div>
            </label>
            <label class="shipping-option" id="opt-expd">
              <input type="radio" name="shipping" value="expedited"
                     onchange="onShippingChange(${winningBid}, ${stdShip}, ${expdShip})">
              <div class="shipping-option-info">
                <div class="shipping-option-name">Expedited Shipping</div>
                <div class="shipping-option-detail">Priority delivery</div>
              </div>
              <div class="shipping-option-price">${formatMoney(expdShip)}</div>
            </label>
          </div>

          <button class="btn btn-primary btn-full btn-lg" type="submit" id="pay-submit">
            💳 Complete Purchase
          </button>
        </form>
      </div>

      <!-- Order summary sidebar -->
      <div>
        <div class="card" style="margin-bottom:16px">
          <h2 style="font-size:16px;font-weight:700;margin-bottom:16px">Order Summary</h2>
          <div class="order-row">
            <span style="color:var(--text-muted)">Item</span>
            <span style="font-weight:600;max-width:180px;text-align:right;font-size:13px">${item.name}</span>
          </div>
          <div class="order-row">
            <span style="color:var(--text-muted)">Winning Bid</span>
            <span style="font-weight:600">${formatMoney(winningBid)}</span>
          </div>
          <div class="order-row">
            <span style="color:var(--text-muted)">Shipping</span>
            <span id="summary-shipping">${formatMoney(stdShip)}</span>
          </div>
          <div class="order-total">
            <span>Total</span>
            <span id="summary-total">${formatMoney(winningBid + stdShip)}</span>
          </div>
        </div>

        <div class="card" style="background:#fffbeb;border:1.5px solid #fcd34d">
          <div style="font-size:14px;font-weight:700;margin-bottom:6px">🏆 Congratulations!</div>
          <div style="font-size:13px;color:#92400e;line-height:1.5">
            You won this auction with a bid of <strong>${formatMoney(winningBid)}</strong>.
            Complete payment to secure the item.
          </div>
        </div>
      </div>
    </div>`;

  // ── Input formatting ───────────────────────────────────────────────────
  document.getElementById('pay-card').addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 16);
    e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
  });

  document.getElementById('pay-expiry').addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
    e.target.value = v;
  });

  document.getElementById('pay-cvv').addEventListener('input', e => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
  });

  // ── Form submit ────────────────────────────────────────────────────────
  document.getElementById('pay-form').addEventListener('submit', async e => {
    e.preventDefault();
    const errEl     = document.getElementById('pay-error');
    const submitBtn = document.getElementById('pay-submit');
    errEl.innerHTML = '';

    const expedited      = document.querySelector('input[name="shipping"]:checked').value === 'expedited';
    const cardNumber     = document.getElementById('pay-card').value.replace(/\s/g, '');
    const cardHolderName = document.getElementById('pay-name').value.trim();
    const expirationDate = document.getElementById('pay-expiry').value.trim();
    const securityCode   = document.getElementById('pay-cvv').value.trim();

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Processing…';

    const res = await Api.processPayment(
      Number(itemId), expedited, cardNumber, cardHolderName, expirationDate, securityCode
    );

    if (res.ok && res.data.success) {
      toast('Payment successful!', 'success');
      navigate(`#/receipt/${itemId}`);
    } else {
      errEl.innerHTML = `<div class="alert alert-error">${res.data.message || 'Payment failed. Please check your details.'}</div>`;
      submitBtn.disabled    = false;
      submitBtn.textContent = '💳 Complete Purchase';
    }
  });
}

function onShippingChange(winningBid, stdShip, expdShip) {
  const expedited = document.querySelector('input[name="shipping"]:checked')?.value === 'expedited';
  const shipping  = expedited ? expdShip : stdShip;

  const summaryShipping = document.getElementById('summary-shipping');
  const summaryTotal    = document.getElementById('summary-total');
  if (summaryShipping) summaryShipping.textContent = formatMoney(shipping);
  if (summaryTotal)    summaryTotal.textContent    = formatMoney(winningBid + shipping);

  document.getElementById('opt-std')?.classList.toggle('selected', !expedited);
  document.getElementById('opt-expd')?.classList.toggle('selected', expedited);
}

function notFoundHtml(itemId) {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">❌</div>
      <div class="empty-state-title">Item not found</div>
      <button class="btn btn-outline" onclick="navigate('#/')" style="margin-top:16px">Back to Auctions</button>
    </div>`;
}
