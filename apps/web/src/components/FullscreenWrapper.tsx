'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Maximize, Minimize } from 'lucide-react';
import styles from './TwinViewer.module.css';

interface FullscreenWrapperProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function FullscreenWrapper({ children, className = '', style }: FullscreenWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div 
      ref={containerRef} 
      className={`${styles.viewerContainer} ${isFullscreen ? styles.fullscreen : ''} ${className}`}
      style={style}
    >
      {children}
      
      <button 
        onClick={toggleFullscreen}
        className={styles.fullscreenToggle}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
      </button>
    </div>
  );
}
