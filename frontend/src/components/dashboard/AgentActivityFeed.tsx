"use client";
import { useState, useEffect, useRef } from "react";

interface FeedEntry {
  id: string;
  type: string;
  agent: string;
  text: string;
  time: string;
  status: string;
  payment?: { status: string; amount: number; tx_hash?: string };
  duration?: number;
}

interface AgentActivityFeedProps {
  latestRun?: any;
}

export default function AgentActivityFeed({ latestRun }: AgentActivityFeedProps) {
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!latestRun) return;

    const timestamp = new Date().toLocaleTimeString();
    const newEntries: FeedEntry[] = [];

    // Manager reasoning entry
    newEntries.push({
      id: Date.now() + "-mgr",
      type: "manager",
      agent: "Manager",
      text: latestRun.manager_reasoning || "Analyzing prompt...",
      time: timestamp,
      status: "completed",
    });

    // Individual task entries
    if (latestRun.results) {
      latestRun.results.forEach((r: any, i: number) => {
        newEntries.push({
          id: Date.now() + "-task-" + i,
          type: "task",
          agent: r.agent,
          text: r.summary || r.task,
          time: timestamp,
          status: r.status,
          payment: r.payment,
          duration: r.duration_ms,
        });
      });
    }

    // Summary entry
    if (latestRun.trace) {
      newEntries.push({
        id: Date.now() + "-summary",
        type: "summary",
        agent: "System",
        text: `${latestRun.trace.completed}/${latestRun.trace.total_tasks} tasks completed | ${latestRun.trace.total_payment} USDT paid | ${latestRun.trace.total_duration_ms}ms`,
        time: timestamp,
        status: "info",
      });
    }

    setEntries((prev) => [...newEntries, ...prev].slice(0, 50));
  }, [latestRun]);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [entries]);

  function statusBadge(status: string): string {
    const map: Record<string, string> = {
      completed: "badge-success",
      failed: "badge-error",
      info: "badge-info",
    };
    return map[status] || "badge-warning";
  }

  function agentIcon(type: string): string {
    if (type === "manager") return "🧠";
    if (type === "summary") return "📊";
    return "⚡";
  }

  return (
    <div className="glass-card flex flex-col animate-fade-in-up" style={{ animationDelay: "0.15s", minHeight: 300 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--border-glass)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: "var(--accent-emerald-dim)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-emerald)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15 }}>Agent Activity</h2>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)" }}>
              {entries.length} events
            </p>
          </div>
        </div>
        {entries.length > 0 && (
          <button
            onClick={() => setEntries([])}
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
            Clear
          </button>
        )}
      </div>

      {/* Feed */}
      <div ref={feedRef} className="flex-1 overflow-y-auto p-4" style={{ maxHeight: 400 }}>
        {entries.length === 0 ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            minHeight: 150,
            gap: 8,
            color: "var(--text-muted)",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
              Awaiting agent activity...
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {entries.map((entry, i) => (
              <div
                key={entry.id}
                className="animate-fade-in-up"
                style={{
                  animationDelay: `${i * 0.05}s`,
                  display: "flex",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid var(--border-glass)",
                }}
              >
                <span style={{ fontSize: 16 }}>{agentIcon(entry.type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 12, color: "var(--accent-cyan)" }}>
                      {entry.agent}
                    </span>
                    <span className={`badge ${statusBadge(entry.status)}`}>{entry.status}</span>
                    {entry.duration && (
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)" }}>
                        {entry.duration}ms
                      </span>
                    )}
                  </div>
                  <p style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                    wordBreak: "break-word",
                  }}>
                    {entry.text}
                  </p>
                  {entry.payment && entry.payment.status === "paid" && (
                    <div style={{
                      marginTop: 4,
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: "var(--accent-emerald)",
                    }}>
                      💰 {entry.payment.amount} USDT → {entry.payment.tx_hash?.slice(0, 10)}...
                    </div>
                  )}
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                  {entry.time}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
