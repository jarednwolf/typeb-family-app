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
      className="btn btn-secondary btn-sm"
    >
      Toggle Theme
    </button>
  );
}


