'use client';

import Link from 'next/link';

export default function FamilyPage() {
  return (
    <div className="space-y-6 section-y">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Family</h1>
        <p className="text-gray-600 mt-1">View members and manage invites.</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm text-gray-600">
        Family management UI is coming soon.
        <div className="mt-4">
          <Link href="/dashboard" className="text-black hover:underline">Return to dashboard</Link>
        </div>
      </div>
    </div>
  );
}


