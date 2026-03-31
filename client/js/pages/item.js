async function renderItem(container, itemId) {
  container.innerHTML = '<div class="loading"><div class="spinner"></div><span>Loading auction…</span></div>';

  const [itemRes, auctionRes, receiptRes] = await Promise.all([
    Api.getItem(itemId),
    Api.getAuctionState(itemId),
    Api.isPaid(itemId),
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

  const item = itemRes.data;

  // Handle race condition: auction may not exist yet if item was just listed
  let auction = auctionRes.ok && !auctionRes.data?.error ? auctionRes.data : null;
  if (!auction) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const retryRes = await Api.getAuctionState(itemId);
    auction = retryRes.ok && !retryRes.data?.error ? retryRes.data : null;
  }

  const isPaid = receiptRes.ok && !receiptRes.data?.error;
  const user = Auth.getUser();

  const endTimeStr = item.auctionEndTime
      ? (item.auctionEndTime.endsWith('Z') ? item.auctionEndTime : item.auctionEndTime + 'Z')
      : null;
  const endTimeMs = endTimeStr ? new Date(endTimeStr).getTime() : 0;
  const secsLeft = Math.max(0, Math.floor((endTimeMs - Date.now()) / 1000));
  const isOpen   = auction?.status === 'OPEN' && secsLeft > 0;

  const emoji    = categoryEmoji(item.category);
  const badgeCls = categoryBadgeClass(item.category);
  const images   = parseImages(item.imageUrl);

  container.innerHTML = `
    <div class="back-btn" onclick="navigate('#/')">← Back to Auctions</div>

    <div class="item-detail-grid">
      <!-- Left column: item info + bid history -->
      <div>
        ${images.length > 0
          ? `<div class="item-gallery">
               <img id="gallery-img" src="${images[0]}" alt="${item.name}" onclick="openLightbox(this.src, '${item.name.replace(/'/g, "\\'")}')">
               ${images.length > 1 ? `
                 <button class="gallery-nav gallery-prev" onclick="itemGalleryNav(-1)">&#8249;</button>
                 <button class="gallery-nav gallery-next" onclick="itemGalleryNav(1)">&#8250;</button>
                 <div class="gallery-counter" id="gallery-counter">1 / ${images.length}</div>` : ''}
             </div>`
          : `<div class="item-hero">${emoji}</div>`}

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
          ${item.condition ? `
          <div class="spec-item">
            <div class="spec-label">Condition</div>
            <div class="spec-value">${item.condition}</div>
          </div>` : ''}
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
          ${buildAuctionPanel(item, auction, isOpen, user, secsLeft, isPaid)}
        </div>
        <div style="margin-top:8px;font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:6px;padding:0 4px">
          <div id="ws-dot" style="width:7px;height:7px;border-radius:50%;background:#ccc;flex-shrink:0"></div>
          <span id="ws-label">Connecting to live updates…</span>
        </div>
      </div>
    </div>`;

  loadBidHistory(itemId);
  buildChatBotButton();

  if (isOpen) {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    wireBidForm(itemId, auction);
    startLiveUpdates(itemId, item, secsLeft, isPaid);
  }

  if (images.length > 1) {
    window._galleryImages = images;
    window._galleryIndex  = 0;
  }
}

function itemGalleryNav(dir) {
  const imgs = window._galleryImages || [];
  if (!imgs.length) return;
  window._galleryIndex = (window._galleryIndex + dir + imgs.length) % imgs.length;
  const img = document.getElementById('gallery-img');
  const ctr = document.getElementById('gallery-counter');
  if (img) img.src = imgs[window._galleryIndex];
  if (ctr) ctr.textContent = `${window._galleryIndex + 1} / ${imgs.length}`;
}

