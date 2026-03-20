try {
  const sdk = require('@coinbase/coinbase-sdk');
  console.log('SDK Keys:', Object.keys(sdk));
} catch (e) {
  console.error('Failed to load @coinbase/coinbase-sdk:', e.message);
  console.error(e.stack);
}
