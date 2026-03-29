// ── Validation rules ───────────────────────────────────────────────────────
const RULES = {
  username: {
    validate(v) {
      if (v.length < 3)  return 'Must be at least 3 characters.';
      if (v.length > 20) return 'Must be 20 characters or fewer.';
      if (!/^[a-zA-Z0-9_-]+$/.test(v))
        return 'Letters, numbers, underscores and hyphens only — no spaces or special characters.';
      if (/^[_-]|[_-]$/.test(v))
        return 'Cannot start or end with an underscore or hyphen.';
      return null;
    },
    hint: '3–20 characters · letters, numbers, _ and - only',
  },
  password: {
    validate(v) {
      if (v.length < 8)          return 'Must be at least 8 characters.';
      if (v.length > 64)         return 'Must be 64 characters or fewer.';
      if (!/[A-Z]/.test(v))      return 'Must contain at least one uppercase letter.';
      if (!/[a-z]/.test(v))      return 'Must contain at least one lowercase letter.';
      if (!/[0-9]/.test(v))      return 'Must contain at least one number.';
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v))
        return 'Must contain at least one special character (e.g. ! @ # $).';
      return null;
    },
    hint: '8+ chars · uppercase · lowercase · number · special char',
  },
  firstName: {
    validate(v) {
      if (v.length < 1)  return 'First name is required.';
      if (v.length > 50) return 'Must be 50 characters or fewer.';
      if (!/^[a-zA-ZÀ-ÿ][a-zA-ZÀ-ÿ' -]*$/.test(v))
        return 'Letters, spaces, hyphens and apostrophes only.';
      return null;
    },
  },
  lastName: {
    validate(v) {
      if (v.length < 1)  return 'Last name is required.';
      if (v.length > 50) return 'Must be 50 characters or fewer.';
      if (!/^[a-zA-ZÀ-ÿ][a-zA-ZÀ-ÿ' -]*$/.test(v))
        return 'Letters, spaces, hyphens and apostrophes only.';
      return null;
    },
  },
  streetNumber: {
    validate(v) {
      if (!v) return 'Street number is required.';
      if (!/^\d{1,6}[a-zA-Z]?$/.test(v))
        return 'Must be a number (1–6 digits), optionally followed by a letter (e.g. 123, 45A).';
      return null;
    },
  },
  streetName: {
    validate(v) {
      if (v.length < 2)   return 'Street name is required.';
      if (v.length > 100) return 'Must be 100 characters or fewer.';
      if (!/^[a-zA-ZÀ-ÿ0-9][a-zA-ZÀ-ÿ0-9 .'"-]*$/.test(v))
        return 'Letters, numbers, spaces and common punctuation only.';
      return null;
    },
  },
  city: {
    validate(v) {
      if (v.length < 2)  return 'City is required.';
      if (v.length > 50) return 'Must be 50 characters or fewer.';
      if (!/^[a-zA-ZÀ-ÿ][a-zA-ZÀ-ÿ .'"-]*$/.test(v))
        return 'Letters, spaces and common punctuation only.';
      return null;
    },
  },
  country: {
    validate(v) {
      if (v.length < 2)  return 'Country is required.';
      if (v.length > 50) return 'Must be 50 characters or fewer.';
      if (!/^[a-zA-ZÀ-ÿ][a-zA-ZÀ-ÿ \-]*$/.test(v))
        return 'Letters, spaces and hyphens only.';
      return null;
    },
  },
  postalCode: {
    validate(v) {
      // Canada: A1A 1A1 or A1A1A1
      const ca = /^[A-Za-z]\d[A-Za-z][ ]?\d[A-Za-z]\d$/;
      // US: 12345 or 12345-6789
      const us = /^\d{5}(-\d{4})?$/;
      // UK: broad pattern (SW1A 1AA, EC1A 1BB, etc.)
      const uk = /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/;
      // General: at least 3 non-whitespace chars
      const general = /^[a-zA-Z0-9][a-zA-Z0-9 \-]{2,9}$/;
      if (!ca.test(v) && !us.test(v) && !uk.test(v) && !general.test(v))
        return 'Enter a valid postal / zip code (e.g. M3J 1P3, 10001, SW1A 1AA).';
      return null;
    },
    hint: 'Canadian, US and international formats accepted',
  },
};

// ── Password strength ──────────────────────────────────────────────────────
function passwordStrength(v) {
  let score = 0;
  if (v.length >= 8)   score++;
  if (v.length >= 12)  score++;
  if (/[A-Z]/.test(v)) score++;
  if (/[a-z]/.test(v)) score++;
  if (/[0-9]/.test(v)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v)) score++;
  if (score <= 2) return { label: 'Weak',   cls: 'strength-weak',   pct: 25  };
  if (score <= 3) return { label: 'Fair',   cls: 'strength-fair',   pct: 50  };
  if (score <= 4) return { label: 'Good',   cls: 'strength-good',   pct: 75  };
  return            { label: 'Strong', cls: 'strength-strong', pct: 100 };
}

// ── Field helpers ──────────────────────────────────────────────────────────
function fieldError(id, msg) {
  const el = document.getElementById(`err-${id}`);
  if (!el) return;
  el.textContent = msg || '';
  el.style.display = msg ? 'block' : 'none';
  const input = document.getElementById(id);
  if (input) input.classList.toggle('input-invalid', !!msg);
}

function validateField(id, ruleName, value) {
  const rule = RULES[ruleName];
  const err = rule ? rule.validate(value) : null;
  fieldError(id, err);
  return !err;
}

function field(id, ruleName, label, placeholder, opts = {}) {
  const hint = RULES[ruleName]?.hint;
  return `
    <div class="form-group">
      <label class="form-label" for="${id}">${label}</label>
      ${opts.password ? `
        <div class="password-wrap">
          <input class="form-input" type="password" id="${id}" placeholder="${placeholder}" autocomplete="new-password">
          <button type="button" class="password-toggle" onclick="togglePassword('${id}', this)">Show</button>
        </div>
        ${id === 'su-password' ? `
          <div class="strength-bar-wrap" id="strength-wrap" style="display:none">
            <div class="strength-bar"><div class="strength-fill" id="strength-fill"></div></div>
            <span class="strength-label" id="strength-label"></span>
          </div>` : ''}
      ` : `
        <input class="form-input" type="text" id="${id}" placeholder="${placeholder}" ${opts.maxWidth ? `style="max-width:${opts.maxWidth}"` : ''}>
      `}
      ${hint ? `<div class="field-hint">${hint}</div>` : ''}
      <div class="field-error" id="err-${id}" style="display:none"></div>
    </div>`;
}

// ── Render ─────────────────────────────────────────────────────────────────
async function renderSignup(container) {
  container.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-card auth-card-wide card">
        <div class="auth-header">
          <div class="auth-logo">We<span>Build</span></div>
          <h1 class="auth-title">Create an account</h1>
          <p class="auth-sub">Join WeBuild and start buying or selling today</p>
        </div>

        <form id="signup-form" autocomplete="off" novalidate>

          <div class="auth-section-label">Account</div>
          ${field('su-username', 'username', 'Username', 'Choose a username')}
          <div class="form-row">
            ${field('su-password', 'password', 'Password', 'Create a password', { password: true })}
            ${field('su-confirm', 'confirm', 'Confirm Password', 'Repeat your password', { password: true })}
          </div>

          <div class="auth-section-label" style="margin-top:8px">Personal Info</div>
          <div class="form-row">
            ${field('su-firstname', 'firstName', 'First Name', 'e.g. Jane')}
            ${field('su-lastname',  'lastName',  'Last Name',  'e.g. Smith')}
          </div>

          <div class="auth-section-label" style="margin-top:8px">Shipping Address</div>
          <div class="form-row">
            ${field('su-streetnum',  'streetNumber', 'Street Number', 'e.g. 123')}
            ${field('su-streetname', 'streetName',   'Street Name',   'e.g. Main St')}
          </div>
          <div class="form-row">
            ${field('su-city',    'city',    'City',    'e.g. Toronto')}
            ${field('su-country', 'country', 'Country', 'e.g. Canada')}
          </div>
          ${field('su-postal', 'postalCode', 'Postal / Zip Code', 'e.g. M3J 1P3', { maxWidth: '220px' })}

          <div id="signup-alert" style="margin-top:8px"></div>

          <button class="btn btn-primary btn-full btn-lg" type="submit" id="signup-submit" style="margin-top:8px">Create Account</button>
        </form>

        <div class="auth-footer">
          Already have an account? <a class="auth-link" onclick="navigate('#/login')">Sign in</a>
        </div>
      </div>
    </div>`;

  // ── Live validation on blur ──────────────────────────────────────────────
  const blurMap = {
    'su-username':   ['username',     v => v],
    'su-firstname':  ['firstName',    v => v],
    'su-lastname':   ['lastName',     v => v],
    'su-streetnum':  ['streetNumber', v => v],
    'su-streetname': ['streetName',   v => v],
    'su-city':       ['city',         v => v],
    'su-country':    ['country',      v => v],
    'su-postal':     ['postalCode',   v => v.toUpperCase()],
  };
  Object.entries(blurMap).forEach(([id, [rule]]) => {
    document.getElementById(id)?.addEventListener('blur', e => {
      validateField(id, rule, e.target.value.trim());
    });
  });

  // ── Password strength meter ──────────────────────────────────────────────
  document.getElementById('su-password')?.addEventListener('input', e => {
    const v = e.target.value;
    const wrap = document.getElementById('strength-wrap');
    if (!wrap) return;
    if (!v) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'flex';
    const s = passwordStrength(v);
    const fill = document.getElementById('strength-fill');
    const lbl  = document.getElementById('strength-label');
    fill.style.width = s.pct + '%';
    fill.className = 'strength-fill ' + s.cls;
    lbl.textContent = s.label;
    lbl.className = 'strength-label ' + s.cls;
  });

  // ── Confirm password live check ──────────────────────────────────────────
  document.getElementById('su-confirm')?.addEventListener('blur', () => {
    const pw  = document.getElementById('su-password').value;
    const cfm = document.getElementById('su-confirm').value;
    fieldError('su-confirm', cfm && pw !== cfm ? 'Passwords do not match.' : null);
  });

  // ── Submit ───────────────────────────────────────────────────────────────
  document.getElementById('signup-form').addEventListener('submit', async e => {
    e.preventDefault();
    const alertEl   = document.getElementById('signup-alert');
    const submitBtn = document.getElementById('signup-submit');

    const get = id => document.getElementById(id).value.trim();
    const username    = get('su-username');
    const password    = document.getElementById('su-password').value;
    const confirm     = document.getElementById('su-confirm').value;
    const firstName   = get('su-firstname');
    const lastName    = get('su-lastname');
    const streetNumber = get('su-streetnum');
    const streetName   = get('su-streetname');
    const city         = get('su-city');
    const country      = get('su-country');
    const postalCode   = get('su-postal').toUpperCase();

    alertEl.innerHTML = '';

    // Run all field validations
    const checks = [
      validateField('su-username',   'username',     username),
      validateField('su-firstname',  'firstName',    firstName),
      validateField('su-lastname',   'lastName',     lastName),
      validateField('su-streetnum',  'streetNumber', streetNumber),
      validateField('su-streetname', 'streetName',   streetName),
      validateField('su-city',       'city',         city),
      validateField('su-country',    'country',      country),
      validateField('su-postal',     'postalCode',   postalCode),
    ];

    // Password rules
    const pwErr = RULES.password.validate(password);
    if (pwErr) { fieldError('su-password', pwErr); checks.push(false); } else { checks.push(true); }

    // Confirm match
    if (password !== confirm) {
      fieldError('su-confirm', 'Passwords do not match.');
      checks.push(false);
    } else if (confirm) {
      checks.push(true);
    }

    if (checks.includes(false)) {
      alertEl.innerHTML = `<div class="alert alert-error">Please fix the errors above before continuing.</div>`;
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account…';

    const res = await Api.signup({ username, password, firstName, lastName, streetNumber, streetName, city, country, postalCode });

    if (res.ok) {
      toast('Account created! Please sign in.', 'success');
      navigate('#/login');
    } else {
      const msg = res.data?.message || res.data?.error || 'Registration failed. Username may already be taken.';
      alertEl.innerHTML = `<div class="alert alert-error">${msg}</div>`;
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    }
  });
}