function buildAuctionPanel(item, auction, isOpen, user, secsLeft, isPaid = false) {
  if (!auction) {
    return `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Auction data unavailable</div></div>`;
  }

  const noBids = !auction.highestBidderId
    || auction.highestBidderId === 0
    || String(auction.highestBidderId).toLowerCase() === 'none';

  const currentBid = auction.currentHighestBid;
  const bidderName = auction.highestBidderUsername;

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
        : isPaid
          ? `<div class="alert alert-success" style="margin:0;text-align:center">
               ✅ This item has been sold and paid.
             </div>`
          : `<div class="alert alert-info" style="margin:0">
               The winner is completing payment for this item.
             </div>`
      }`;
  }

  const cd = formatCountdown(secsLeft);

  const minNext   = noBids
    ? Math.ceil(Number(currentBid))
    : Math.ceil(Number(currentBid)) + 1;

  const isWinning  = user && !noBids && String(user.userId) === String(auction.highestBidderId);
  const isSeller   = user && String(user.userId) === String(item.sellerId);

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

    ${isSeller
      ? `<div class="alert alert-info" style="text-align:center;margin:0">
           You cannot bid on your own auction.
         </div>`
      : isWinning
      ? `<div class="alert alert-success" style="text-align:center;margin:0">
           🏆 You're the highest bidder! Wait for someone to outbid you.
         </div>`
      : `<form class="bid-form" id="bid-form" autocomplete="off">
           <div class="bid-input-wrapper">
             <span class="bid-currency">$</span>
             <input class="form-input" type="number" id="bid-amount"
                    placeholder="${minNext}" min="${minNext}" step="1" required>
           </div>
           <p class="bid-hint" id="bid-hint">
             Whole numbers only · ${noBids
               ? `minimum bid: ${formatMoney(currentBid)}`
               : `must beat ${formatMoney(currentBid)}`}
           </p>
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

      // Update display immediately for the bidder themselves
      const bidVal = document.getElementById('current-bid-value');
      const bidBy  = document.getElementById('current-bid-by');
      if (bidVal) bidVal.textContent = formatMoney(res.data.newHighestBid);
      if (bidBy)  bidBy.textContent  = `by ${res.data.newHighestBidderUsername}`;

      // After a successful bid, next bid must strictly beat it
      const minNext  = Math.ceil(Number(res.data.newHighestBid)) + 1;
      const bidInput = document.getElementById('bid-amount');
      if (bidInput) {
        bidInput.placeholder = String(minNext);
        bidInput.min         = String(minNext);
      }

      const hint = document.getElementById('bid-hint');
      if (hint) hint.textContent = `Whole numbers only · must beat ${formatMoney(res.data.newHighestBid)}`;

      await loadBidHistory(itemId);
    } else {
      const msg   = res.data?.message || 'Bid failed.';
      const extra = res.data?.currentHighestBid ? ` (current: ${formatMoney(res.data.currentHighestBid)})` : '';
      alertEl.innerHTML = `<div class="alert alert-error">${msg}${extra}</div>`;
    }

    submitBtn.disabled    = false;
    submitBtn.textContent = 'Place Bid';
  });
}

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

