const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../payments.json');

/**
 * Initializes the database file if it doesn't exist
 */
function initDB() {
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify([]));
    }
}

/**
 * Records a new payment in the JSON database
 * @param {string} taskId - The ID of the task
 * @param {string} agentName - The name of the agent
 * @param {number|string} amount - The amount paid
 * @param {string} txHash - The transaction hash
 */
function recordPayment(taskId, agentName, amount, txHash) {
    initDB();
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        const payments = JSON.parse(data);
        
        const newPayment = {
            task_id: taskId,
            agent_name: agentName,
            amount: amount,
            tx_hash: txHash,
            timestamp: new Date().toISOString()
        };
        
        payments.push(newPayment);
        fs.writeFileSync(DB_PATH, JSON.stringify(payments, null, 2));
        console.log(`[DB] Recorded payment for task ${taskId}: ${txHash}`);
        return newPayment;
    } catch (error) {
        console.error('[DB] Error recording payment:', error);
        throw error;
    }
}

/**
 * Retrieves all payment records
 * @returns {Array} List of all payments
 */
function getPayments() {
    initDB();
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('[DB] Error reading payments:', error);
        return [];
    }
}

/**
 * Retrieves a single payment by transaction hash
 * @param {string} txHash - The transaction hash
 * @returns {Object|null} The payment record or null if not found
 */
function getPaymentByHash(txHash) {
    const payments = getPayments();
    return payments.find(p => p.tx_hash === txHash) || null;
}

module.exports = {
    recordPayment,
    getPayments,
    getPaymentByHash
};
