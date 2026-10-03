'use client';

import React, { useRef, useState } from 'react';
import { Play, Pause, Sparkles } from 'lucide-react';

interface BrandVideoBannerProps {
  className?: string;
}

export default function BrandVideoBanner({
  className = ''
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
        background: 'transparent',
        aspectRatio: '1 / 1',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none'
      }}
    >
      <video
        ref={videoRef}
        className="brand-ink-video"
        src="/brand_ink_reveal.mp4"
        poster="/brand_ink_reveal_poster.jpg"
        autoPlay
        muted
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
          mixBlendMode: 'multiply'
        }}
      />
    </div>
  );
}
