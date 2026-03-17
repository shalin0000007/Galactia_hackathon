"use client";
import { useState, useEffect, useCallback } from "react";

interface Payment {
  task_id?: string;
  id?: string;
  agent_name?: string;
  agentType?: string;
  amount: number;
  tx_hash?: string;
  txHash?: string;
  timestamp?: string;
  createdAt?: string;
}

export default function PaymentHistoryTable() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      const { getPayments } = await import("@/lib/api");
      const data = await getPayments();
      if (data.success) {
        setPayments(data.payments || []);
      } else {
        setError(data.error?.message || "Failed to fetch payments");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
    const interval = setInterval(fetchPayments, 10000);
    return () => clearInterval(interval);
  }, [fetchPayments]);

  function truncateHash(hash: string): string {
    if (!hash) return "—";
    return hash.slice(0, 6) + "..." + hash.slice(-4);
  }

  function explorerUrl(hash: string): string {
    return `https://sonicscan.org/tx/${hash}`;
  }

  function formatTime(ts: string | undefined): string {
    if (!ts) return "—";
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  return (
    <div className="glass-card flex flex-col animate-fade-in-up" style={{ animationDelay: "0.2s", minHeight: 250 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--border-glass)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: "var(--accent-amber-dim)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-amber)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15 }}>Payment History</h2>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)" }}>
              {payments.length} transactions
            </p>
          </div>
        </div>
        <button
          onClick={() => { setLoading(true); fetchPayments(); }}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--text-muted)",
            background: "none",
            border: "1px solid var(--border-glass)",
            borderRadius: 8,
            padding: "4px 10px",
            cursor: "pointer",
          }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: 350 }}>
        {loading ? (
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 36, width: "100%" }} />
            ))}
          </div>
        ) : error ? (
          <div style={{ padding: 20, textAlign: "center", color: "var(--accent-rose)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
            ⚠ {error}
          </div>
        ) : payments.length === 0 ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            minHeight: 120,
            gap: 8,
            color: "var(--text-muted)",
            padding: 20,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            </svg>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>No payments yet</span>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Amount</th>
                <th>Tx Hash</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <tr key={p.tx_hash || p.txHash || p.id || i} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.04}s` }}>
                  <td>
                    <span style={{ color: "var(--accent-cyan)", fontWeight: 600 }}>
                      {p.agent_name || p.agentType || "Agent"}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: "var(--accent-emerald)", fontWeight: 600 }}>
                      {p.amount} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>USDT</span>
                    </span>
                  </td>
                  <td>
                    {p.tx_hash || p.txHash ? (
                      <a
                        href={explorerUrl((p.tx_hash || p.txHash)!)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "var(--accent-violet)",
                          textDecoration: "none",
                          borderBottom: "1px dashed rgba(179, 136, 255, 0.3)",
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.color = "#D1C4E9"}
                        onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.color = "var(--accent-violet)"}
                      >
                        {truncateHash((p.tx_hash || p.txHash)!)}
                      </a>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{formatTime(p.timestamp || p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
