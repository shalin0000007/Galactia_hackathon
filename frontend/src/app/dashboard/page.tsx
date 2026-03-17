"use client";
import { useState } from "react";
import PromptInput from "@/components/dashboard/PromptInput";
import AgentActivityFeed from "@/components/dashboard/AgentActivityFeed";
import PaymentHistoryTable from "@/components/dashboard/PaymentHistoryTable";
import WalletBalanceCards from "@/components/dashboard/WalletBalanceCards";

export default function DashboardPage() {
  const [latestRun, setLatestRun] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-primary)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background glow orbs */}
      <div style={{
        position: "fixed",
        top: "-20%",
        left: "-10%",
        width: 600,
        height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,229,255,0.04) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed",
        bottom: "-20%",
        right: "-10%",
        width: 500,
        height: 500,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,230,118,0.03) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <header style={{
        padding: "16px 28px",
        borderBottom: "1px solid var(--border-glass)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backdropFilter: "blur(12px)",
        background: "rgba(11, 14, 23, 0.8)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-emerald))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}>
            💰
          </div>
          <div>
            <h1 style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>
              AgentPay
            </h1>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)" }}>
              Autonomous Agent Payment Dashboard
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isRunning && (
            <div className="badge badge-info animate-pulse-glow" style={{ padding: "5px 12px" }}>
              <svg className="animate-spin-slow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              Agent Running
            </div>
          )}
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "var(--text-muted)",
            padding: "6px 12px",
            borderRadius: 8,
            border: "1px solid var(--border-glass)",
          }}>
            🟢 Connected
          </div>
        </div>
      </header>

      {/* Dashboard Grid */}
      <main style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
        <div className="dashboard-grid">
          {/* Top-left: Prompt Input */}
          <div>
            <PromptInput onResult={setLatestRun} onRunning={setIsRunning} />
          </div>

          {/* Top-right: Wallet Balance Cards */}
          <div>
            <WalletBalanceCards />
          </div>

          {/* Bottom-left: Agent Activity Feed */}
          <div>
            <AgentActivityFeed latestRun={latestRun} />
          </div>

          {/* Bottom-right: Payment History Table */}
          <div>
            <PaymentHistoryTable />
          </div>
        </div>
      </main>
    </div>
  );
}
