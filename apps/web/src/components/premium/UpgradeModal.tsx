'use client';

import Modal from '@/components/ui/Modal';
import { useCallback } from 'react';

type UpgradeModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  const handleUpgrade = useCallback(async () => {
    try {
      const { openBillingPortal } = await import('@/services/billing');
      openBillingPortal();
      onClose();
    } catch {}
  }, [onClose]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upgrade to Premium"
      footer={(
        <div className="flex items-center justify-end gap-2">
          <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Cancel upgrade">
            Not now
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleUpgrade} aria-label="Open billing portal to upgrade">
            Upgrade
          </button>
        </div>
      )}
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-700">Unlock premium features for your whole family:</p>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
          <li>Advanced analytics</li>
          <li>Priority validation tools</li>
          <li>Family-wide subscription benefits</li>
        </ul>
        <p className="text-xs text-gray-500">Manage or cancel anytime in your billing portal.</p>
      </div>
    </Modal>
  );
}


