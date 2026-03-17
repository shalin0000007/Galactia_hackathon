'use client';
import { useEffect, useState, useCallback } from 'react';
import { paymentAPI } from '@/lib/api';

function timeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function truncate(str, n = 16) {
  if (!str) return '—';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

export default function PaymentTable() {
  const [payments, setPayments] = useState([]);
  const [persisted, setPersisted] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('session');

  const fetchPayments = useCallback(async () => {
    try {
      const [paymentsRes, statsRes] = await Promise.all([
        paymentAPI.list(),
        paymentAPI.stats(),
      ]);
      setPayments(paymentsRes.payments || []);
      setPersisted(paymentsRes.persisted?.payments || []);
      setStats(statsRes);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
    // Poll every 5s for new payments
    const interval = setInterval(fetchPayments, 5000);
    return () => clearInterval(interval);
  }, [fetchPayments]);

  const displayedPayments = activeTab === 'session' ? payments : persisted;

  return (
    <div className="agp-card h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">💳</span>
          <h2 className="agp-heading">Payment History</h2>
        </div>
        <button onClick={fetchPayments} className="agp-btn-ghost text-xs" title="Refresh">
          ↻ Refresh
        </button>
      </div>

      {/* Stats chips */}
      {stats && (
        <div className="flex gap-3 mb-4 flex-wrap">
          <div className="agp-chip">
            <span className="agp-chip-label">Total</span>
            <span className="agp-chip-value">{stats.totalPayments} payments</span>
          </div>
          <div className="agp-chip agp-chip-green">
            <span className="agp-chip-label">Paid Out</span>
            <span className="agp-chip-value">{stats.totalAmount?.toFixed(1)} USDT</span>
          </div>
          <div className="agp-chip">
            <span className="agp-chip-label">Research</span>
            <span className="agp-chip-value">{stats.byAgent?.research?.total?.toFixed(1) || 0} USDT</span>
          </div>
          <div className="agp-chip">
            <span className="agp-chip-label">Execution</span>
            <span className="agp-chip-value">{stats.byAgent?.execution?.total?.toFixed(1) || 0} USDT</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-3">
        <button
          onClick={() => setActiveTab('session')}
          className={`agp-tab ${activeTab === 'session' ? 'agp-tab-active' : ''}`}
        >
          Session ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('persisted')}
          className={`agp-tab ${activeTab === 'persisted' ? 'agp-tab-active' : ''}`}
        >
          All-Time ({persisted.length})
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="agp-loading-rows">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="agp-skeleton-row" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        ) : error ? (
          <div className="agp-error">⚠ {error}</div>
        ) : displayedPayments.length === 0 ? (
          <div className="agp-empty">
            <span>🔍</span>
            <p>No payments yet — run an agent prompt to start</p>
          </div>
        ) : (
          <table className="agp-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Tx Hash</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {displayedPayments.map((p, i) => {
                const txHash = p.txHash || p.tx_hash;
                const agentName = p.toName || p.agent_name || p.agentType || '—';
                const amount = p.amount ?? '—';
                const status = p.status || 'confirmed';
                const timestamp = p.timestamp;
                const explorerUrl = p.explorer_url ||
                  (txHash ? `https://sonicscan.org/tx/${txHash}` : null);

                return (
                  <tr key={p.id || p.task_id || i} className="agp-table-row">
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`agp-agent-dot ${agentName.toLowerCase().includes('research') ? 'agp-dot-blue' : 'agp-dot-purple'}`} />
                        <span className="text-sm font-medium">{agentName}</span>
                      </div>
                    </td>
                    <td>
                      <span className="agp-amount">+{amount} USDT</span>
                    </td>
                    <td>
                      <span className={`agp-badge ${status === 'confirmed' || status === 'paid' ? 'agp-badge-green' : 'agp-badge-yellow'}`}>
                        {status === 'confirmed' || status === 'paid' ? '✓ Paid' : status}
                      </span>
                    </td>
                    <td>
                      {txHash && explorerUrl ? (
                        <a
                          href={explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="agp-tx-link"
                          title={txHash}
                        >
                          {truncate(txHash, 14)}↗
                        </a>
                      ) : (
                        <span className="text-zinc-500 text-xs">—</span>
                      )}
                    </td>
                    <td>
                      <span className="text-zinc-400 text-xs">
                        {timestamp ? timeAgo(timestamp) : '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
