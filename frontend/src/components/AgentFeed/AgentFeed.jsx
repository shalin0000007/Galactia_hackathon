'use client';

function QualityBar({ score }) {
  const pct = Math.round((score ?? 0) * 100);
  const cls = pct >= 70 ? 'agp-quality-high' : pct >= 30 ? 'agp-quality-mid' : 'agp-quality-low';
  const txtCls = pct >= 70 ? 'agp-quality-high-text' : pct >= 30 ? 'agp-quality-mid-text' : 'agp-quality-low-text';
  return (
    <div className="agp-feed-quality">
      <span className="agp-quality-label">Quality</span>
      <div className="agp-quality-track">
        <div className={`agp-quality-bar ${cls}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`agp-quality-pct ${txtCls}`}>{pct}%</span>
    </div>
  );
}

export default function AgentFeed({ results }) {
  if (!results || results.length === 0) {
    return (
      <div className="agp-empty">
        <span className="agp-empty-icon">⚡</span>
        <p>Awaiting agent dispatch…</p>
      </div>
    );
  }

  return (
    <div className="agp-feed">
      {results.map((task, i) => {
        const isResearch = task.agent === 'research';
        const paid = task.payment?.status === 'paid';
        const rejected = task.payment?.status === 'rejected';
        return (
          <div
            key={i}
            className={`agp-feed-item ${isResearch ? 'agp-feed-research' : 'agp-feed-execution'}`}
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            {/* Header */}
            <div className="agp-feed-header">
              <div className="agp-feed-agent">
                <span className="agp-feed-dot" />
                {isResearch ? 'Research Agent' : 'Execution Agent'}
              </div>
              <span className={`agp-badge ${task.status === 'completed' ? 'agp-badge-green' : 'agp-badge-red'}`}>
                {task.status === 'completed' ? '✓ Done' : '✗ Failed'}
              </span>
            </div>

            {/* Task desc */}
            <p className="agp-feed-task">{task.task_description}</p>

            {task.result?.summary && (
              <p className="agp-feed-summary">"{task.result.summary}"</p>
            )}

            {/* Detailed Research Findings */}
            {task.result?.findings && (
              <div className="agp-feed-findings" style={{ marginTop: 12, padding: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: '0.9rem' }}>
                {task.result.findings.analysis && (
                  <p style={{ marginBottom: 8, color: '#e2e8f0', lineHeight: 1.5 }}>
                    {task.result.findings.analysis}
                  </p>
                )}
                {task.result.findings.top_picks && Array.isArray(task.result.findings.top_picks) && (
                  <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                    {task.result.findings.top_picks.map((pick, idx) => (
                      <li key={idx} style={{ marginBottom: 6, paddingLeft: 10, borderLeft: '2px solid #7c5cfc' }}>
                        <strong>{pick.name} ({pick.symbol})</strong>
                        {pick.metrics && <span style={{ marginLeft: 8, color: '#a0aec0' }}>{JSON.stringify(pick.metrics).replace(/["{}]/g, '').replace(/:/g, ': ')}</span>}
                        <p style={{ marginTop: 2, color: '#a0aec0', fontSize: '0.85rem' }}>{pick.analysis}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Quality */}
            {task.quality != null && <QualityBar score={task.quality.score} />}

            {/* Footer: payment */}
            {task.payment && (
              <div className="agp-feed-footer">
                <div className="agp-feed-payment">
                  {paid && <span className="agp-feed-amount">+{task.payment.amount} USDT</span>}
                  <span className={`agp-badge ${paid ? 'agp-badge-green' : rejected ? 'agp-badge-red' : 'agp-badge-amber'}`}>
                    {paid ? 'Paid' : rejected ? 'Rejected' : 'Pending'}
                  </span>
                  {task.payment.tx_hash && (
                    <span className="agp-badge agp-badge-teal">⛓ Sonic</span>
                  )}
                </div>
                {task.payment.tx_hash && task.payment.explorer_url && (
                  <a href={task.payment.explorer_url} target="_blank" rel="noopener noreferrer" className="agp-mono">
                    {task.payment.tx_hash.slice(0, 12)}…↗
                  </a>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <span className="agp-feed-duration">{task.duration_ms}ms</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
