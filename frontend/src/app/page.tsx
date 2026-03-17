'use client';
import { useState } from 'react';
import AgentPrompt from '@/components/AgentPrompt/AgentPrompt';
import AgentFeed from '@/components/AgentFeed/AgentFeed';
import PaymentTable from '@/components/PaymentTable/PaymentTable';
import WalletCards from '@/components/WalletCards/WalletCards';

export default function Dashboard() {
  const [agentResults, setAgentResults] = useState([]);
  const [reasoning, setReasoning] = useState(null);
  const [refreshWallets, setRefreshWallets] = useState(0);

  const handleAgentResult = (result) => {
    if (result.results) {
      setAgentResults(result.results);
    }
    if (result.manager_reasoning) {
      setReasoning(result.manager_reasoning);
    }
    // Trigger wallet refresh after agent run (balances change)
    setRefreshWallets(n => n + 1);
  };

  return (
    <div className="agp-layout">
      {/* Nav */}
      <nav className="agp-nav">
        <span className="agp-logo">⚡ AgentPay</span>
        <div className="flex items-center gap-3">
          <span className="agp-nav-badge">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            Backend live
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>localhost:3000</span>
        </div>
      </nav>

      <main className="agp-main">
        {/* Wallet Cards — top full width */}
        <div style={{ marginBottom: 16 }}>
          <WalletCards refreshTrigger={refreshWallets} />
        </div>

        {/* Manager reasoning (shows after run) */}
        {reasoning && (
          <div className="agp-reasoning" style={{ marginBottom: 16 }}>
            🧠 Manager: "{reasoning}"
          </div>
        )}

        {/* 2-column grid */}
        <div className="agp-grid">
          {/* Left: Prompt + Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <AgentPrompt onResult={handleAgentResult} />
            <AgentFeed results={agentResults} />
          </div>

          {/* Right: Payment Table */}
          <div style={{ minHeight: 400 }}>
            <PaymentTable />
          </div>
        </div>
      </main>
    </div>
  );
}
