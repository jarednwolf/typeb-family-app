'use client';

import Link from 'next/link';
import React from 'react';

type PrimaryAction = {
  href: string;
  label: string;
  analyticsId?: string;
};

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  primaryAction?: PrimaryAction;
  right?: React.ReactNode;
};

export default function PageHeader({ title, subtitle, primaryAction, right }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {right}
        {primaryAction && (
          <Link
            href={primaryAction.href}
            data-analytics={primaryAction.analyticsId}
            className="btn btn-primary transition hidden sm:inline-flex"
          >
            {primaryAction.label}
          </Link>
        )}
      </div>
    </div>
  );
}


