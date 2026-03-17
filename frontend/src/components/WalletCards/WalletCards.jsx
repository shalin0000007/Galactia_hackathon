'use client';
import { useEffect, useState, useCallback } from 'react';
import { agentAPI } from '@/lib/api';

const AGENT_ICONS = {
  manager: '🧠',
  research: '🔍',
  execution: '⚡',
};

const AGENT_COLORS = {
  manager: 'agp-dot-amber',
  research: 'agp-dot-blue',
  execution: 'agp-dot-purple',
};

function truncateAddr(addr) {
  if (!addr) return '—';
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}

export default function WalletCards({ refreshTrigger }) {
  const [wallets, setWallets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchWallets = useCallback(async () => {
    try {
      const res = await agentAPI.wallets();
      setWallets(res.agents);
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
    const interval = setInterval(fetchWallets, 8000);
    return () => clearInterval(interval);
  }, [fetchWallets, refreshTrigger]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {['Manager', 'Research', 'Execution'].map(n => (
          <div key={n} className="agp-card agp-skeleton-card">
            <div className="agp-skeleton-line w-1/2 mb-3" />
            <div className="agp-skeleton-line w-3/4 mb-2" />
            <div className="agp-skeleton-line w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="agp-error">⚠ {error}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span>💰</span>
          <h2 className="agp-heading">Agent Wallets</h2>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-zinc-500 text-xs">Updated {lastRefresh}</span>
          )}
          <button onClick={fetchWallets} className="agp-btn-ghost text-xs">
            ↻ Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {wallets && Object.entries(wallets).map(([key, agent]) => {
          if (!agent) return null;
          return (
            <div key={key} className="agp-card agp-wallet-card group">
              {/* Top row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{AGENT_ICONS[key] || '🤖'}</span>
                  <span className="font-semibold text-sm text-white capitalize">{agent.name || key}</span>
                </div>
                <span className={`agp-status-dot ${AGENT_COLORS[key] || 'agp-dot-blue'}`} />
              </div>

              {/* Balance */}
              <div className="mb-3">
                <div className="text-3xl font-bold text-white tabular-nums">
                  {agent.balance?.toFixed(1) ?? '—'}
                </div>
                <div className="text-xs text-zinc-400 mt-0.5">USDT</div>
              </div>

              {/* Balance bar */}
              <div className="agp-balance-bar mb-3">
                <div
                  className={`agp-balance-fill ${key === 'manager' ? 'agp-fill-amber' : key === 'research' ? 'agp-fill-blue' : 'agp-fill-purple'}`}
                  style={{ width: `${Math.min(100, (agent.balance / 10) * 100)}%` }}
                />
              </div>

              {/* Address */}
              <div className="flex items-center gap-1">
                <span className="text-zinc-500 text-xs font-mono">{truncateAddr(agent.address)}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(agent.address)}
                  className="text-zinc-600 hover:text-zinc-300 transition-colors text-xs"
                  title="Copy address"
                >
                  ⧉
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