function startLiveUpdates(itemId, item, initialSecs, initialIsPaid) {
  let secsLeft    = initialSecs;
  let isPaid      = !!initialIsPaid;
  let stompClient = null;

  function setWsStatus(connected) {
    const dot   = document.getElementById('ws-dot');
    const label = document.getElementById('ws-label');
    if (dot)   dot.style.background = connected ? '#22c55e' : '#ccc';
    if (label) label.textContent    = connected
      ? 'Live updates connected'
      : 'Live updates unavailable — polling every 8s';
  }

  try {
    const socket = new SockJS('http://localhost:8083/ws');
    stompClient  = Stomp.over(socket);
    stompClient.debug = null;

    stompClient.connect({}, () => {
      console.log('✅ WebSocket connected for item', itemId);
      setWsStatus(true);

      stompClient.subscribe(`/topic/auction/${itemId}`, (msg) => {
        const update = JSON.parse(msg.body);
        console.log('📨 Live bid update received:', update);

        const bidVal = document.getElementById('current-bid-value');
        const bidBy  = document.getElementById('current-bid-by');
        if (bidVal) {
          bidVal.textContent = formatMoney(update.newHighestBid);
          bidVal.style.color = 'var(--success, #22c55e)';
          setTimeout(() => { bidVal.style.color = ''; }, 1000);
        }
        if (bidBy) bidBy.textContent = `by ${update.newHighestBidderUsername}`;

        // After any bid lands via WebSocket, next bid must strictly beat it
        const minNext  = Math.ceil(Number(update.newHighestBid)) + 1;
        const bidInput = document.getElementById('bid-amount');
        if (bidInput) {
          bidInput.placeholder = String(minNext);
          bidInput.min         = String(minNext);
        }

        const hint = document.getElementById('bid-hint');
        if (hint) hint.textContent = `Whole numbers only · must beat ${formatMoney(update.newHighestBid)}`;

        loadBidHistory(itemId);

        const currentUser = Auth.getUser();
        if (currentUser && String(update.newHighestBidderUsername) !== currentUser.username) {
          if (Notification.permission === 'granted') {
            new Notification('You have been outbid!', {
              body: `New highest bid on this item: ${formatMoney(update.newHighestBid)}`,
              icon: '/favicon.ico',
            });
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission();
          }
        }

        if (update.secondsRemaining !== undefined) {
          secsLeft = update.secondsRemaining;
        }

        Api.getAuctionState(itemId).then(freshRes => {
          if (!freshRes.ok) return;
          const panel = document.getElementById('auction-panel');
          if (!panel) return;
          const user = Auth.getUser();
          panel.innerHTML = buildAuctionPanel(item, freshRes.data, true, user, secsLeft, isPaid);
          wireBidForm(itemId, freshRes.data);
        });
      });

    }, (err) => {
      console.log('❌ WebSocket failed, falling back to polling:', err);
      setWsStatus(false);
    });

  } catch (e) {
    console.log('WebSocket not available, using polling only:', e);
    setWsStatus(false);
  }

  const countdownInterval = setInterval(() => {
    if (secsLeft > 0) secsLeft--;
    const cdEl = document.getElementById('countdown-big');
    if (cdEl) cdEl.innerHTML = buildCountdownUnits(formatCountdown(secsLeft));
  }, 1000);

  const pollInterval = setInterval(async () => {
    const res = await Api.getAuctionState(itemId);
    if (!res.ok) return;

    const auction = res.data;
    secsLeft = auction.secondsRemaining ?? 0;

    // Recalculate noBids from latest poll data
    const pollNoBids = !auction.highestBidderId
      || auction.highestBidderId === 0
      || String(auction.highestBidderId).toLowerCase() === 'none';

    const bidVal = document.getElementById('current-bid-value');
    const bidBy  = document.getElementById('current-bid-by');
    if (bidVal) bidVal.textContent = formatMoney(auction.currentHighestBid);
    if (bidBy) {
      bidBy.textContent = pollNoBids
        ? 'No bids yet — be the first!'
        : `by ${auction.highestBidderUsername}`;
    }

    // Respect noBids state when updating min — same logic as buildAuctionPanel
    const bidInput = document.getElementById('bid-amount');
    if (bidInput) {
      const minNext = pollNoBids
        ? Math.ceil(Number(auction.currentHighestBid))      // starting price ok
        : Math.ceil(Number(auction.currentHighestBid)) + 1; // must beat current
      bidInput.placeholder = String(minNext);
      bidInput.min         = String(minNext);
    }

    const hint = document.getElementById('bid-hint');
    if (hint) {
      hint.textContent = pollNoBids
        ? `Whole numbers only · minimum bid: ${formatMoney(auction.currentHighestBid)}`
        : `Whole numbers only · must beat ${formatMoney(auction.currentHighestBid)}`;
    }

    if (auction.status !== 'OPEN' || secsLeft <= 0) {
      clearInterval(countdownInterval);
      clearInterval(pollInterval);
      if (stompClient) try { stompClient.disconnect(); } catch {}
      renderItem(document.getElementById('main'), itemId);
    }
  }, 8000);

  registerCleanup(() => {
    clearInterval(countdownInterval);
    clearInterval(pollInterval);
    if (stompClient) try { stompClient.disconnect(); } catch {}
  });
}