'use client';

import React from 'react';

interface BrandLogoProps {
  height?: number | string;
  variant?: 'brand' | 'wordmark' | 'image' | 'domain';
  className?: string;
}

/**
 * BrandLogo component for TwinThink:
 * - Decoupled double-stem TT ligature
 * - Confident "TwinThink" typography standing on its own
 * - No forced domain-trick visual gimmicks
 */
export default function BrandLogo({ 
  height = 28, 
  variant = 'brand', 
  className = '' 
}: BrandLogoProps) {
  const numericHeight = typeof height === 'number' ? height : parseInt(height as string) || 28;

  if (variant === 'image') {
    return (
      <img
        src="/logo.png"
        alt="TwinThink"
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

  // Pure Brand Mark: Precision Double-stem TT ligature + "TwinThink"
  return (
    <div 
      className={className}
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '0.65rem',
        fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
        color: '#111827',
        userSelect: 'none',
        lineHeight: 1
      }}
      title="TwinThink — Give an idea a reality."
    >
      {/* Precision Double-stem TT ligature mark */}
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
        <rect x="9" y="8.5" width="4.5" height="18.5" rx="2.25" fill="#111827" />
        {/* Right Stem */}
        <rect x="18.5" y="8.5" width="4.5" height="18.5" rx="2.25" fill="#111827" />
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ 
          fontSize: `${Math.max(16, numericHeight * 0.72)}px`, 
          fontWeight: 800, 
          letterSpacing: '-0.03em', 
          color: '#111827',
          lineHeight: 1.1
        }}>
          TwinThink
        </span>
      </div>
    </div>
  );
}
