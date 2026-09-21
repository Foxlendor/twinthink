'use client';

import React, { useEffect, useState } from 'react';


export default function TransitionScreen() {
  const [mounted, setMounted] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    // Start mounted to show the black screen immediately
    setMounted(true);

    // Hold the loading screen for a short moment, then trigger the reveal
    const revealTimer = setTimeout(() => {
      setIsRevealing(true);
    }, 800); // How long the transition logo stays visible

    // After the reveal animation finishes, completely hide the overlay so it doesn't block clicks
    const hideTimer = setTimeout(() => {
      setIsHidden(true);
    }, 2000); // 800 + 1200ms animation

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(hideTimer);
    };
  }, []);

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
            loop
            muted
            playsInline
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.9,
              mixBlendMode: 'multiply'
            }}
          />
          
          <div 
            style={{ 
              position: 'relative', 
              zIndex: 10, 
              color: '#000000', 
              fontWeight: 900, 
              fontSize: '1.25rem', 
              letterSpacing: '0.15em',
              textTransform: 'lowercase',
              background: 'rgba(255, 255, 255, 0.6)',
              padding: '0.2rem 0.75rem',
              borderRadius: '4px',
              backdropFilter: 'blur(4px)'
            }}
          >
            twin think
          </div>
        </div>
      </div>
    </div>
  );
}
