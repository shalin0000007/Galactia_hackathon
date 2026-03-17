const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// ── Auth header (backend uses JWT auth middleware) ──
function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_AUTH_TOKEN || 'dev-token'}`,
  };
}

// ── AI code generation ──
export async function generateCode({ prompt, fileContent, language }) {
  const res = await fetch(`${API_BASE_URL}/api/v1/generate`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ prompt, fileContent, language }),
  });
  return res.json();
}

export async function getAutoComplete({ partialCode, language }) {
  const res = await fetch(`${API_BASE_URL}/api/v1/autocomplete`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ partialCode, language }),
  });
  return res.json();
}

// ── Wallet ──
export async function createWallet(name) {
  const res = await fetch(`${API_BASE_URL}/wallet/create`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function getBalance(address) {
  const res = await fetch(`${API_BASE_URL}/wallet/balance/${address}`, {
    headers: authHeaders(),
  });
  return res.json();
}

export async function sendUSDT(fromName, toAddress, amount) {
  const res = await fetch(`${API_BASE_URL}/wallet/send`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ fromName, toAddress, amount }),
  });
  return res.json();
}

// ── Agent (Day 4) ──
export async function runAgent(prompt) {
  const res = await fetch(`${API_BASE_URL}/agent/run`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ prompt }),
  });
  return res.json();
}

export async function getAgentStatus() {
  const res = await fetch(`${API_BASE_URL}/agent/status`, {
    headers: authHeaders(),
  });
  return res.json();
}

export async function getAgents() {
  const res = await fetch(`${API_BASE_URL}/agents`, {
    headers: authHeaders(),
  });
  return res.json();
}

// ── Payments (Day 4) ──
export async function getPayments(filters = {}) {
  const params = new URLSearchParams();
  if (filters.agentType) params.set('agentType', filters.agentType);
  if (filters.status) params.set('status', filters.status);
  if (filters.limit) params.set('limit', String(filters.limit));
  const qs = params.toString();
  const res = await fetch(`${API_BASE_URL}/payments${qs ? '?' + qs : ''}`, {
    headers: authHeaders(),
  });
  return res.json();
}

export async function getPaymentByHash(txHash) {
  const res = await fetch(`${API_BASE_URL}/payments/${txHash}`, {
    headers: authHeaders(),
  });
  return res.json();
}
