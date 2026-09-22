'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import InventorTip from './InventorTip';

let isFirstLoad = true;
let globalPrevPath = '';

export default function TransitionScreen() {
  const pathname = usePathname();
  const [isRevealing, setIsRevealing] = useState(false);
  const [isHidden, setIsHidden] = useState(true);

  useEffect(() => {
    const fromHome = globalPrevPath === '/';
    const toElsewhere = pathname !== '/';
    const toHome = pathname === '/';

    // Update global for the *next* navigation
    globalPrevPath = pathname;

    if (isFirstLoad) {
      isFirstLoad = false;
      setIsHidden(true); // Never show on direct URL load
      return;
    }

    if ((fromHome && toElsewhere) || (!fromHome && toHome)) {
      setIsHidden(false);
      setIsRevealing(false);
    } else {
      setIsHidden(true);
    }
  }, [pathname]);

  const handleVideoEnd = () => {
    setIsRevealing(true);
    // After the CSS fade animation finishes (800ms), completely hide the overlay
    setTimeout(() => {
      setIsHidden(true);
    }, 850); 
  };

  if (isHidden) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#FAFAFA',
        opacity: isRevealing ? 0 : 1,
        transition: 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <video
        src="/brand_ink_reveal.mp4"
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnd}
        style={{
          width: '100%',
          maxWidth: 'min(90vw, 680px)',
          maxHeight: 'min(75vh, 680px)',
          aspectRatio: '1 / 1',
          objectFit: 'contain',
          position: 'relative',
          mixBlendMode: 'multiply',
          transform: isRevealing ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
      <div style={{ position: 'absolute', bottom: '4rem', zIndex: 10, maxWidth: '600px', width: '90%', opacity: isRevealing ? 0 : 1, transition: 'opacity 0.4s' }}>
        <InventorTip style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,0,0,0.1)' }} />
      </div>
    </div>
  );
}
