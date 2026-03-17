"use client";
import { useState } from "react";

interface PromptInputProps {
  onResult?: (data: any) => void;
  onRunning?: (running: boolean) => void;
}

export default function PromptInput({ onResult, onRunning }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    onRunning?.(true);

    try {
      const { runAgent } = await import("@/lib/api");
      const data = await runAgent(prompt.trim());
      if (data.success) {
        onResult?.(data);
        setPrompt("");
      } else {
        setError(data.error?.message || "Agent run failed");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setLoading(false);
      onRunning?.(false);
    }
  }

  return (
    <div className="glass-card p-5 flex flex-col gap-4 animate-fade-in-up" style={{ animationDelay: "0s" }}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
             style={{ background: "var(--accent-cyan-dim)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <div>
          <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>
            Run Agent
          </h2>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)" }}>
            POST /agent/run
          </p>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Enter your prompt — e.g. Research the latest trends in AI..."
        disabled={loading}
        onKeyDown={(e) => { if (e.key === "Enter" && e.ctrlKey) handleRun(); }}
        rows={4}
        style={{
          width: "100%",
          resize: "vertical",
          background: "rgba(0,0,0,0.3)",
          border: "1px solid var(--border-glass)",
          borderRadius: 12,
          padding: "12px 14px",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--text-primary)",
          outline: "none",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => (e.target as HTMLTextAreaElement).style.borderColor = "var(--accent-cyan)"}
        onBlur={(e) => (e.target as HTMLTextAreaElement).style.borderColor = "var(--border-glass)"}
      />

      {/* Error */}
      {error && (
        <div className="badge-error" style={{ padding: "8px 12px", borderRadius: 8, fontSize: 11, fontFamily: "var(--font-mono)" }}>
          ⚠ {error}
        </div>
      )}

      {/* Run button */}
      <button onClick={handleRun} disabled={loading || !prompt.trim()} className="btn-run">
        {loading ? (
          <>
            <svg className="animate-spin-slow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            Running...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Run Agent
          </>
        )}
      </button>

      <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-muted)", textAlign: "center" }}>
        Ctrl+Enter to run
      </p>
    </div>
  );
}
