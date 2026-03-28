// ── Auth state (localStorage) ──────────────────────────────────────────────
const Auth = {
  getToken:   () => localStorage.getItem('wb_token'),
  getUser:    () => { try { return JSON.parse(localStorage.getItem('wb_user')); } catch { return null; } },
  isLoggedIn: () => !!localStorage.getItem('wb_token'),
  setAuth(token, userId, username) {
    localStorage.setItem('wb_token', token);
    localStorage.setItem('wb_user', JSON.stringify({ userId, username }));
  },
  clear() {
    localStorage.removeItem('wb_token');
    localStorage.removeItem('wb_user');
  },
};
