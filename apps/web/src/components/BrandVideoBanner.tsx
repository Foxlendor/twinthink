'use client';

import React, { useRef, useState } from 'react';
import { Play, Pause, Sparkles } from 'lucide-react';

interface BrandVideoBannerProps {
  className?: string;
  showBadge?: boolean;
  maxHeight?: string | number;
}

export default function BrandVideoBanner({
  className = '',
  showBadge = true,
  maxHeight = '240px'
}: BrandVideoBannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        borderRadius: '20px',
        overflow: 'hidden',
        border: '1px solid rgba(229, 231, 235, 0.8)',
        background: '#0B0C10',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
        maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight
      }}
    >
      <video
        ref={videoRef}
        src="/twinthink.mp4?v=2"
        autoPlay
        loop
        muted
        playsInline
        style={{
          width: '100%',
          height: '100%',
          maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
          objectFit: 'cover',
          display: 'block'
        }}
      />

      {/* Ambient gradient overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 100%)',
          pointerEvents: 'none'
        }}
      />

      {/* Floating Badge */}
      {showBadge && (
        <div
          style={{
            position: 'absolute',
            top: '0.85rem',
            left: '1rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.3rem 0.75rem',
            borderRadius: '999px',
            background: 'rgba(255, 255, 255, 0.18)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            color: '#FFFFFF',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <Sparkles size={12} color="#F5B942" />
          TwinThink Kinetic Identity
        </div>
      )}

      {/* Play/Pause Control Button */}
      <button
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause video banner' : 'Play video banner'}
        style={{
          position: 'absolute',
          bottom: '0.85rem',
          right: '1rem',
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          color: '#FFFFFF',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: '2px' }} />}
      </button>
    </div>
  );
}
