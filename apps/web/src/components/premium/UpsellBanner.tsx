'use client';

type Props = { className?: string };

export default function UpsellBanner({ className = '' }: Props) {
  const handleManage = async () => {
    const { openBillingPortal } = await import('@/services/billing');
    openBillingPortal();
  };
  return (
    <div
      className={`rounded-xl p-4 ${className}`}
      style={{
        backgroundColor: 'rgba(255, 149, 0, 0.10)', // subtle warning background
        border: '1px solid rgba(255, 149, 0, 0.30)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium" style={{ color: 'var(--color-warning)' }}>Unlock Premium</p>
          <p className="text-sm" style={{ color: 'var(--color-warning)' }}>Get full analytics, priority validation tools, and more.</p>
        </div>
        <button onClick={handleManage} className="btn btn-primary btn-sm" aria-label="Manage subscription in billing portal">Manage</button>
      </div>
    </div>
  );
}


