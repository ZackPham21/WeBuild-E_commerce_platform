async function renderAccount(container) {
  container.innerHTML = '<div class="loading"><div class="spinner"></div><span>Loading profile…</span></div>';

  const res = await Api.getProfile();
  if (!res.ok || res.data.error) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-title">Could not load profile</div></div>`;
    return;
  }

  const p = res.data;

  container.innerHTML = `
    <div class="back-btn" onclick="navigate('#/')">← Back to Auctions</div>
    <div class="page-header">
      <div class="page-title">Account Settings</div>
      <div class="page-subtitle">Update your profile and shipping address</div>
    </div>

    <div style="max-width:640px;display:flex;flex-direction:column;gap:20px">

      <div class="card">
        <h2 style="font-size:17px;font-weight:700;margin-bottom:4px">Account</h2>
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:20px">Username cannot be changed</div>
        <div class="form-group">
          <label class="form-label">Username</label>
          <input class="form-input" type="text" value="${p.username}" disabled style="opacity:.6;cursor:not-allowed">
        </div>
        <div id="profile-alert"></div>
        <form id="profile-form" autocomplete="off" novalidate>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">First Name</label>
              <input class="form-input" type="text" id="prof-first" value="${p.firstName}" placeholder="First name">
            </div>
            <div class="form-group">
              <label class="form-label">Last Name</label>
              <input class="form-input" type="text" id="prof-last" value="${p.lastName}" placeholder="Last name">
            </div>
          </div>
          <button class="btn btn-primary" type="submit" id="profile-submit">Save Name</button>
        </form>
      </div>

      <div class="card">
        <h2 style="font-size:17px;font-weight:700;margin-bottom:20px">Shipping Address</h2>
        <div id="addr-alert"></div>
        <form id="addr-form" autocomplete="off" novalidate>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Street Number</label>
              <input class="form-input" type="text" id="acc-street-num" value="${p.streetNumber}" placeholder="123">
            </div>
            <div class="form-group" style="flex:2">
              <label class="form-label">Street Name</label>
              <input class="form-input" type="text" id="acc-street-name" value="${p.streetName}" placeholder="Main St">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">City</label>
            <input class="form-input" type="text" id="acc-city" value="${p.city}" placeholder="Toronto">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Country</label>
              <input class="form-input" type="text" id="acc-country" value="${p.country}" placeholder="Canada">
            </div>
            <div class="form-group">
              <label class="form-label">Postal Code</label>
              <input class="form-input" type="text" id="acc-postal" value="${p.postalCode}" placeholder="M1A 1A1">
            </div>
          </div>
          <button class="btn btn-primary" type="submit" id="addr-submit">Save Address</button>
        </form>
      </div>

      <div class="card">
        <h2 style="font-size:17px;font-weight:700;margin-bottom:20px">Change Password</h2>
        <div id="pw-alert"></div>
        <form id="pw-form" autocomplete="off" novalidate>
          <div class="form-group">
            <label class="form-label">Current Password</label>
            <input class="form-input" type="password" id="pw-current" placeholder="Enter current password">
          </div>
          <div class="form-group">
            <label class="form-label">New Password</label>
            <input class="form-input" type="password" id="pw-new" placeholder="Min 8 characters">
          </div>
          <div class="form-group">
            <label class="form-label">Confirm New Password</label>
            <input class="form-input" type="password" id="pw-confirm" placeholder="Repeat new password">
          </div>
          <button class="btn btn-primary" type="submit" id="pw-submit">Change Password</button>
        </form>
      </div>

    </div>`;

  document.getElementById('profile-form').addEventListener('submit', async e => {
    e.preventDefault();
    const alertEl  = document.getElementById('profile-alert');
    const btn      = document.getElementById('profile-submit');
    const firstName = document.getElementById('prof-first').value.trim();
    const lastName  = document.getElementById('prof-last').value.trim();
    alertEl.innerHTML = '';
    if (!firstName || !lastName) {
      alertEl.innerHTML = `<div class="alert alert-error">First and last name are required.</div>`;
      return;
    }
    btn.disabled = true; btn.textContent = 'Saving…';
    const res = await Api.updateProfile({ firstName, lastName });
    if (res.ok && res.data.success) {
      alertEl.innerHTML = `<div class="alert alert-success">Name updated successfully.</div>`;
    } else {
      alertEl.innerHTML = `<div class="alert alert-error">${res.data?.message || 'Failed to update name.'}</div>`;
    }
    btn.disabled = false; btn.textContent = 'Save Name';
  });

  document.getElementById('addr-form').addEventListener('submit', async e => {
    e.preventDefault();
    const alertEl    = document.getElementById('addr-alert');
    const btn        = document.getElementById('addr-submit');
    const streetNumber = document.getElementById('acc-street-num').value.trim();
    const streetName   = document.getElementById('acc-street-name').value.trim();
    const city         = document.getElementById('acc-city').value.trim();
    const country      = document.getElementById('acc-country').value.trim();
    const postalCode   = document.getElementById('acc-postal').value.trim().toUpperCase();
    alertEl.innerHTML = '';

    const errors = [];
    if (!/^\d{1,6}[a-zA-Z]?$/.test(streetNumber))
      errors.push('Street number must be 1–6 digits, optionally followed by a letter (e.g. 123, 45A).');
    if (streetName.length < 2 || streetName.length > 100 || !/^[a-zA-ZÀ-ÿ0-9][a-zA-ZÀ-ÿ0-9 .\'""-]*$/.test(streetName))
      errors.push('Street name must be 2–100 characters: letters, numbers, spaces and common punctuation only.');
    if (city.length < 2 || city.length > 50 || !/^[a-zA-ZÀ-ÿ][a-zA-ZÀ-ÿ .\'""-]*$/.test(city))
      errors.push('City must be 2–50 characters: letters, spaces and common punctuation only.');
    if (country.length < 2 || country.length > 50 || !/^[a-zA-ZÀ-ÿ][a-zA-ZÀ-ÿ \-]*$/.test(country))
      errors.push('Country must be 2–50 characters: letters, spaces and hyphens only.');
    const ca = /^[A-Za-z]\d[A-Za-z][ ]?\d[A-Za-z]\d$/;
    const us = /^\d{5}(-\d{4})?$/;
    if (!ca.test(postalCode) && !us.test(postalCode))
      errors.push('Enter a valid Canadian postal code (e.g. M3J 1P3) or US zip code (e.g. 10001).');

    if (errors.length) {
      alertEl.innerHTML = `<div class="alert alert-error">${errors.join('<br>')}</div>`;
      return;
    }
    btn.disabled = true; btn.textContent = 'Saving…';
    const res = await Api.updateAddress({ streetNumber, streetName, city, country, postalCode });
    if (res.ok) {
      alertEl.innerHTML = `<div class="alert alert-success">Address updated successfully.</div>`;
    } else {
      alertEl.innerHTML = `<div class="alert alert-error">${res.data?.message || 'Failed to update address.'}</div>`;
    }
    btn.disabled = false; btn.textContent = 'Save Address';
  });

  document.getElementById('pw-form').addEventListener('submit', async e => {
    e.preventDefault();
    const alertEl   = document.getElementById('pw-alert');
    const btn       = document.getElementById('pw-submit');
    const current   = document.getElementById('pw-current').value;
    const newPw     = document.getElementById('pw-new').value;
    const confirm   = document.getElementById('pw-confirm').value;
    alertEl.innerHTML = '';
    if (!current || !newPw || !confirm) {
      alertEl.innerHTML = `<div class="alert alert-error">All password fields are required.</div>`;
      return;
    }
    if (newPw.length < 8) {
      alertEl.innerHTML = `<div class="alert alert-error">New password must be at least 8 characters.</div>`;
      return;
    }
    if (newPw !== confirm) {
      alertEl.innerHTML = `<div class="alert alert-error">Passwords do not match.</div>`;
      return;
    }
    btn.disabled = true; btn.textContent = 'Saving…';
    const res = await Api.changePassword({ currentPassword: current, newPassword: newPw });
    if (res.ok && res.data.success) {
      alertEl.innerHTML = `<div class="alert alert-success">Password changed successfully.</div>`;
      document.getElementById('pw-form').reset();
    } else {
      alertEl.innerHTML = `<div class="alert alert-error">${res.data?.message || 'Failed to change password.'}</div>`;
    }
    btn.disabled = false; btn.textContent = 'Change Password';
  });
}
