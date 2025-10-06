'use client';

type Props = { className?: string };

export default function UpsellBanner({ className = '' }: Props) {
  const portal = process.env.NEXT_PUBLIC_BILLING_PORTAL_URL || '/dashboard/settings';
  return (
    <div className={`rounded-xl border border-yellow-200 bg-yellow-50 p-4 ${className}`}>
        <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-yellow-800">Unlock Premium</p>
          <p className="text-sm text-yellow-800/90">Get full analytics, priority validation tools, and more.</p>
        </div>
        <a href={portal} className="btn btn-primary btn-sm" aria-label="Manage subscription in billing portal">Manage</a>
      </div>
    </div>
  );
}


