// Central API client — all backend calls go through here
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function apiFetch(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Day 1: Wallets ─────────────────────────────
export const walletAPI = {
  create: (name) => apiFetch('POST', '/wallet/create', { name }),
  balance: (address) => apiFetch('GET', `/wallet/balance/${address}`),
  send: (from, to, amount) => apiFetch('POST', '/wallet/send', { from, to, amount }),
  all: () => apiFetch('GET', '/wallet/all'),
};

// ── Day 2: Agents ──────────────────────────────
export const agentAPI = {
  run: (prompt) => apiFetch('POST', '/agent/run', { prompt }),
  status: () => apiFetch('GET', '/agent/status'),
  wallets: () => apiFetch('GET', '/agents'),
};

// ── Day 3: Payments ────────────────────────────
export const paymentAPI = {
  list: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return apiFetch('GET', `/payments${params ? '?' + params : ''}`);
  },
  stats: () => apiFetch('GET', '/payments/stats'),
  get: (id) => apiFetch('GET', `/payments/${id}`),
};
