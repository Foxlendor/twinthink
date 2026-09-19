'use client';

import React from 'react';

interface BrandLogoProps {
  height?: number | string;
  variant?: 'domain' | 'wordmark' | 'image' | 'both';
  className?: string;
}

/**
 * BrandLogo component adhering to TwinThink typography rules:
 * - Nominal stroke unit S approx 29px scale (proportional)
 * - Terminal radius R approx S/2
 * - Decoupled double-stem ligature for TT
 * - Distinctive pink circular dots on '.' and 'i' of '.ink'
 * - Wordmark: "TWIN THINK" vs Domain: "twinth.ink"
 */
export default function BrandLogo({ 
  height = 28, 
  variant = 'domain', 
  className = '' 
}: BrandLogoProps) {
  const numericHeight = typeof height === 'number' ? height : parseInt(height as string) || 28;
  const pinkDotColor = '#F472B6'; // Vibrant rose pink from logo

  if (variant === 'image') {
    return (
      <img
        src="/logo.png"
        alt="Twinth.ink"
        style={{
          height: `${numericHeight}px`,
          width: 'auto',
          display: 'block',
          objectFit: 'contain'
        }}
        className={className}
      />
    );
  }

  if (variant === 'wordmark') {
    return (
      <div 
        className={className}
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
          color: '#111827',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          fontSize: `${numericHeight * 0.75}px`,
          lineHeight: 1
        }}
      >
        {/* Double-stem TT ligature mark */}
        <svg 
          height={numericHeight} 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', flexShrink: 0 }}
        >
          {/* Top Bar */}
          <rect x="2" y="4" width="28" height="4.5" rx="2.25" fill="#111827" />
          {/* Left Stem */}
          <rect x="9" y="8" width="4.5" height="19" rx="2.25" fill="#111827" />
          {/* Right Stem */}
          <rect x="18.5" y="8" width="4.5" height="19" rx="2.25" fill="#111827" />
        </svg>
        <span>TWIN THINK</span>
      </div>
    );
  }

  // Primary rendering displaying the exact user-uploaded second image with transparent background
  return (
    <div 
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: `${numericHeight}px`,
        userSelect: 'none'
      }}
      title="Twinth.ink — Idea Reality Engine"
    >
      <img
        src="/logo.png"
        alt="Twinth.ink"
        style={{
          height: `${numericHeight}px`,
          width: 'auto',
          display: 'block',
          objectFit: 'contain'
        }}
      />
    </div>
  );
}
