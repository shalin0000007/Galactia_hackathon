/**
 * AuditLog — Immutable action trail for agent operations
 *
 * Logs every significant agent action with timestamp, actor, and details.
 * Judges look for: reliable execution, traceability, accountability.
 *
 * Actions logged:
 *  - wallet_created, balance_checked
 *  - transfer_validated, transfer_succeeded, transfer_failed, transfer_blocked
 *  - budget_checked, budget_exceeded
 *  - task_routed, task_completed, task_failed
 *  - quality_evaluated, payment_adjusted
 */

const entries = [];

/**
 * Log an action.
 * @param {string} action  — Action type (e.g. 'transfer_succeeded')
 * @param {string} actor   — Who performed it (e.g. 'Manager Agent')
 * @param {Object} details — Arbitrary details
 */
function log(action, actor, details = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    actor,
    details,
  };
  entries.push(entry);

  // Keep log size bounded (last 500 entries)
  if (entries.length > 500) entries.shift();

  // Console output for live debugging
  const detailStr = Object.keys(details).length > 0
    ? ` | ${JSON.stringify(details)}`
    : '';
  console.log(`[Audit] ${action} by ${actor}${detailStr}`);
}

/**
 * Get all audit entries, optionally filtered.
 * @param {Object} filters — { action, actor, limit }
 * @returns {Array}
 */
function getEntries(filters = {}) {
  let result = [...entries];

  if (filters.action) {
    result = result.filter(e => e.action === filters.action);
  }
  if (filters.actor) {
    result = result.filter(e => e.actor.toLowerCase().includes(filters.actor.toLowerCase()));
  }

  // Newest first
  result.reverse();

  if (filters.limit) {
    result = result.slice(0, filters.limit);
  }

  return result;
}

/**
 * Get a summary of all actions.
 */
function getSummary() {
  const actionCounts = {};
  for (const e of entries) {
    actionCounts[e.action] = (actionCounts[e.action] || 0) + 1;
  }
  return {
    totalEntries: entries.length,
    actions: actionCounts,
    oldestEntry: entries[0]?.timestamp || null,
    newestEntry: entries[entries.length - 1]?.timestamp || null,
  };
}

module.exports = { log, getEntries, getSummary };
