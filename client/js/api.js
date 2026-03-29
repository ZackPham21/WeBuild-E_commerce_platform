const API_BASE = 'http://localhost:8080/api';

const Api = {
  async _req(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body !== undefined && body !== null) opts.body = JSON.stringify(body);

    try {
      const res = await fetch(API_BASE + path, opts);
      let data;
      try { data = await res.json(); } catch { data = {}; }
      if (res.status === 401) Auth.clear();
      return { ok: res.ok, status: res.status, data };
    } catch {
      return { ok: false, status: 0, data: { message: 'Cannot reach server. Is the gateway running on port 8080?' } };
    }
  },

  signup:  (body)               => Api._req('POST', '/signup', body),
  signin:  (username, password) => Api._req('POST', '/signin', { username, password }),
  signout: ()                   => Api._req('POST', '/signout', null),

  getItems:           ()        => Api._req('GET',  '/items'),
  searchItems:        (kw)      => Api._req('GET',  `/items/search?keyword=${encodeURIComponent(kw)}`),
  getItemsByCategory: (cat)     => Api._req('GET',  `/items/category/${encodeURIComponent(cat)}`),
  getItem:            (id)      => Api._req('GET',  `/items/${id}`),
  deleteItem:         (id)      => Api._req('DELETE', `/items/${id}`),

  getAuctionState:   (id)             => Api._req('GET',  `/auction/state/${id}`),
  placeBid:          (itemId, amount) => Api._req('POST', '/auction/bid', { itemId, amount }),
  getWinner:         (id)             => Api._req('GET',  `/auction/winner/${id}`),
  getBidHistory:     (id)             => Api._req('GET',  `/auction/bids/${id}`),
  getEndedAuctions:  ()               => Api._req('GET',  '/auction/ended'),
  getMyBidHistory:   ()               => Api._req('GET',  '/auction/my-bids'),

  prompt: (prompt) => Api._req('POST', '/chatbot', { prompt }),

  processPayment: (itemId, expedited, cardNumber, cardHolderName, expirationDate, securityCode) =>
    Api._req('POST', '/payment', { itemId, expedited, cardNumber, cardHolderName, expirationDate, securityCode }),
  getReceipt: (id) => Api._req('GET', `/payment/receipt/${id}`),
};
