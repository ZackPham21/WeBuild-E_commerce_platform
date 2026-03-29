// ── Login Page ─────────────────────────────────────────────────────────────
async function renderLogin(container) {
  container.innerHTML = `
    <div class="login-split">

      <!-- Left: dark branding panel -->
      <div class="login-panel-left">
        <canvas id="login-canvas" class="login-canvas"></canvas>
        <div class="login-panel-inner">
          <div class="login-brand" onclick="navigate('#/')">We<span>Build</span></div>
          <h2 class="login-panel-title">The marketplace<br>where bidders win.</h2>
          <p class="login-panel-sub">Live auctions, real-time bids, and a community of buyers and sellers.</p>

          <div class="login-stats">
            <div class="login-stat">
              <div class="login-stat-value">⚡ Live</div>
              <div class="login-stat-label">Real-time bidding</div>
            </div>
            <div class="login-stat">
              <div class="login-stat-value">🔒 Safe</div>
              <div class="login-stat-label">Secure transactions</div>
            </div>
            <div class="login-stat">
              <div class="login-stat-value">🏆 Fair</div>
              <div class="login-stat-label">Highest bid wins</div>
            </div>
          </div>

        </div>
      </div>

      <!-- Right: form panel -->
      <div class="login-panel-right">
        <div class="login-form-wrap">
          <h1 class="auth-title" style="margin-bottom:6px">Welcome back</h1>
          <p class="auth-sub" style="margin-bottom:28px">Sign in to continue bidding</p>

          <form id="login-form" autocomplete="off">
            <div class="form-group">
              <label class="form-label" for="login-username">Username</label>
              <input class="form-input" type="text" id="login-username" placeholder="Enter your username" required autofocus>
            </div>
            <div class="form-group">
              <label class="form-label" for="login-password">Password</label>
              <div class="password-wrap">
                <input class="form-input" type="password" id="login-password" placeholder="Enter your password" required>
                <button type="button" class="password-toggle" onclick="togglePassword('login-password', this)">Show</button>
              </div>
            </div>

            <div id="login-alert"></div>

            <button class="btn btn-primary btn-full btn-lg" type="submit" id="login-submit">Sign In</button>
          </form>

          <div class="auth-footer">
            Don't have an account? <a class="auth-link" onclick="navigate('#/signup')">Create one</a>
          </div>
        </div>
      </div>
    </div>`;

  startCanvasEffect('login-canvas', document.querySelector('.login-panel-left'));

  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const alertEl  = document.getElementById('login-alert');
    const submitBtn = document.getElementById('login-submit');
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    alertEl.innerHTML = '';
    if (!username || !password) {
      alertEl.innerHTML = `<div class="alert alert-error">Please fill in all fields.</div>`;
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in…';

    const res = await Api.signin(username, password);

    if (res.ok && res.data.success) {
      Auth.setAuth(res.data.token, res.data.userId, res.data.username);
      toast(`Welcome back, ${res.data.username}!`, 'success');
      navigate('#/');
    } else {
      const msg = res.data?.message || res.data?.error || 'Invalid username or password.';
      alertEl.innerHTML = `<div class="alert alert-error">${msg}</div>`;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  });
}


function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = 'Hide';
  } else {
    input.type = 'password';
    btn.textContent = 'Show';
  }
}
