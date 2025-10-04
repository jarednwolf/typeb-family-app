'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User } from '@typeb/types';
import { authAdapter } from '@/lib/firebase/auth-adapter';

export default function FamilyPage() {
  const [members, setMembers] = useState<User[]>([]);
  const [inviteCode, setInviteCode] = useState('');

  useEffect(() => {
    (async () => {
      const current = await authAdapter.getCurrentUser();
      if (current?.familyId) {
        // Members
        const membersQuery = query(collection(db, 'users'), where('familyId', '==', current.familyId));
        const snapshot = await getDocs(membersQuery);
        setMembers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User)));
        // Invite code placeholder (in a real app this would come from family doc)
        setInviteCode(current.familyId.slice(0, 6).toUpperCase());
      }
    })();
  }, []);

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      alert('Invite code copied');
    } catch {}
  };

  return (
    <div className="space-y-6 section-y">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Family</h1>
        <p className="text-gray-600 mt-1">View members and manage invites.</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Invite code</h2>
        <div className="mt-2 flex items-center gap-3">
          <code className="px-3 py-1 rounded bg-gray-100 text-gray-800">{inviteCode || '------'}</code>
          <button onClick={copyInvite} className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50">Copy</button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Members</h2>
        <ul className="mt-4 divide-y">
          {members.map(m => (
            <li key={m.id} className="py-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{m.displayName}</p>
                <p className="text-sm text-gray-500">{m.email}</p>
              </div>
              <span className="text-sm text-gray-600 capitalize">{m.role}</span>
            </li>
          ))}
          {members.length === 0 && (
            <li className="py-6 text-gray-600">No members found.</li>
          )}
        </ul>
      </div>
    </div>
  );
}


