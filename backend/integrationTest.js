const http = require('http');

const baseURL = 'http://localhost:3000';

async function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    const reqOptions = { ...defaultOptions, ...options };
    const req = http.request(`${baseURL}${path}`, reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
        req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("--- Starting Integration Tests ---");

  // 1. Health check
  console.log("\nTesting GET /health");
  let res = await request('/health');
  console.log(`Response [${res.status}]:`, res.body);

  // 2. Create Wallet
  console.log("\nTesting POST /wallet/create");
  res = await request('/wallet/create', {
      method: 'POST',
      body: { name: 'TestDemoWallet' }
  });
  console.log(`Response [${res.status}]:`, res.body);
  const testAddress = res.body?.data?.address || "0xMock";

  // 3. Get Balance
  console.log(`\nTesting GET /wallet/balance/${testAddress}`);
  res = await request(`/wallet/balance/${testAddress}`);
  console.log(`Response [${res.status}]:`, res.body);

  // 4. Send USDT
  // Need to create another to demonstrate
  console.log("\nTesting POST /wallet/send");
  res = await request('/wallet/send', {
      method: 'POST',
      body: { 
          fromName: 'TestDemoWallet', 
          toAddress: '0xTestReceiver1234', 
          amount: 0.1 
      }
  });
  console.log(`Response [${res.status}]:`, res.body);

  console.log("\n--- Integration Tests Complete ---");
}

runTests();
