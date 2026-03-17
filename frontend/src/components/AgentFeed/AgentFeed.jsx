'use client';

export default function AgentFeed({ results }) {
  if (!results || results.length === 0) {
    return (
      <div className="agp-card h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">⚙️</span>
          <h2 className="agp-heading">Agent Activity</h2>
        </div>
        <div className="agp-empty flex-1">
          <span>🤖</span>
          <p>Run a prompt to see agent activity here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="agp-card h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">⚙️</span>
        <h2 className="agp-heading">Agent Activity</h2>
        <span className="ml-auto agp-badge agp-badge-green">{results.length} tasks</span>
      </div>

      <div className="flex-1 overflow-auto space-y-3">
        {results.map((task, i) => (
          <div key={i} className="agp-feed-item">
            {/* Agent badge */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`agp-agent-dot ${task.agent === 'research' ? 'agp-dot-blue' : 'agp-dot-purple'}`} />
                <span className="text-xs font-semibold text-white capitalize">
                  {task.agent === 'research' ? '🔍 Research Agent' : '⚡ Execution Agent'}
                </span>
              </div>
              <span className={`agp-badge ${task.status === 'completed' ? 'agp-badge-green' : 'agp-badge-red'}`}>
                {task.status === 'completed' ? '✓ Done' : '✗ Failed'}
              </span>
            </div>

            {/* Task description */}
            <p className="text-xs text-zinc-300 mb-2 leading-relaxed">{task.task_description}</p>

            {/* Result summary */}
            {task.result?.summary && (
              <p className="text-xs text-zinc-400 italic mb-2">"{task.result.summary}"</p>
            )}

            {/* Payment row */}
            {task.payment && (
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${task.payment.status === 'paid' ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {task.payment.status === 'paid' ? '💸 Paid' : '⏳ Pending'}
                  </span>
                  <span className="text-xs font-mono text-emerald-300">
                    {task.payment.amount} USDT
                  </span>
                </div>
                {task.payment.tx_hash && task.payment.explorer_url && (
                  <a
                    href={task.payment.explorer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-mono transition-colors"
                    title={task.payment.tx_hash}
                  >
                    {task.payment.tx_hash.slice(0, 10)}…↗
                  </a>
                )}
              </div>
            )}

            {/* Duration */}
            <div className="text-right mt-1">
              <span className="text-zinc-600 text-xs">{task.duration_ms}ms</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
