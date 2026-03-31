const Auth = {
  getToken:   () => sessionStorage.getItem('wb_token'),
  getUser:    () => { try { return JSON.parse(sessionStorage.getItem('wb_user')); } catch { return null; } },
  isLoggedIn: () => !!sessionStorage.getItem('wb_token'),
  setAuth(token, userId, username) {
    sessionStorage.setItem('wb_token', token);
    sessionStorage.setItem('wb_user', JSON.stringify({ userId, username }));
  },
  clear() {
    sessionStorage.removeItem('wb_token');
    sessionStorage.removeItem('wb_user');
  },
};
