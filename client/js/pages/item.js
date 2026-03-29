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

  const secsLeft = auction?.secondsRemaining ?? 0;
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
      </div>
    </div>`;

  // Load bid history
  loadBidHistory(itemId);
  await buildChatBotButton();
  // Wire up bid form if auction is open
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

  const noBids      = !auction.highestBidderId || String(auction.highestBidderId) === 'none';
  const currentBid  = auction.currentHighestBid;
  const bidderName  = auction.highestBidderUsername;

  // ── ENDED ────────────────────────────────────────────────────────────────
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

  // ── OPEN ─────────────────────────────────────────────────────────────────
  const cd        = formatCountdown(secsLeft);
  const minNext   = noBids ? Math.ceil(Number(currentBid)) : Math.ceil(Number(currentBid)) + 1;
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

      // Update live display
      const bidVal = document.getElementById('current-bid-value');
      const bidBy  = document.getElementById('current-bid-by');
      if (bidVal) bidVal.textContent = formatMoney(res.data.newHighestBid);
      if (bidBy)  bidBy.textContent  = `by ${res.data.newHighestBidderUsername}`;

      // Bump min
      const minNext = Math.ceil(Number(res.data.newHighestBid)) + 1;
      const bidInput = document.getElementById('bid-amount');
      if (bidInput) { bidInput.placeholder = String(minNext); bidInput.min = String(minNext); }

      await loadBidHistory(itemId);
    } else {
      const msg = res.data.message || 'Bid failed.';
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

// ── Live updates (countdown + polling) ────────────────────────────────────
function startLiveUpdates(itemId, item, initialSecs) {
  let secsLeft = initialSecs;

  // Countdown ticks every second (local)
  const countdownInterval = setInterval(() => {
    if (secsLeft > 0) secsLeft--;
    const cdEl = document.getElementById('countdown-big');
    if (cdEl) cdEl.innerHTML = buildCountdownUnits(formatCountdown(secsLeft));
  }, 1000);

  // Poll server every 8 seconds for live bid updates
  const pollInterval = setInterval(async () => {
    const res = await Api.getAuctionState(itemId);
    if (!res.ok) return;

    const auction = res.data;
    secsLeft = auction.secondsRemaining ?? 0;

    // Update bid display
    const bidVal = document.getElementById('current-bid-value');
    const bidBy  = document.getElementById('current-bid-by');
    if (bidVal) bidVal.textContent = formatMoney(auction.currentHighestBid);
    if (bidBy) {
      const noBids = !auction.highestBidderUsername || String(auction.highestBidderUsername) === 'none';
      bidBy.textContent = noBids ? 'No bids yet — be the first!' : `by ${auction.highestBidderUsername}`;
    }

    // Refresh min bid
    const bidInput = document.getElementById('bid-amount');
    if (bidInput) {
      const minNext = Math.ceil(Number(auction.currentHighestBid)) + 1;
      bidInput.placeholder = String(minNext);
      bidInput.min = String(minNext);
    }

    // Auction ended → reload full page section
    if (auction.status !== 'OPEN' || secsLeft <= 0) {
      clearInterval(countdownInterval);
      clearInterval(pollInterval);
      renderItem(document.getElementById('main'), itemId);
    }
  }, 8000);

  registerCleanup(() => {
    clearInterval(countdownInterval);
    clearInterval(pollInterval);
  });
}

async function buildChatBotButton() {
  const existing = document.getElementById('chatbot');
  if (existing) return; // Prevent duplicates on re-render

  const button = document.createElement('button');
  button.id          = 'chatbot';
  button.textContent = 'Chat Assistant';

  button.addEventListener('click', () => buildChatBotWindow());

  document.body.appendChild(button);
}


async function buildChatBotWindow() {
  // Prevent duplicate windows
  if (document.getElementById('chatbot-window')) return;
  const window = document.createElement('div');
  window.id = 'chatbot-window';
  window.innerHTML = `
    <div id="chatbot-header">
      <span> AI Chat Assistant</span>
      <button id="chatbot-close" onclick="closeChatBotWindow()">✕</button>
    </div>

    <div id="chatbot-messages">
      <div class="chatbot-msg chatbot-msg--ai">
        Hello, I am your AI assistant, please type in your question.
      </div>
    </div>

    <div id="chatbot-input-row">
      <input
        id="chatbot-input"
        type="text"
        placeholder="Type your question…"
      />
      <button id="chatbot-submit">Send</button>
    </div>`;

  document.body.appendChild(window);
  document.getElementById('chatbot-submit').addEventListener('click', () => submitChatBotPrompt());
  document.getElementById('chatbot-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') submitChatBotPrompt();
  });
}

async function submitChatBotPrompt() {
  const input    = document.getElementById('chatbot-input');
  const messages = document.getElementById('chatbot-messages');
  const userText = input?.value?.trim();

  if (!userText) return;

  messages.innerHTML += `
    <div class="chatbot-msg chatbot-msg--user">
      ${userText}
    </div>`;

  const loadingId = `chatbot-loading-${Date.now()}`;
  messages.innerHTML += `
    <div class="chatbot-msg chatbot-msg--ai" id="${loadingId}">
      <div class="spinner"></div> Thinking…
    </div>`;

  input.value    = '';
  input.disabled = true;
  messages.scrollTop = messages.scrollHeight;
  try {
    const res = await Api.prompt(userText);
    // Remove loading indicator
    document.getElementById(loadingId)?.remove();
    if (!res.ok) throw new Error('Bad response');

    // Display AI response
    const aiText = res.data?.response ?? res.data?.message ?? JSON.stringify(res.data);
    messages.innerHTML += `
      <div class="chatbot-msg chatbot-msg--ai">
        ${aiText}
      </div>`;

  } catch {
	alert(JSON.stringify(res.data))
    document.getElementById(loadingId)?.remove();
    messages.innerHTML += `
      <div class="chatbot-msg chatbot-msg--error">
        Sorry, we could not answer this question. Please try again.
      </div>`;
	
  } finally {
    input.disabled = false;
    input.focus();
    messages.scrollTop = messages.scrollHeight;
  }
}


function closeChatBotWindow() {
  document.getElementById('chatbot-window')?.remove();
}
