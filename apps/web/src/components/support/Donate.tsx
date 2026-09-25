'use client';

import React, { useState } from 'react';

const AMOUNTS = [3, 5, 10, 25];

/**
 * A quiet way to give. Uses a hosted donation link when one is configured
 * (NEXT_PUBLIC_DONATE_URL), otherwise Stripe Checkout via /api/donate.
 */
export default function Donate({ compact = false, onDone }: { compact?: boolean; onDone?: () => void }) {
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const hosted = process.env.NEXT_PUBLIC_DONATE_URL;

  const give = async (amount: number) => {
    setMessage(null);
    if (hosted) {
      window.location.assign(hosted);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/donate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) window.location.assign(data.url);
      else setMessage(data.error ?? 'Something went wrong.');
    } catch {
      setMessage('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  const style: Record<string, React.CSSProperties> = {
    row: { display: 'flex', gap: compact ? 12 : 16, flexWrap: 'wrap', alignItems: 'baseline' },
    amount: {
      background: 'none',
      border: 'none',
      borderBottom: '1px solid rgba(30,28,36,0.2)',
      padding: '2px 0',
      fontFamily: 'var(--font-serif), Georgia, serif',
      fontStyle: 'italic',
      fontSize: compact ? '1rem' : '1.3rem',
      color: 'rgba(30,28,36,0.8)',
      cursor: busy ? 'wait' : 'pointer',
    },
    input: {
      width: compact ? 64 : 90,
      background: 'transparent',
      border: 'none',
      borderBottom: '1px solid rgba(30,28,36,0.2)',
      fontFamily: 'var(--font-serif), Georgia, serif',
      fontStyle: 'italic',
      fontSize: compact ? '1rem' : '1.3rem',
      outline: 'none',
    },
    msg: { marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'rgba(30,28,36,0.55)' },
  };

  return (
    <div>
      <div style={style.row}>
        {AMOUNTS.map((a) => (
          <button key={a} type="button" style={style.amount} disabled={busy} onClick={() => give(a)}>
            ${a}
          </button>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(custom);
            if (n >= 1) give(n);
          }}
          style={{ display: 'inline-flex', gap: 6, alignItems: 'baseline' }}
        >
          <span style={{ ...style.amount, border: 'none', cursor: 'default' }}>$</span>
          <input
            aria-label="Another amount in dollars"
            inputMode="decimal"
            placeholder="other"
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/[^0-9.]/g, ''))}
            style={style.input}
          />
        </form>
        {onDone && (
          <button type="button" style={{ ...style.amount, border: 'none', color: 'rgba(30,28,36,0.4)' }} onClick={onDone}>
            not now
          </button>
        )}
      </div>
      {message && <div style={style.msg}>{message}</div>}
    </div>
  );
}
