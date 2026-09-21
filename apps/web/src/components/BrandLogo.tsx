'use client';

import React from 'react';

interface BrandLogoProps {
  height?: number | string;
  variant?: 'brand' | 'wordmark' | 'image' | 'domain' | 'glyph';
  className?: string;
  priority?: boolean;
}

/**
 * Authentic BrandLogo component for Twinth.ink:
 * - Signature double-stem TT ligature
 * - Clean geometric "winth.ink" lettering
 * - Soft rose pink dots on the period and the 'i'
 */
export default function BrandLogo({ 
  height = 30, 
  variant = 'brand', 
  className = '' 
}: BrandLogoProps) {
  const numericHeight = typeof height === 'number' ? height : parseInt(height as string) || 30;

  // Glyph variant: Just the iconic double-stem TT ligature
  if (variant === 'glyph') {
    return (
      <svg 
        height={numericHeight} 
        viewBox="0 0 72 122" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      >
        <title>Twinth.ink</title>
        {/* Horizontal Overbar */}
        <rect x="0" y="0" width="72" height="15" rx="4" fill="#111827" />
        {/* Left Vertical Stem (rounded capsule bottom) */}
        <rect x="15" y="15" width="15" height="107" rx="7.5" fill="#111827" />
        {/* Right Vertical Stem (rounded capsule bottom) */}
        <rect x="42" y="15" width="15" height="107" rx="7.5" fill="#111827" />
      </svg>
    );
  }

  // Full Authentic Brand Mark: "Twinth.ink" with twin-stem TT and pink dots
  return (
    <div 
      className={className}
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center',
        verticalAlign: 'middle',
        userSelect: 'none',
        lineHeight: 1
      }}
      title="Twinth.ink — Give an idea a reality."
    >
      <img
        src="/2twinthinklogo.png"
        alt="Twinth.ink"
        style={{
          height: `${numericHeight}px`,
          width: 'auto',
          maxWidth: '100%',
          display: 'block',
          objectFit: 'contain'
        }}
        onError={(e) => {
          // Fallback to logo.png if 2twinthinklogo.png fails
          const target = e.target as HTMLImageElement;
          if (target && target.src.indexOf('/logo.png') === -1) {
            target.src = '/logo.png';
          }
        }}
      />
    </div>
  );
}
