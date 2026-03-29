// ── Item Detail + Bid + Auction Ended / Winner ─────────────────────────────
async function renderItem(container, itemId) {
  container.innerHTML = '<div class="loading"><div class="spinner"></div><span>Loading auction…</span></div>';

  const [itemRes, auctionRes] = await Promise.all([
    Api.getItem(itemId),
    Api.getAuctionState(itemId),
  ]);

  if (!itemRes.ok) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <div class="empty-state-title">Item not found</div>
        <button class="btn btn-outline" onclick="navigate('#/')" style="margin-top:16px">Back to Auctions</button>
      </div>`;
    return;
  }

  const item    = itemRes.data;
  const auction = auctionRes.ok ? auctionRes.data : null;
  const user    = Auth.getUser();

  // Calculate time locally from end time string to avoid server timezone issues
  const endTimeMs = item.auctionEndTime
    ? new Date(item.auctionEndTime + (item.auctionEndTime.endsWith('Z') ? '' : 'Z')).getTime()
    : 0;
  const secsLeft = Math.max(0, Math.floor((endTimeMs - Date.now()) / 1000));
  const isOpen   = auction?.status === 'OPEN' && secsLeft > 0;

  const emoji    = categoryEmoji(item.category);
  const badgeCls = categoryBadgeClass(item.category);

  container.innerHTML = `
    <div class="back-btn" onclick="navigate('#/')">← Back to Auctions</div>

    <div class="item-detail-grid">
      <!-- Left column: item info + bid history -->
      <div>
        <div class="item-hero">${emoji}</div>

        <div class="item-meta">
          <span class="badge ${badgeCls}">${item.category || 'Other'}</span>
          <span class="badge ${isOpen ? 'badge-open' : 'badge-closed'}">${isOpen ? '🟢 Live' : '🔴 Ended'}</span>
        </div>

        <h1 class="detail-title">${item.name}</h1>
        <p class="detail-desc">${item.description || 'No description provided.'}</p>

        <div class="detail-specs">
          <div class="spec-item">
            <div class="spec-label">Starting Price</div>
            <div class="spec-value">${formatMoney(item.startingPrice)}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">Seller ID</div>
            <div class="spec-value">#${item.sellerId}</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">Standard Shipping</div>
            <div class="spec-value">${formatMoney(item.shippingCost)} · ${item.shippingDays}d</div>
          </div>
          <div class="spec-item">
            <div class="spec-label">Expedited Shipping</div>
            <div class="spec-value">${formatMoney(item.expeditedShippingCost)}</div>
          </div>
        </div>

        <div id="bid-history-section">
          <div class="loading" style="padding:24px"><div class="spinner"></div></div>
        </div>
      </div>

      <!-- Right column: auction panel -->
      <div>
        <div class="card auction-panel" id="auction-panel">
          ${buildAuctionPanel(item, auction, isOpen, user, secsLeft)}
        </div>
        <div class="ws-status" id="ws-status" style="margin-top:8px;font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:6px;padding:0 4px">
          <div id="ws-dot" style="width:7px;height:7px;border-radius:50%;background:#ccc;flex-shrink:0"></div>
          <span id="ws-label">Connecting to live updates…</span>
        </div>
      </div>
    </div>`;

  // Load bid history
  loadBidHistory(itemId);
  buildChatBotButton();

  // Wire up bid form and live updates if auction is open
  if (isOpen) {
    wireBidForm(itemId, auction);
    startLiveUpdates(itemId, item, secsLeft);
  }
}

// ── Auction panel HTML ─────────────────────────────────────────────────────
function buildAuctionPanel(item, auction, isOpen, user, secsLeft) {
  if (!auction) {
    return `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Auction data unavailable</div></div>`;
  }

  const noBids     = !auction.highestBidderId || String(auction.highestBidderId) === 'none';
  const currentBid = auction.currentHighestBid;
  const bidderName = auction.highestBidderUsername;

  // ── ENDED ──────────────────────────────────────────────────────────────
  if (!isOpen) {
    if (noBids) {
      return `
        <div class="ended-banner">
          <div style="font-size:48px;margin-bottom:8px">🔔</div>
          <div style="font-size:18px;font-weight:700;margin-bottom:4px">Auction Ended</div>
          <div style="color:var(--text-muted);font-size:14px">No bids were placed on this item.</div>
        </div>`;
    }

    const isWinner = user && String(user.userId) === String(auction.highestBidderId);
    return `
      <div class="winner-banner">
        <div class="winner-icon">🏆</div>
        <div class="winner-title">Auction Won!</div>
        <div class="winner-username">by <strong>${bidderName}</strong></div>
        <div class="winner-amount">${formatMoney(currentBid)}</div>
      </div>
      ${isWinner
        ? `<button class="btn btn-success btn-full btn-lg" onclick="navigate('#/payment/${item.id}')">
             💳 Pay Now
           </button>
           <p style="text-align:center;font-size:12px;color:var(--text-muted);margin-top:10px">
             You won! Complete payment to claim your item.
           </p>`
        : `<div class="alert alert-info" style="margin:0">
             The winner is completing payment for this item.
           </div>`
      }`;
  }

  // ── OPEN ───────────────────────────────────────────────────────────────
  const cd      = formatCountdown(secsLeft);
  const minNext = noBids ? Math.ceil(Number(currentBid)) : Math.ceil(Number(currentBid)) + 1;
  const isWinning = user && !noBids && String(user.userId) === String(auction.highestBidderId);

  return `
    <div class="section-label" style="text-align:center">Time Remaining</div>
    <div class="countdown-big" id="countdown-big">
      ${buildCountdownUnits(cd)}
    </div>

    <div class="current-bid-display">
      <div class="current-bid-label">${noBids ? 'Starting Bid' : 'Current Highest Bid'}</div>
      <div class="current-bid-value" id="current-bid-value">${formatMoney(currentBid)}</div>
      <div class="current-bid-by"   id="current-bid-by">${noBids ? 'No bids yet — be the first!' : `by ${bidderName}`}</div>
    </div>

    <div id="bid-alert"></div>

    ${isWinning
      ? `<div class="alert alert-success" style="text-align:center;margin:0">
           🏆 You're the highest bidder! Wait for someone to outbid you.
         </div>`
      : `<form class="bid-form" id="bid-form" autocomplete="off">
           <div class="bid-input-wrapper">
             <span class="bid-currency">$</span>
             <input class="form-input" type="number" id="bid-amount"
                    placeholder="${minNext}" min="${minNext}" step="1" required>
           </div>
           <p class="bid-hint">Whole numbers only · ${noBids ? `starting at ${formatMoney(currentBid)}` : `must beat ${formatMoney(currentBid)}`}</p>
           <button class="btn btn-primary btn-full btn-lg" type="submit" id="bid-submit">Place Bid</button>
         </form>`
    }`;
}

function buildCountdownUnits(cd) {
  if (cd.text === 'Ended') {
    return `<div style="font-size:18px;font-weight:700;color:var(--danger);padding:8px">Auction has ended</div>`;
  }
  return `
    <div class="countdown-unit"><div class="countdown-value">${cd.d}</div><div class="countdown-unit-label">Days</div></div>
    <div class="countdown-unit"><div class="countdown-value">${String(cd.h).padStart(2,'0')}</div><div class="countdown-unit-label">Hrs</div></div>
    <div class="countdown-unit"><div class="countdown-value">${String(cd.m).padStart(2,'0')}</div><div class="countdown-unit-label">Min</div></div>
    <div class="countdown-unit"><div class="countdown-value">${String(cd.s).padStart(2,'0')}</div><div class="countdown-unit-label">Sec</div></div>`;
}

// ── Bid form wire-up ───────────────────────────────────────────────────────
function wireBidForm(itemId, auction) {
  const form = document.getElementById('bid-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const alertEl   = document.getElementById('bid-alert');
    const submitBtn = document.getElementById('bid-submit');
    const raw       = document.getElementById('bid-amount').value.trim();
    const amount    = parseInt(raw, 10);

    alertEl.innerHTML = '';

    if (!raw || isNaN(amount) || amount <= 0) {
      alertEl.innerHTML = `<div class="alert alert-error">Enter a valid whole number amount.</div>`;
      return;
    }

    submitBtn.disabled    = true;
    submitBtn.textContent = 'Placing bid…';

    const res = await Api.placeBid(Number(itemId), amount);

    if (res.ok && res.data.success) {
      toast(`Bid of ${formatMoney(amount)} placed!`, 'success');
      alertEl.innerHTML = `<div class="alert alert-success">Bid placed successfully!</div>`;
      document.getElementById('bid-amount').value = '';

      // Update live display immediately for the bidder themselves
      const bidVal = document.getElementById('current-bid-value');
      const bidBy  = document.getElementById('current-bid-by');
      if (bidVal) bidVal.textContent = formatMoney(res.data.newHighestBid);
      if (bidBy)  bidBy.textContent  = `by ${res.data.newHighestBidderUsername}`;

      // Bump min bid input
      const minNext  = Math.ceil(Number(res.data.newHighestBid)) + 1;
      const bidInput = document.getElementById('bid-amount');
      if (bidInput) { bidInput.placeholder = String(minNext); bidInput.min = String(minNext); }

      await loadBidHistory(itemId);
    } else {
      const msg   = res.data.message || 'Bid failed.';
      const extra = res.data.currentHighestBid ? ` (current: ${formatMoney(res.data.currentHighestBid)})` : '';
      alertEl.innerHTML = `<div class="alert alert-error">${msg}${extra}</div>`;
    }

    submitBtn.disabled    = false;
    submitBtn.textContent = 'Place Bid';
  });
}

// ── Bid history ────────────────────────────────────────────────────────────
async function loadBidHistory(itemId) {
  const section = document.getElementById('bid-history-section');
  if (!section) return;

  const res  = await Api.getBidHistory(itemId);
  const bids = Array.isArray(res.data) ? res.data : [];

  if (!bids.length) {
    section.innerHTML = `
      <div class="section-title">Bid History</div>
      <div class="empty-state" style="padding:24px">
        <div class="empty-state-icon">📋</div>
        <div>No bids placed yet</div>
      </div>`;
    return;
  }

  section.innerHTML = `
    <div class="section-title">
      Bid History
      <span style="font-size:13px;font-weight:400;color:var(--text-muted)">(${bids.length} bid${bids.length !== 1 ? 's' : ''})</span>
    </div>
    <table class="bid-table">
      <thead>
        <tr><th></th><th>Bidder</th><th>Amount</th><th>Time</th></tr>
      </thead>
      <tbody>
        ${bids.map((b, i) => `
          <tr class="${i === 0 ? 'bid-winner-row' : ''}">
            <td>${i === 0 ? '🥇' : i + 1}</td>
            <td>${b.username}</td>
            <td><strong>${formatMoney(b.amount)}</strong></td>
            <td style="color:var(--text-muted);font-size:12px">${formatDate(b.timestamp)}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

// ── Live updates: WebSocket + polling fallback ─────────────────────────────
function startLiveUpdates(itemId, item, initialSecs) {
  let secsLeft    = initialSecs;
  let stompClient = null;

  // ── WebSocket for instant bid updates ────────────────────────────────────
  function setWsStatus(connected) {
    const dot   = document.getElementById('ws-dot');
    const label = document.getElementById('ws-label');
    if (dot)   dot.style.background   = connected ? '#22c55e' : '#ccc';
    if (label) label.textContent      = connected ? 'Live updates connected' : 'Live updates unavailable — polling every 8s';
  }

  try {
    const socket = new SockJS('http://localhost:8083/ws');
    stompClient  = Stomp.over(socket);
    stompClient.debug = null; // silence STOMP frame logs

    stompClient.connect({}, () => {
      console.log('✅ WebSocket connected for item', itemId);
      setWsStatus(true);

      stompClient.subscribe(`/topic/auction/${itemId}`, (msg) => {
        const update = JSON.parse(msg.body);
        console.log('📨 Live bid update received:', update);

        // Update bid amount and bidder name instantly
        const bidVal = document.getElementById('current-bid-value');
        const bidBy  = document.getElementById('current-bid-by');
        if (bidVal) {
          bidVal.textContent   = formatMoney(update.newHighestBid);
          bidVal.style.color   = 'var(--success, #22c55e)';
          setTimeout(() => { bidVal.style.color = ''; }, 1000);
        }
        if (bidBy) bidBy.textContent = `by ${update.newHighestBidderUsername}`;

        // Update minimum bid input
        const bidInput = document.getElementById('bid-amount');
        if (bidInput) {
          const minNext          = Math.ceil(Number(update.newHighestBid)) + 1;
          bidInput.placeholder   = String(minNext);
          bidInput.min           = String(minNext);
        }

        // Update bid hint text
        const hint = document.querySelector('.bid-hint');
        if (hint) hint.textContent = `Whole numbers only · must beat ${formatMoney(update.newHighestBid)}`;

        // Refresh bid history table
        loadBidHistory(itemId);

        // Sync seconds remaining if provided
        if (update.secondsRemaining !== undefined) {
          secsLeft = update.secondsRemaining;
        }
      });

    }, (err) => {
      console.log('❌ WebSocket failed, falling back to polling:', err);
      setWsStatus(false);
    });

  } catch (e) {
    console.log('WebSocket not available, using polling only:', e);
    setWsStatus(false);
  }

  // ── Countdown ticks every second (local clock) ───────────────────────────
  const countdownInterval = setInterval(() => {
    if (secsLeft > 0) secsLeft--;
    const cdEl = document.getElementById('countdown-big');
    if (cdEl) cdEl.innerHTML = buildCountdownUnits(formatCountdown(secsLeft));
  }, 1000);

  // ── Poll server every 8 seconds as fallback ──────────────────────────────
  const pollInterval = setInterval(async () => {
    const res = await Api.getAuctionState(itemId);
    if (!res.ok) return;

    const auction = res.data;
    secsLeft      = auction.secondsRemaining ?? 0;

    // Update bid display from poll
    const bidVal = document.getElementById('current-bid-value');
    const bidBy  = document.getElementById('current-bid-by');
    if (bidVal) bidVal.textContent = formatMoney(auction.currentHighestBid);
    if (bidBy) {
      const noBids   = !auction.highestBidderUsername || String(auction.highestBidderUsername) === 'none';
      bidBy.textContent = noBids ? 'No bids yet — be the first!' : `by ${auction.highestBidderUsername}`;
    }

    // Update min bid input from poll
    const bidInput = document.getElementById('bid-amount');
    if (bidInput) {
      const minNext        = Math.ceil(Number(auction.currentHighestBid)) + 1;
      bidInput.placeholder = String(minNext);
      bidInput.min         = String(minNext);
    }

    // Auction ended — stop everything and reload the panel
    if (auction.status !== 'OPEN' || secsLeft <= 0) {
      clearInterval(countdownInterval);
      clearInterval(pollInterval);
      if (stompClient) try { stompClient.disconnect(); } catch {}
      renderItem(document.getElementById('main'), itemId);
    }
  }, 8000);

  // ── Cleanup when navigating away ─────────────────────────────────────────
  registerCleanup(() => {
    clearInterval(countdownInterval);
    clearInterval(pollInterval);
    if (stompClient) try { stompClient.disconnect(); } catch {}
  });
}