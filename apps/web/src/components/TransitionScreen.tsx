'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

let isFirstLoad = true;
let globalPrevPath = '';

export default function TransitionScreen() {
  const pathname = usePathname();
  const [isRevealing, setIsRevealing] = useState(false);
  const [isHidden, setIsHidden] = useState(true);

  useEffect(() => {
    const fromHome = globalPrevPath === '/';
    const toElsewhere = pathname !== '/';

    // Update global for the *next* navigation
    globalPrevPath = pathname;

    if (isFirstLoad) {
      isFirstLoad = false;
      setIsHidden(true); // Never show on direct URL load
      return;
    }

    if (fromHome && toElsewhere) {
      setIsHidden(false);
      setIsRevealing(false);
    } else {
      setIsHidden(true);
    }
  }, [pathname]);

  const handleVideoEnd = () => {
    // Add a slight delay to ensure the video's visual tail fully completes
    // before the black doorway starts ripping open.
    setTimeout(() => {
      setIsRevealing(true);
      // After the CSS reveal animation finishes (1000ms), completely hide the overlay
      setTimeout(() => {
        setIsHidden(true);
      }, 1200); 
    }, 800);
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
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      {/* 
        The "Black Doorway" & Expanding Hole 
        We use a giant black box-shadow to create the solid black screen.
        The div itself acts as the "hole". 
      */}
      <div 
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: isRevealing ? '300vmax' : '260px',
          height: isRevealing ? '300vmax' : '260px',
          borderRadius: '50%',
          boxShadow: '0 0 0 150vmax #000000', // Black borders filling the screen
          background: isRevealing ? 'transparent' : '#FFFFFF', // White peep hole base
          transition: 'width 1s cubic-bezier(0.7, 0, 0.2, 1), height 1s cubic-bezier(0.7, 0, 0.2, 1), background 0.4s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden' // Keeps the video constrained inside the circle initially
        }}
      >
        {/* The Video and Text content inside the white peep hole */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: isRevealing ? 0 : 1,
            transform: isRevealing ? 'scale(1.2)' : 'scale(1)',
            transition: 'opacity 0.6s ease, transform 1s cubic-bezier(0.7, 0, 0.2, 1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* We use object-fit cover so the video perfectly fills the circular peep hole and stays centered */}
          <video
            src="/twinthink.mp4?v=2"
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnd}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.9,
              mixBlendMode: 'multiply'
            }}
          />
        </div>
      </div>
    </div>
  );
}
