'use client';

import React, { useEffect, useCallback, useState } from 'react';

/**
 * ThemeToggle
 * Client-only component to toggle light/dark themes by setting a data-theme
 * attribute on the html element and persisting the choice to localStorage.
 */
export function ThemeToggle() {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    if (typeof document === 'undefined') return 'light';
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'light';
  });

  const applyTheme = useCallback((t: 'light' | 'dark') => {
    try {
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem('theme', t);
    } catch {}
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const toggle = () => setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      style={{
        padding: '8px 12px',
        borderRadius: 9999,
        border: '1px solid var(--color-separator)',
        background: 'var(--color-surface)',
        color: 'var(--color-text-primary)',
        fontSize: 12,
      }}
    >
      Toggle Theme
    </button>
  );
}


