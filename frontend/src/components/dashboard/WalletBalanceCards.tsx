"use client";
import { useState, useEffect, useCallback } from "react";

interface AgentInfo {
  name: string;
  address: string;
  balance: string | number;
}

interface AgentsData {
  manager: AgentInfo | null;
  research: AgentInfo | null;
  execution: AgentInfo | null;
}

interface CardStyle {
  accent: string;
  bg: string;
  icon: string;
  label: string;
}

const CARD_STYLES: CardStyle[] = [
  { accent: "var(--accent-cyan)", bg: "var(--accent-cyan-dim)", icon: "🤖", label: "Manager" },
  { accent: "var(--accent-emerald)", bg: "var(--accent-emerald-dim)", icon: "🔍", label: "Research" },
  { accent: "var(--accent-amber)", bg: "var(--accent-amber-dim)", icon: "⚡", label: "Execution" },
];

function truncateAddr(addr: string | undefined): string {
  if (!addr) return "No wallet";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export default function WalletBalanceCards() {
  const [agents, setAgents] = useState<AgentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      const { getAgentStatus } = await import("@/lib/api");
      const data = await getAgentStatus();
      if (data.success) {
        setAgents(data.agents);
        setError(null);
      } else {
        setError("Failed to fetch agents");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 15000);
    return () => clearInterval(interval);
  }, [fetchAgents]);

  const agentKeys: (keyof AgentsData)[] = ["manager", "research", "execution"];

  return (
    <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: "rgba(179, 136, 255, 0.15)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-violet)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5" />
              <path d="M18 12a2 2 0 000 4h4v-4z" />
            </svg>
          </div>
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15 }}>Wallet Balances</h2>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)" }}>
              Agent wallets
            </p>
          </div>
        </div>
        <button
          onClick={() => { setLoading(true); fetchAgents(); }}
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

      {/* Cards */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 72, width: "100%" }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ padding: 16, textAlign: "center", color: "var(--accent-rose)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
          ⚠ {error}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {agentKeys.map((key, i) => {
            const agent = agents?.[key];
            const style = CARD_STYLES[i];
            return (
              <div
                key={key}
                className="animate-fade-in-up"
                style={{
                  animationDelay: `${0.15 + i * 0.08}s`,
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 16px",
                  borderRadius: 12,
                  background: "rgba(0,0,0,0.25)",
                  border: `1px solid ${agent ? "var(--border-glass)" : "var(--accent-rose-dim)"}`,
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = style.accent;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 16px ${style.bg}`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-glass)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: style.bg,
                  fontSize: 18,
                  flexShrink: 0,
                }}>
                  {style.icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 13, color: style.accent }}>
                    {style.label} Agent
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                    {agent ? truncateAddr(agent.address) : "Not initialized"}
                  </div>
                </div>

                {/* Balance */}
                <div style={{ textAlign: "right" }}>
                  <div style={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    fontSize: 18,
                    color: agent ? "var(--text-primary)" : "var(--text-muted)",
                  }}>
                    {agent?.balance != null ? parseFloat(String(agent.balance)).toFixed(2) : "—"}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)" }}>
                    USDT
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
