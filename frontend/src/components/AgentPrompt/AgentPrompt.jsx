'use client';
import { useState, useRef, useEffect } from 'react';
import { agentAPI } from '@/lib/api';

const SAMPLES = [
  'Find top DeFi yield opportunities on Sonic',
  'Analyze and compare top Web3 protocols',
  'Research USDT liquidity strategies this week',
  'Audit the fastest growing L1 chains right now',
];

const LOADING_STEPS = [
  'Initializing Manager...',
  'Decomposing task...',
  'Dispatching to agents...',
  'Fetching on-chain data...',
  'Evaluating quality...',
  'Settling USDT on Sonic...',
];

export default function AgentPrompt({ onResult }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);
  const [error, setError] = useState(null);
  const textRef = useRef(null);

  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingTextIndex(0);
      interval = setInterval(() => {
        setLoadingTextIndex(prev => (prev < LOADING_STEPS.length - 1 ? prev + 1 : prev));
      }, 800);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await agentAPI.run(prompt.trim());
      onResult?.(result);
      setPrompt('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillSample = (s) => {
    setPrompt(s);
    textRef.current?.focus();
  };

  return (
    <div>
      {/* Sample prompts */}
      <div className="agp-prompt-samples">
        {SAMPLES.map((s, i) => (
          <button
            key={i}
            disabled={loading}
            onClick={() => fillSample(s)}
            className="agp-sample"
          >
            {s.length > 38 ? s.slice(0, 36) + '…' : s}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="agp-textarea-wrap">
          <textarea
            ref={textRef}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit(e); }}
            placeholder="Describe what the agents should research and execute… (Ctrl+Enter)"
            disabled={loading}
            rows={3}
            maxLength={500}
            className="agp-textarea"
          />
          <span className="agp-char-count">{prompt.length}/500</span>
        </div>

        {error && <div className="agp-error" style={{ marginBottom: 10 }}>⚠ {error}</div>}

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="agp-btn agp-btn-primary"
        >
          {loading ? (
            <>
              <span className="agp-spinner" />
              {LOADING_STEPS[loadingTextIndex]}
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Dispatch Agent Chain
            </>
          )}
        </button>
      </form>
    </div>
  );
}
