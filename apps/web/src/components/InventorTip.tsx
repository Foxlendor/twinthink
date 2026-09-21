'use client';

import React, { useState, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';

const TIPS = [
  "As a kid in 2015, I used to sign, date, and time all my logs. A habit that ensures your thoughts are eternally anchored.",
  "i th.ink there for i am?",
  "When you think, you ink, you think twin.",
  "The shadow of your mind is cast by the ink of your pen.",
  "Simulation drift is a feature, not a bug. It tells you exactly where reality diverges from theory."
];

interface InventorTipProps {
  style?: React.CSSProperties;
}

export default function InventorTip({ style }: InventorTipProps) {
  const [tipIndex, setTipIndex] = useState<number>(0);

  useEffect(() => {
    // Pick a random tip on mount
    setTipIndex(Math.floor(Math.random() * TIPS.length));
  }, []);

  return (
    <div style={{
      background: 'rgba(79, 70, 229, 0.05)',
      border: '1px solid rgba(79, 70, 229, 0.2)',
      borderRadius: '8px',
      padding: '0.875rem 1rem',
      display: 'flex',
      gap: '0.75rem',
      alignItems: 'flex-start',
      ...style
    }}>
      <div style={{
        background: '#4F46E5',
        color: '#FFFFFF',
        borderRadius: '50%',
        padding: '0.4rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: '0.1rem'
      }}>
        <Lightbulb size={14} />
      </div>
      <div>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
          Inventor's Note
        </div>
        <div style={{ fontSize: '0.875rem', color: '#374151', fontStyle: 'italic', lineHeight: 1.5 }}>
          "{TIPS[tipIndex]}"
        </div>
      </div>
    </div>
  );
}
