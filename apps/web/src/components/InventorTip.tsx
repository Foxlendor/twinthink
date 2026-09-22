'use client';

import React, { useState, useEffect } from 'react';
import { Lightbulb, Quote, Library } from 'lucide-react';

type TipType = 'founder' | 'quote' | 'fact';

interface TipData {
  type: TipType;
  content: string;
  author?: string;
}

const TIPS: TipData[] = [
  // Founder Quotes (Retained)
  { type: 'founder', content: "As a kid in 2015, I used to sign, date, and time all my logs. A habit that ensures your thoughts are eternally anchored." },
  { type: 'founder', content: "i th.ink there for i am?" },
  { type: 'founder', content: "Build it. Test it. Twin it." },
  { type: 'founder', content: "The physical world is just a rendering engine for your mind." },
  { type: 'founder', content: "Simulation drift is a feature, not a bug. It tells you exactly where reality diverges from theory." },

  // A Priori & Philosophical Quotes
  { type: 'quote', content: "Divide each difficulty into as many parts as is feasible and necessary to resolve it.", author: "René Descartes" },
  { type: 'quote', content: "Experience without theory is blind, but theory without experience is mere intellectual play.", author: "Immanuel Kant" },
  { type: 'quote', content: "There are two kinds of truths: those of reasoning and those of fact.", author: "Gottfried Wilhelm Leibniz" },
  { type: 'quote', content: "Wonder is the beginning of wisdom.", author: "Socrates" },
  { type: 'quote', content: "I have been impressed with the urgency of doing. Knowing is not enough; we must apply. Being willing is not enough; we must do.", author: "Leonardo da Vinci" },
  { type: 'quote', content: "My brain is only a receiver, in the Universe there is a core from which we obtain knowledge, strength and inspiration.", author: "Nikola Tesla" },
  { type: 'quote', content: "That brain of mine is something more than merely mortal; as time will show.", author: "Ada Lovelace" },
  { type: 'quote', content: "I much prefer the sharpest criticism of a single intelligent man to the thoughtless approval of the masses.", author: "Johannes Kepler" },
  
  // Historical Fun Facts
  { type: 'fact', content: "Leonardo da Vinci wrote all of his notebooks in reverse mirror-image cursive, a rudimentary form of physical cryptography to protect his earliest twins." },
  { type: 'fact', content: "Nikola Tesla visualized his inventions in 3D in his mind before ever drawing them, claiming he could test for physical wear and tear entirely within his imagination—an early human physics engine." },
  { type: 'fact', content: "Ada Lovelace conceptualized the idea of a machine manipulating symbols rather than just numbers in 1843, pre-dating the modern digital computer by a full century." },
  { type: 'fact', content: "Johannes Gutenberg repurposed an agricultural wine press to invent the printing press. Breakthroughs often come from looking at an old tool from a new angle." },
  { type: 'fact', content: "Philo Farnsworth conceived the core concept for the electronic television while looking at the parallel lines of dirt he was plowing in a potato field." },
  { type: 'fact', content: "Archimedes discovered the principle of fluid displacement while taking a bath. True insight often strikes when the mind is at rest, but only if you are ready to document it." }
];

interface InventorTipProps {
  style?: React.CSSProperties;
}

export default function InventorTip({ style }: InventorTipProps) {
  const [tipData, setTipData] = useState<TipData>(TIPS[0]);

  useEffect(() => {
    setTipData(TIPS[Math.floor(Math.random() * TIPS.length)]);
  }, []);

  const getIcon = () => {
    switch (tipData.type) {
      case 'quote': return <Quote size={14} />;
      case 'fact': return <Library size={14} />;
      default: return <Lightbulb size={14} />;
    }
  };

  const getLabel = () => {
    switch (tipData.type) {
      case 'quote': return "A Priori Wisdom";
      case 'fact': return "Historical Insight";
      default: return "Inventor's Note";
    }
  };

  return (
    <div style={{
      background: 'rgba(37, 99, 235, 0.05)',
      border: '1px solid rgba(37, 99, 235, 0.2)',
      borderRadius: '12px',
      padding: '1rem 1.25rem',
      display: 'flex',
      gap: '0.85rem',
      alignItems: 'flex-start',
      boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)',
      ...style
    }}>
      <div style={{
        background: '#2563EB',
        color: '#FFFFFF',
        borderRadius: '50%',
        padding: '0.4rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: '0.1rem'
      }}>
        {getIcon()}
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
          {getLabel()}
        </div>
        <div style={{ fontSize: '0.9rem', color: '#374151', fontStyle: 'italic', lineHeight: 1.6 }}>
          "{tipData.content}"
          {tipData.author && (
            <span style={{ display: 'block', marginTop: '0.4rem', fontSize: '0.8rem', color: '#6B7280', fontWeight: 600, fontStyle: 'normal' }}>
              — {tipData.author}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
