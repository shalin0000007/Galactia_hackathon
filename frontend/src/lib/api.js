const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function createWallet(name) {
  const res = await fetch(`${API_BASE_URL}/wallet/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return res.json();
}

export async function getBalance(address) {
  const res = await fetch(`${API_BASE_URL}/wallet/balance/${address}`);
  return res.json();
}

export async function sendUSDT(fromName, toAddress, amount) {
  const res = await fetch(`${API_BASE_URL}/wallet/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromName, toAddress, amount }),
  });
  return res.json();
}
