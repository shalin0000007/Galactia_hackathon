'use client';
import { useEffect, useState, useCallback } from 'react';
import { agentAPI } from '@/lib/api';

const ROLES = {
  manager:   { label: 'Manager',   icon: 'M', badge: 'CTRL', cls: 'agp-wallet-manager' },
  research:  { label: 'Research',  icon: 'R', badge: 'RES',  cls: 'agp-wallet-research' },
  execution: { label: 'Execution', icon: 'E', badge: 'EXE',  cls: 'agp-wallet-execution' },
};

function truncateAddr(addr) {
  if (!addr) return '—';
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}

export default function WalletCards({ refreshTrigger }) {
  const [wallets, setWallets] = useState(null);
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const fetchWallets = useCallback(async () => {
    try {
      const [walletRes, budgetRes] = await Promise.all([
        agentAPI.wallets(),
        fetch(`${API}/agent/budget`).then(r => r.json()).catch(() => null),
      ]);
      setWallets(walletRes.agents);
      setBudget(budgetRes);
      setLastRefresh(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallets();
    const t = setInterval(fetchWallets, 8000);
    return () => clearInterval(t);
  }, [fetchWallets, refreshTrigger]);

  if (loading) return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 14 }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="agp-skel agp-skel-card" style={{ animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
      <div className="agp-skel" style={{ height: 44, borderRadius: 12 }} />
    </div>
  );

  if (error) return <div className="agp-error" style={{ marginBottom: 20 }}>⚠ {error}</div>;

  const dailyUsed = budget?.dailySpend ?? 0;
  const dailyLimit = budget?.dailyLimit ?? 20;
  const pct = Math.min(100, (dailyUsed / dailyLimit) * 100);

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="agp-section-title">
          <span className="agp-section-icon agp-section-icon-purple">◈</span>
          Agent Wallets
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lastRefresh && <span style={{ fontSize: 10, color: 'var(--c-faint)' }}>Updated {lastRefresh}</span>}
          <button onClick={fetchWallets} className="agp-btn agp-btn-sm">↻ Refresh</button>
        </div>
      </div>

      {/* Wallet Cards */}
      <div className="agp-wallets-grid">
        {wallets && Object.entries(wallets).map(([key, agent]) => {
          if (!agent) return null;
          const role = ROLES[key] || { label: key, icon: key[0].toUpperCase(), badge: 'AGT', cls: 'agp-wallet-research' };
          const balPct = Math.min(100, ((agent.balance ?? 0) / 10) * 100);
          return (
            <div key={key} className={`agp-wallet ${role.cls}`}>
              <div className="agp-wallet-top">
                <div className="agp-wallet-role">
                  <div className="agp-wallet-icon">{role.icon}</div>
                  <div>
                    <div className="agp-wallet-name">{agent.name || role.label}</div>
                    <div className="agp-wallet-chain">Sonic · EVM</div>
                  </div>
                </div>
                <span className="agp-wallet-badge">{role.badge}</span>
              </div>

              <div className="agp-wallet-balance">
                {(agent.balance ?? 0).toFixed(2)}
              </div>
              <div className="agp-wallet-currency">USDT on Sonic Network</div>

              <div className="agp-wallet-bar">
                <div className="agp-wallet-fill" style={{ width: `${balPct}%` }} />
              </div>

              <div className="agp-wallet-addr">
                <a
                  href={`https://sonicscan.org/address/${agent.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={agent.address}
                >
                  {truncateAddr(agent.address)}
                </a>
                <span> ↗</span>
                <button
                  onClick={() => navigator.clipboard?.writeText(agent.address)}
                  title="Copy"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-faint)', padding: 0 }}
                >
                  ⧉
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily Budget */}
      <div className="agp-budget">
        <div className="agp-budget-header">
          <span className="agp-budget-label">Daily Budget Used</span>
          <span className="agp-budget-amounts">
            <span className="agp-budget-used">{dailyUsed.toFixed(2)}</span>
            {' / '}{dailyLimit} USDT
          </span>
        </div>
        <div className="agp-budget-track">
          <div className="agp-budget-progress" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
