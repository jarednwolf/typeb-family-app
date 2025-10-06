'use client';

import Link from 'next/link';

type Props = { familyHasMembers: boolean };

export default function OnboardingChecklist({ familyHasMembers }: Props) {
  const items = [
    { done: true, label: 'Create your account' },
    { done: familyHasMembers, label: 'Invite a family member', href: '/dashboard/family' },
    { done: false, label: 'Create your first task', href: '/dashboard/tasks/new' },
    { done: false, label: 'Try quick-create from Tasks', href: '/dashboard/tasks' },
  ];
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-3" aria-live="polite">Getting started</h2>
      <ul className="space-y-2">
        {items.map((it, idx) => (
          <li key={idx} className="flex items-center justify-between" aria-checked={it.done} role="checkbox">
            <div className="flex items-center gap-3">
              <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${it.done ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300 text-gray-400'}`}>{it.done ? '✓' : ''}</span>
              <span className={`text-sm ${it.done ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{it.label}</span>
            </div>
            {!it.done && it.href && (
              <Link href={it.href} className="text-sm text-black hover:underline">Go</Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}


