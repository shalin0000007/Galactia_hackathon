const db = require('./src/services/dbService');
const explorer = require('./src/services/explorerService');

async function testServices() {
    console.log('--- Testing DB Service ---');
    
    // 1. Record a payment
    const mockTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    console.log('Recording payment...');
    const newPayment = db.recordPayment('task-123', 'Research Agent', 0.5, mockTxHash);
    console.log('Saved:', newPayment);

    // 2. Fetch all payments
    console.log('\nFetching all payments...');
    const all = db.getPayments();
    console.log('Count:', all.length);
    
    // 3. Get by Tx Hash
    console.log('\nFetching by tx_hash...');
    const found = db.getPaymentByHash(mockTxHash);
    console.log('Match?', found.task_id === 'task-123');

    console.log('\n--- Testing Explorer Service ---');
    console.log('Explorer URL:', explorer.getExplorerUrl(mockTxHash));
    const verification = await explorer.verifyTransaction(mockTxHash);
    console.log('Verification result:', verification);

    console.log('\nClean up: You can delete tests in payments.json later.');
}

testServices().catch(console.error);
