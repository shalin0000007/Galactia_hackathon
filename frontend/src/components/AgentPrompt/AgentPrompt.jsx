'use client';
import { useState, useRef } from 'react';
import { agentAPI } from '@/lib/api';

const SAMPLE_PROMPTS = [
  'Find the best cryptocurrency to invest in right now',
  'Analyze top DeFi protocols and execute a trade',
  'Compare Bitcoin and Ethereum performance this week',
  'Research and execute a USDT yield strategy',
];

export default function AgentPrompt({ onResult }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [charCount, setCharCount] = useState(0);
  const textRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const result = await agentAPI.run(prompt.trim());
      onResult?.(result);
      setPrompt('');
      setCharCount(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSample = (sample) => {
    setPrompt(sample);
    setCharCount(sample.length);
    textRef.current?.focus();
  };

  return (
    <div className="agp-card">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🚀</span>
        <h2 className="agp-heading">Run Agent</h2>
        {loading && <span className="agp-pulse-dot" />}
      </div>

      {/* Sample prompts */}
      <div className="flex flex-wrap gap-2 mb-3">
        {SAMPLE_PROMPTS.map((s, i) => (
          <button
            key={i}
            onClick={() => handleSample(s)}
            disabled={loading}
            className="agp-sample-chip"
          >
            {s.length > 40 ? s.slice(0, 38) + '…' : s}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            ref={textRef}
            value={prompt}
            onChange={(e) => { setPrompt(e.target.value); setCharCount(e.target.value.length); }}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit(e); }}
            placeholder="Ask the agents anything… (Ctrl+Enter to send)"
            disabled={loading}
            rows={3}
            maxLength={500}
            className="agp-textarea"
          />
          <span className="absolute bottom-2 right-3 text-zinc-600 text-xs">{charCount}/500</span>
        </div>

        {error && <div className="agp-error text-sm">⚠ {error}</div>}

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="agp-btn-primary w-full"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="agp-spinner" />
              Agents working…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>⚡</span> Run Agent Chain
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
