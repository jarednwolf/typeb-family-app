'use client';

import Link from 'next/link';

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  cta?: { href: string; label: string };
  helpHref?: string;
};

export default function EmptyState({ title, description, icon, cta, helpHref }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-xl p-12 text-center shadow-sm">
      <div className="mb-4 flex items-center justify-center">
        {icon || (
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h10" />
          </svg>
        )}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-gray-600 mb-4">{description}</p>}
      {cta && (
        <Link href={cta.href} className="inline-flex items-center btn btn-primary px-4 transition">
          {cta.label}
        </Link>
      )}
      {helpHref && (
        <div className="mt-3">
          <a href={helpHref} className="text-sm text-gray-600 hover:underline">Need help? Visit the Help Center</a>
        </div>
      )}
    </div>
  );
}


