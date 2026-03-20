'use client';
import { useState } from 'react';
import AgentPrompt from '@/components/AgentPrompt/AgentPrompt';
import AgentFeed from '@/components/AgentFeed/AgentFeed';
import PaymentTable from '@/components/PaymentTable/PaymentTable';
import WalletCards from '@/components/WalletCards/WalletCards';

export default function Dashboard() {
  const [agentResults, setAgentResults] = useState<any[]>([]);
  const [reasoning, setReasoning] = useState<string | null>(null);
  const [runInfo, setRunInfo] = useState<{ totalPayment: number; network: string; duration: number } | null>(null);
  const [refreshWallets, setRefreshWallets] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const handleAgentResult = (result: any) => {
    if (result.results) setAgentResults(result.results);
    if (result.manager_reasoning) setReasoning(result.manager_reasoning);
    if (result.trace) {
      setRunInfo({
        totalPayment: result.trace.total_payment,
        network: result.network || 'Sonic',
        duration: result.trace.total_duration_ms,
      });
    }
    setRefreshWallets(n => n + 1);
  };

  return (
    <div className="agp-layout">
      {/* Navigation */}
      <nav className="agp-nav">
        <span className="agp-logo">
          <span className="agp-logo-icon">⚡</span>
          AgentPay
        </span>
        <div className="agp-nav-right">
          <span className="agp-nav-pill">
            <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="#7c5cfc"/></svg>
            Sonic Network
          </span>
          <span className="agp-nav-pill">
            <span className="agp-live-dot" />
            Live
          </span>
        </div>
      </nav>

      <main className="agp-main">
        {/* Wallet section */}
        <WalletCards refreshTrigger={refreshWallets} />

        {/* Reasoning */}
        {reasoning && (
          <div className="agp-reasoning" style={{ marginBottom: 20 }}>
            <span className="agp-reasoning-icon">🧠</span>
            <div>
              <div style={{ lineHeight: 1.6 }}>&ldquo;{reasoning}&rdquo;</div>
              {runInfo && (
                <div className="agp-reasoning-meta">
                  <span>💸 {runInfo.totalPayment} USDT paid</span>
                  <span>⏱ {runInfo.duration}ms</span>
                  <span>⛓ {runInfo.network}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 2-col grid */}
        <div className="agp-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="agp-card">
              <div className="agp-section-header">
                <div className="agp-section-title">
                  <span className="agp-section-icon agp-section-icon-purple">🚀</span>
                  Agent Dispatch
                </div>
              </div>
              <AgentPrompt onResult={handleAgentResult} />
            </div>

            <div className="agp-card">
              <div className="agp-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="agp-section-title">
                  <span className="agp-section-icon agp-section-icon-teal">✨</span>
                  {agentResults.length > 0 ? 'Final Result' : 'Execution Feed'}
                </div>
                {agentResults.length > 0 && (
                  <button 
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#e2e8f0', cursor: 'pointer' }}
                  >
                    {showBreakdown ? 'Hide Breakdown' : 'View Agent Breakdown'}
                  </button>
                )}
              </div>
              
              {agentResults.length === 0 ? (
                <AgentFeed results={agentResults} />
              ) : (
                <>
                  {!showBreakdown && (
                    <div style={{ padding: '10px 0' }}>
                      {agentResults.filter(r => r.result?.findings).map((r, i) => (
                        <div key={i} style={{ marginBottom: 16 }}>
                          {r.result.findings.analysis && (
                            <p style={{ color: '#e2e8f0', lineHeight: 1.6, marginBottom: 16, fontSize: '1.05rem' }}>
                              {r.result.findings.analysis}
                            </p>
                          )}
                          {r.result.findings.top_picks && Array.isArray(r.result.findings.top_picks) && (
                            <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                              {r.result.findings.top_picks.map((pick: any, idx: number) => (
                                <li key={idx} style={{ marginBottom: 12, paddingLeft: 16, borderLeft: '4px solid #7c5cfc', backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px 12px 12px 16px', borderRadius: '0 8px 8px 0' }}>
                                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '1.1rem', marginBottom: 6 }}>{pick.name} <span style={{ color: '#b7a8ff', fontSize: '0.9rem', fontWeight: 'normal' }}>({pick.symbol})</span></div>
                                  <p style={{ color: '#e2e8f0', fontSize: '0.95rem', lineHeight: 1.5 }}>{pick.analysis}</p>
                                  {pick.metrics && (
                                    <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                      {Object.entries(pick.metrics).map(([k, v], mIdx) => (
                                        <span key={mIdx} style={{ fontSize: '0.8rem', backgroundColor: 'rgba(124, 92, 252, 0.15)', color: '#b7a8ff', padding: '4px 8px', borderRadius: 4, fontWeight: 500 }}>
                                          {k}: {String(v)}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                          {r.result.findings.lending_rates && (
                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                               {Object.entries(r.result.findings.lending_rates).map(([network, rates]: [string, any], rIdx) => (
                                  <div key={rIdx} style={{ flex: 1, minWidth: 200, backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <h4 style={{ textTransform: 'capitalize', color: '#fff', marginBottom: 8, marginTop: 0 }}>{network}</h4>
                                    <div style={{ fontSize: '0.9rem', color: '#a0aec0', display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                      <span>Supply APY:</span> <span style={{ color: '#4ade80', fontWeight: 600 }}>{rates.supplyAPY}</span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#a0aec0', display: 'flex', justifyContent: 'space-between' }}>
                                      <span>Borrow APY:</span> <span style={{ color: '#f87171' }}>{rates.variableBorrowAPY}</span>
                                    </div>
                                  </div>
                               ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {showBreakdown && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <AgentFeed results={agentResults} />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="agp-card" style={{ minHeight: 500 }}>
            <PaymentTable />
          </div>
        </div>
      </main>
    </div>
  );
}
