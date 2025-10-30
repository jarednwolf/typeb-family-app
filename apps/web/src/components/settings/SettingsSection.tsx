'use client';

import React from 'react';

type Props = {
  title?: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
};

export default function SettingsSection({ title, subtitle, className = '', children }: Props) {
  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm space-y-4 ${className}`}>
      {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
      {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      {children}
    </div>
  );
}


