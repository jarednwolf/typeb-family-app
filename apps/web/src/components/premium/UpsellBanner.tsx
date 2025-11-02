'use client';

import { useState, useCallback } from 'react';
import UpgradeModal from '@/components/premium/UpgradeModal';

type Props = { className?: string };

export default function UpsellBanner({ className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  return (
    <div className={`rounded-xl border border-yellow-200 bg-yellow-50 p-4 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-yellow-800">Unlock Premium</p>
          <p className="text-sm text-yellow-800/90">Get full analytics, priority validation tools, and more.</p>
        </div>
        <button onClick={openModal} className="btn btn-primary btn-sm" aria-label="Open upgrade modal">Upgrade</button>
      </div>
      <UpgradeModal open={open} onClose={closeModal} />
    </div>
  );
}


