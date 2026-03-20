// Central API client — all backend calls go through here
// Merged: Person A (clean object API) + Person B (auth headers, named exports)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// ── Internal fetch helper (Person A) ────────────────────
async function apiFetch(method, path, body = null) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      // JWT auth header (Person B) — uses dev token if not set
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN || 'dev-token'}`,
    },
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

// ── Day 1: Wallets (Person A object API) ────────────────
export const walletAPI = {
  create: (name) => apiFetch('POST', '/wallet/create', { name }),
  balance: (address) => apiFetch('GET', `/wallet/balance/${address}`),
  send: (from, to, amount) => apiFetch('POST', '/wallet/send', { from, to, amount }),
  all: () => apiFetch('GET', '/wallet/all'),
};

// ── Day 2: Agents (Person A object API) ─────────────────
export const agentAPI = {
  run: (prompt) => apiFetch('POST', '/agent/run', { prompt }),
  status: () => apiFetch('GET', '/agent/status'),
  wallets: () => apiFetch('GET', '/agents'),
};

// ── Day 3: Payments (Person A object API) ───────────────
export const paymentAPI = {
  list: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return apiFetch('GET', `/payments${params ? '?' + params : ''}`);
  },
  stats: () => apiFetch('GET', '/payments/stats'),
  get: (id) => apiFetch('GET', `/payments/${id}`),
};

// ── Named exports for Person B's dashboard components ───
export const runAgent = (prompt) => agentAPI.run(prompt);
export const getAgentStatus = () => agentAPI.status();
export const getAgents = () => agentAPI.wallets();
export const createWallet = (name) => walletAPI.create(name);
export const getBalance = (address) => walletAPI.balance(address);
export const sendUSDT = (from, to, amount) => walletAPI.send(from, to, amount);
export const getPayments = (filters) => paymentAPI.list(filters);
export const getPaymentByHash = (txHash) => paymentAPI.get(txHash);
