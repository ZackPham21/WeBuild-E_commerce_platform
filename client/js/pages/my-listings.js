// ── My Listings ────────────────────────────────────────────────────────────
async function renderMyListings(container) {
  const user = Auth.getUser();

  container.innerHTML = `
    <div class="back-btn" onclick="navigate('#/')">← Back to Auctions</div>
    <div class="page-header">
      <div class="page-title">My Listings</div>
      <div class="page-subtitle">Items you've listed for auction</div>
    </div>
    <div class="tab-bar">
      <button class="tab-btn active" id="tab-active" onclick="switchListingsTab('active')">Live</button>
      <button class="tab-btn"        id="tab-ended"  onclick="switchListingsTab('ended')">Ended</button>
    </div>
    <div id="listings-panel">
      <div class="loading" style="grid-column:1/-1"><div class="spinner"></div><span>Loading…</span></div>
    </div>`;

 // Replace the single Api.getItems() call with:
 const res = await Api.getItems();
 if (!res.ok) {
     document.getElementById('listings-panel').innerHTML =
         `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Failed to load listings</div></div>`;
     return;
 }

 const all = (Array.isArray(res.data) ? res.data : [])
     .filter(item => String(item.sellerId) === String(user.userId));

  // Fetch auction state for each in parallel so we know which are live vs ended
  const auctionResults = await Promise.all(all.map(item => Api.getAuctionState(item.id)));
  const auctionMap = {};
  all.forEach((item, i) => {
    if (auctionResults[i].ok) auctionMap[item.id] = auctionResults[i].data;
  });

  // Split by status
 const now = Date.now();

 const liveItems = all.filter(item => {
   const a = auctionMap[item.id];
   // Primary check: trust auctionState if available
   if (a && a.status === 'OPEN' && (a.secondsRemaining ?? 0) > 0) return true;
   // Fallback: compare endTime directly from item data
   if (!a && item.auctionEndTime) {
     return new Date(item.auctionEndTime).getTime() > now;
   }
   return false;
 });

 const endedItems = all.filter(item => {
     const a = auctionMap[item.id];
     return !a || a.status !== 'OPEN' || (a.secondsRemaining ?? 0) <= 0;
 });
  // Store for tab switching
  window._myListingsLive  = liveItems;
  window._myListingsEnded = endedItems;
  window._myListingsAuctionMap = auctionMap;

  renderListingsTab('active');
  await buildChatBotButton();
}

function switchListingsTab(tab) {
  document.getElementById('tab-active')?.classList.toggle('active', tab === 'active');
  document.getElementById('tab-ended')?.classList.toggle('active', tab === 'ended');
  renderListingsTab(tab);
}

function renderListingsTab(tab) {
  const panel = document.getElementById('listings-panel');
  if (!panel) return;
  const items = tab === 'active' ? window._myListingsLive : window._myListingsEnded;
  const auctionMap = window._myListingsAuctionMap || {};

  if (!items?.length) {
    panel.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${tab === 'active' ? '📦' : '🏁'}</div>
        <div class="empty-state-title">${tab === 'active' ? 'No active listings' : 'No ended listings'}</div>
        ${tab === 'active' ? `<p style="margin-bottom:16px">Items you list will appear here</p>
          <button class="btn btn-primary" onclick="navigate('#/sell')">🏷️ List an Item</button>` : ''}
      </div>`;
    return;
  }

  panel.innerHTML = `<div class="items-grid">${items.map(item => buildMyListingCard(item, auctionMap[item.id], tab)).join('')}</div>`;
}

function buildMyListingCard(item, auction, tab) {
  const emoji    = categoryEmoji(item.category);
  const badgeCls = categoryBadgeClass(item.category);
  const isEnded  = tab === 'ended';

  const noBids   = !auction?.highestBidderId || String(auction.highestBidderId) === 'none';
  const bidLabel = noBids ? 'Starting At' : 'Final Bid';
  const bidValue = noBids ? item.startingPrice : auction.currentHighestBid;

  const cd = isEnded ? null : formatCountdown(auction?.secondsRemaining ?? 0);

  return `
    <div class="item-card">
      <div class="item-card-thumb" onclick="navigate('#/item/${item.id}')" style="cursor:pointer">
        ${emoji}
        ${!isEnded ? `<span class="live-badge-card"><span class="live-badge-dot"></span>LIVE</span>` : ''}
      </div>
      <div class="item-card-body">
        <div class="item-card-header">
          <div class="item-card-name" onclick="navigate('#/item/${item.id}')" style="cursor:pointer">${item.name}</div>
          <span class="badge ${badgeCls}">${item.category || 'Other'}</span>
        </div>
        <div class="item-card-desc">${item.description || 'No description.'}</div>
        <div class="item-card-footer">
          <div>
            <div class="bid-label">${bidLabel}</div>
            <div class="bid-amount">${formatMoney(bidValue)}</div>
          </div>
          ${isEnded
            ? `<span class="countdown ended">Ended</span>`
            : `<span class="countdown ${cd.urgency}">${cd.text}</span>`
          }
        </div>
        ${isEnded && !noBids ? `
          <div style="margin-top:8px;font-size:12px;color:var(--text-muted)">
            Won by <strong>${auction.highestBidderUsername}</strong>
          </div>` : ''}
        <div style="margin-top:12px;display:flex;gap:8px">
          <button class="btn btn-outline" style="flex:1;font-size:13px" onclick="navigate('#/item/${item.id}')">View</button>
          <button class="btn btn-danger"  style="font-size:13px" onclick="askDeleteListing(${item.id}, '${item.name.replace(/'/g, "\\'")}')">🗑 Delete</button>
        </div>
      </div>
    </div>`;
}

function askDeleteListing(itemId, itemName) {
  showModal({
    title: 'Delete listing',
    body:  `Are you sure you want to delete <strong>${itemName}</strong>? This cannot be undone.`,
    confirmText:  'Delete',
    confirmClass: 'btn-danger',
    onConfirm: async () => {
      const res = await Api.deleteItem(itemId);
      if (res.ok && res.data.success) {
        toast(`"${itemName}" deleted.`, 'success');
        renderMyListings(document.getElementById('main'));
      } else {
        toast(res.data?.error || 'Failed to delete item.', 'error');
      }
    },
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
