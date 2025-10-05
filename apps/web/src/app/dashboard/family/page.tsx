'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User } from '@typeb/types';
import { authAdapter } from '@/lib/firebase/auth-adapter';

export default function FamilyPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    (async () => {
      const current = await authAdapter.getCurrentUser();
      setCurrentUser(current);
      if (current?.familyId) {
        // Members
        const membersQuery = query(collection(db, 'users'), where('familyId', '==', current.familyId));
        const snapshot = await getDocs(membersQuery);
        setMembers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User)));
        // Invite code/link (placeholder using familyId)
        const code = current.familyId.slice(0, 6).toUpperCase();
        setInviteCode(code);
        setInviteLink(`${window.location.origin}/signup?invite=${code}`);
      }
    })();
  }, []);

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      alert('Invite code copied');
    } catch {}
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      alert('Invite link copied');
    } catch {}
  };

  return (
    <div className="space-y-6 section-y">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Family</h1>
        <p className="text-gray-600 mt-1">View members and manage invites.</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Invite</h2>
        <div className="mt-2 flex items-center gap-3">
          <code className="px-3 py-1 rounded bg-gray-100 text-gray-800">{inviteCode || '------'}</code>
          <button onClick={copyInvite} className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50">Copy</button>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <input value={inviteLink} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50" />
          <button onClick={copyLink} className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap">Copy link</button>
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
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 capitalize">{m.role}</span>
                <button
                  className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                  onClick={async () => {
                    if (currentUser?.role !== 'parent') return;
                    const newRole = m.role === 'parent' ? 'child' : 'parent';
                    if (!confirm(`Change ${m.displayName}'s role to ${newRole}?`)) return;
                    await updateDoc(doc(db, 'users', m.id), { role: newRole, updatedAt: new Date() });
                    setMembers(prev => prev.map(x => x.id === m.id ? { ...x, role: newRole as any } : x));
                  }}
                >
                  Toggle role
                </button>
              </div>
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


