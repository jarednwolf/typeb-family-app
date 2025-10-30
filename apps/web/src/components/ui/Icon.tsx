"use client";

import React, { useMemo } from 'react';

type IconName = 'home' | 'users' | 'check' | 'chart' | 'cog' | 'bell' | 'task';

export default function Icon({ name, className = 'w-5 h-5' }: { name: IconName; className?: string }) {
  // Lazily try to use shared icons if available; fallback to local inline SVGs
  const SharedIcon = useMemo(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require('@typeb/icons');
      return mod?.Icon as React.ComponentType<{ name: string; className?: string }>;
    } catch {
      return null;
    }
  }, []);

  if (SharedIcon && name !== 'bell') {
    return <SharedIcon name={name} className={className} />;
  }

  if (name === 'bell') {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
    );
  }
  // Local fallback set
  switch (name) {
    case 'home':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9v7a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4H9v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-7z"/></svg>
      );
    case 'users':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-5-4M9 20v-2a4 4 0 015-4m-7 6H2v-2a4 4 0 015-4m5-6a3 3 0 11-6 0 3 3 0 016 0m8 3a3 3 0 11-6 0 3 3 0 016 0"/></svg>
      );
    case 'check':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
      );
    case 'chart':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18M7 13l3 3 7-7"/></svg>
      );
    case 'cog':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l.7 2.154a1 1 0 00.95.69h2.262a1 1 0 01.592 1.806l-1.833 1.333a1 1 0 00-.364 1.118l.7 2.154c.3.921-.755 1.688-1.54 1.118l-1.833-1.333a1 1 0 00-1.175 0l-1.833 1.333c-.784.57-1.838-.197-1.539-1.118l.7-2.154a1 1 0 00-.364-1.118L6.432 7.577A1 1 0 016.132 5.77h2.262a1 1 0 00.95-.69l.7-2.154z"/></svg>
      );
    case 'task':
      return (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      );
    default:
      return null;
  }
}



