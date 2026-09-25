'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

let isFirstLoad = true;
let globalPrevPath = '';

// Total time on screen. Kept under a second so it reads as a transition,
// never as a destination page.
const DURATION_MS = 950;

/**
 * A brief wordmark between the home page and the rest of the site: the dot of
 * twinth.ink drops in, bounces into place, and the page continues.
 */
export default function TransitionScreen() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fromHome = globalPrevPath === '/';
    const toElsewhere = pathname !== '/';
    const toHome = pathname === '/';
    globalPrevPath = pathname;

    if (isFirstLoad) {
      isFirstLoad = false;
      return; // never on a direct URL load
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!((fromHome && toElsewhere) || (!fromHome && toHome))) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), DURATION_MS);
    return () => window.clearTimeout(t);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="tt-transition" aria-hidden>
      <style>{`
        .tt-transition {
          position: fixed;
          inset: 0;
          z-index: 9999;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #FAFAFA;
          animation: tt-fade ${DURATION_MS}ms ease forwards;
        }
        .tt-word {
          font-family: var(--font-brand);
          font-weight: 700;
          font-size: clamp(1.6rem, 4vw, 2.4rem);
          letter-spacing: -0.03em;
          color: #111827;
          display: flex;
          align-items: baseline;
        }
        .tt-dot {
          display: inline-block;
          width: 0.2em;
          height: 0.2em;
          margin: 0 0.06em;
          border-radius: 50%;
          background: #111827;
          animation: tt-bounce 620ms cubic-bezier(0.3, 0, 0.3, 1) both;
        }
        @keyframes tt-bounce {
          0% { transform: translateY(-1.6em); opacity: 0; }
          45% { transform: translateY(0); opacity: 1; }
          65% { transform: translateY(-0.35em); }
          82% { transform: translateY(0); }
          91% { transform: translateY(-0.08em); }
          100% { transform: translateY(0); }
        }
        @keyframes tt-fade {
          0%, 72% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
      <div className="tt-word">
        <span>twinth</span>
        <span className="tt-dot" />
        <span>ink</span>
      </div>
    </div>
  );
}
