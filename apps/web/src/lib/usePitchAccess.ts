'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY_UNLOCKED = 'twinthink_pitch_access_unlocked';
const STORAGE_KEY_CODE = 'twinthink_pitch_active_code';
const STORAGE_KEY_CUSTOM_CODES = 'twinthink_pitch_custom_codes';

// Built-in verified pitch & investor codes
export const DEFAULT_PITCH_CODES = [
  'PITCH2026',
  'INVESTOR',
  'FOUNDER',
  'TWINTHINK',
  'TWIZZLOCK',
  'REDRINK',
  'VIPDEMO',
  'ANGEL'
];

export function getStoredCustomCodes(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOM_CODES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getAllValidCodes(): string[] {
  const custom = getStoredCustomCodes();
  return Array.from(new Set([...DEFAULT_PITCH_CODES, ...custom])).map(c => c.toUpperCase().trim());
}

export function usePitchAccess() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);

  // Sync state from storage or URL
  const checkStatus = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Check URL parameters for immediate pitch unlock link (e.g. ?pitch=PITCH2026 or ?code=...)
    try {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get('pitch') || params.get('code') || params.get('invite');
      if (urlCode) {
        const validCodes = getAllValidCodes();
        if (validCodes.includes(urlCode.toUpperCase().trim())) {
          localStorage.setItem(STORAGE_KEY_UNLOCKED, 'true');
          localStorage.setItem(STORAGE_KEY_CODE, urlCode.toUpperCase().trim());
          setIsUnlocked(true);
          setActiveCode(urlCode.toUpperCase().trim());
          return;
        }
      }
    } catch {}

    // Check localStorage
    try {
      const unlocked = localStorage.getItem(STORAGE_KEY_UNLOCKED) === 'true';
      const code = localStorage.getItem(STORAGE_KEY_CODE);
      setIsUnlocked(unlocked);
      setActiveCode(code);
    } catch {}
  }, []);

  useEffect(() => {
    setMounted(true);
    checkStatus();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_UNLOCKED || e.key === STORAGE_KEY_CODE) {
        checkStatus();
      }
    };

    const handleCustomSync = () => checkStatus();

    window.addEventListener('storage', handleStorage);
    window.addEventListener('twinthink:pitch-unlock-changed', handleCustomSync);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('twinthink:pitch-unlock-changed', handleCustomSync);
    };
  }, [checkStatus]);

  const unlockWithCode = (rawCode: string): { success: boolean; message: string } => {
    if (!rawCode || !rawCode.trim()) {
      return { success: false, message: 'Please enter a valid pitch or invite code.' };
    }

    const normalized = rawCode.trim().toUpperCase();
    const validCodes = getAllValidCodes();

    if (validCodes.includes(normalized)) {
      try {
        localStorage.setItem(STORAGE_KEY_UNLOCKED, 'true');
        localStorage.setItem(STORAGE_KEY_CODE, normalized);
        if (typeof document !== 'undefined') {
          document.cookie = `twinthink_pitch_code=${encodeURIComponent(normalized)}; path=/; max-age=86400; SameSite=Lax`;
        }
      } catch {}

      setIsUnlocked(true);
      setActiveCode(normalized);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('twinthink:pitch-unlock-changed'));
      }

      return {
        success: true,
        message: `Pitch Code "${normalized}" verified. Private Engineering Vault and full specs are now unlocked.`
      };
    }

    return {
      success: false,
      message: 'Invalid or expired pitch code. Try PITCH2026 or request a code from the inventor.'
    };
  };

  const relock = () => {
    try {
      localStorage.removeItem(STORAGE_KEY_UNLOCKED);
      localStorage.removeItem(STORAGE_KEY_CODE);
      if (typeof document !== 'undefined') {
        document.cookie = 'twinthink_pitch_code=; path=/; max-age=0; SameSite=Lax';
      }
    } catch {}

    setIsUnlocked(false);
    setActiveCode(null);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('twinthink:pitch-unlock-changed'));
    }
  };

  const createPitchCode = (codeName?: string): string => {
    const newCode = (codeName && codeName.trim()) 
      ? codeName.trim().toUpperCase() 
      : `PITCH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    try {
      const existing = getStoredCustomCodes();
      if (!existing.includes(newCode)) {
        existing.push(newCode);
        localStorage.setItem(STORAGE_KEY_CUSTOM_CODES, JSON.stringify(existing));
      }
    } catch {}

    return newCode;
  };

  return {
    isUnlocked: mounted ? isUnlocked : false,
    activeCode: mounted ? activeCode : null,
    unlockWithCode,
    relock,
    createPitchCode,
    validCodes: getAllValidCodes()
  };
}
