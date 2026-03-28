const BASE = "http://localhost:8080/api";

function getToken() { return sessionStorage.getItem("token"); }
function getUsername() { return sessionStorage.getItem("username"); }
function getUserId() { return sessionStorage.getItem("userId"); }

function requireAuth() {
    if (!getToken()) window.location.href = "signin.html";
}

function redirectIfLoggedIn() {
    if (getToken()) window.location.href = "index.html";
}

async function apiFetch(path, options = {}) {
    const token = getToken();
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${BASE}${path}`, { ...options, headers });
    if (res.status === 401) { sessionStorage.clear(); window.location.href = "signin.html"; }
    return res;
}

async function signOut() {
    await apiFetch("/signout", { method: "POST" });
    sessionStorage.clear();
    window.location.href = "signin.html";
}