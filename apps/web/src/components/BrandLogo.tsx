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

  // Glyph variant: The signature emblem / mark
  if (variant === 'glyph') {
    return (
      <div
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          verticalAlign: 'middle',
          userSelect: 'none'
        }}
      >
        <img
          src="/glyph.png"
          alt="TwinThink Glyph"
          style={{
            height: `${numericHeight}px`,
            width: 'auto',
            maxHeight: '100%',
            maxWidth: '100%',
            display: 'block',
            objectFit: 'contain'
          }}
        />
      </div>
    );
  }

  // Wordmark variant
  if (variant === 'wordmark') {
    return (
      <div
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          verticalAlign: 'middle',
          userSelect: 'none'
        }}
      >
        <img
          src="/wordmark.png"
          alt="TwinThink Wordmark"
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

  // Full Brand Mark: Clean transparent logo
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
        src="/logo.png"
        alt="Twinth.ink"
        style={{
          height: `${numericHeight}px`,
          width: 'auto',
          maxWidth: '100%',
          display: 'block',
          objectFit: 'contain'
        }}
      />
    </div>
  );
}

