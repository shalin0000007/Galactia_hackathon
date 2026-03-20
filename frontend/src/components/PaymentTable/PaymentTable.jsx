'use client';
import { useEffect, useState, useCallback } from 'react';
import { paymentAPI } from '@/lib/api';

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function trunc(str, n = 14) {
  if (!str) return '—';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

export default function PaymentTable() {
  const [payments, setPayments] = useState([]);
  const [persisted, setPersisted] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('session');

  const fetchPayments = useCallback(async () => {
    try {
      const [r, s] = await Promise.all([paymentAPI.list(), paymentAPI.stats()]);
      setPayments(r.payments || []);
      setPersisted(r.persisted?.payments || []);
      setStats(s);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
    const t = setInterval(fetchPayments, 5000);
    return () => clearInterval(t);
  }, [fetchPayments]);

  const rows = tab === 'session' ? payments : persisted;

  return (
    <>
      {/* Header */}
      <div className="agp-section-header">
        <div className="agp-section-title">
          <span className="agp-section-icon agp-section-icon-pink">▣</span>
          Audit Log & Payments
        </div>
        <button onClick={fetchPayments} className="agp-btn agp-btn-sm">↻ Refresh</button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="agp-stats-row">
          <div className="agp-stat">
            <div className="agp-stat-label">Total Payments</div>
            <div className="agp-stat-value">{stats.totalPayments ?? 0}</div>
          </div>
          <div className="agp-stat agp-stat-green">
            <div className="agp-stat-label">Total Paid</div>
            <div className="agp-stat-value">{(stats.totalAmount ?? 0).toFixed(2)} <span style={{fontSize:10,fontWeight:400,color:'var(--c-muted)'}}>USDT</span></div>
          </div>
          <div className="agp-stat">
            <div className="agp-stat-label">Research</div>
            <div className="agp-stat-value">{(stats.byAgent?.research?.total ?? 0).toFixed(1)}</div>
          </div>
          <div className="agp-stat">
            <div className="agp-stat-label">Execution</div>
            <div className="agp-stat-value">{(stats.byAgent?.execution?.total ?? 0).toFixed(1)}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="agp-tabs">
        <button className={`agp-tab ${tab === 'session' ? 'agp-tab-active' : ''}`} onClick={() => setTab('session')}>
          Session ({payments.length})
        </button>
        <button className={`agp-tab ${tab === 'persisted' ? 'agp-tab-active' : ''}`} onClick={() => setTab('persisted')}>
          All-Time ({persisted.length})
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="agp-skel agp-skel-row" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      ) : error ? (
        <div className="agp-error">⚠ {error}</div>
      ) : rows.length === 0 ? (
        <div className="agp-empty">
          <span className="agp-empty-icon">▤</span>
          <p>No transactions recorded yet</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
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
              {rows.map((p, i) => {
                const txHash = p.txHash || p.tx_hash;
                const name = p.toName || p.agent_name || p.agentType || '—';
                const isResearch = name.toLowerCase().includes('res');
                const amount = p.amount ?? '—';
                const status = p.status || 'confirmed';
                const explorerUrl = p.explorer_url || (txHash ? `https://sonicscan.org/tx/${txHash}` : null);

                return (
                  <tr key={p.id || i} className="agp-tr" style={{ animationDelay: `${i * 0.04}s` }}>
                    <td>
                      <div className="agp-agent-cell">
                        <span className={`agp-agent-pip ${isResearch ? 'agp-pip-research' : 'agp-pip-execution'}`} />
                        {name}
                      </div>
                    </td>
                    <td><span className="agp-amount-cell">+{amount} USDT</span></td>
                    <td>
                      {txHash
                        ? <span className="agp-badge agp-badge-teal">⛓ On-Chain</span>
                        : <span className={`agp-badge ${status === 'confirmed' || status === 'paid' ? 'agp-badge-green' : 'agp-badge-amber'}`}>
                            {status === 'confirmed' || status === 'paid' ? '✓ Paid' : status}
                          </span>
                      }
                    </td>
                    <td>
                      {txHash && explorerUrl
                        ? <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="agp-mono">{trunc(txHash)}↗</a>
                        : <span style={{ color: 'var(--c-faint)', fontSize: 11 }}>—</span>
                      }
                    </td>
                    <td className="agp-time-cell">{p.timestamp ? timeAgo(p.timestamp) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
