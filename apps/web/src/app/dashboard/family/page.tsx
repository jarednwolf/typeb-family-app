'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User } from '@typeb/types';
import { authAdapter } from '@/lib/firebase/auth-adapter';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';

export default function FamilyPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');

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
      <PageHeader title="Family" subtitle="View members and manage invites." />

      {/* Invite Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Invite</h2>
        <p className="text-sm text-gray-600 mt-1">Share this code or link to invite a family member. Codes rotate periodically.</p>
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-900">
            <span className="font-mono tracking-widest">{inviteCode || '------'}</span>
          </div>
          <button onClick={copyInvite} className="btn btn-secondary btn-sm">Copy code</button>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <input value={inviteLink} readOnly className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50" />
          <button onClick={copyLink} className="btn btn-secondary btn-sm whitespace-nowrap">Copy link</button>
        </div>
      </div>

      {/* Members */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Members</h2>
        {members.length === 0 ? (
          <div className="mt-4">
            <EmptyState title="No members found" description="Invite your first family member to get started." />
          </div>
        ) : (
          <div className="mt-4 overflow-auto">
            <table className="min-w-full text-left">
              <thead className="text-xs uppercase text-gray-500">
                <tr>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {members.map(m => (
                  <tr key={m.id} className="align-middle">
                    <td className="py-3 pr-4 font-medium text-gray-900">{m.displayName}</td>
                    <td className="py-3 pr-4 text-gray-600">{m.email}</td>
                    <td className="py-3 pr-4 capitalize">{m.role}</td>
                    <td className="py-3 pr-4 text-right">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={async () => {
                          if (currentUser?.role !== 'parent') return;
                          const newRole = m.role === 'parent' ? 'child' : 'parent';
                          if (!confirm(`Change ${m.displayName}'s role to ${newRole}?`)) return;
                          await updateDoc(doc(db, 'users', m.id), { role: newRole, updatedAt: new Date() });
                          setMembers(prev => prev.map(x => x.id === m.id ? { ...x, role: newRole as any } : x));
                        }}
                      >Toggle role</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4">
          <button className="btn btn-secondary btn-sm" onClick={()=>setIsAddOpen(true)} aria-label="Add member by email">Add member by email</button>
        </div>
      </div>

      <Modal open={isAddOpen} onClose={()=>setIsAddOpen(false)} title="Add member by email" footer={(
        <>
          <button className="btn btn-secondary btn-sm" onClick={()=>setIsAddOpen(false)}>Cancel</button>
          <button
            className="btn btn-primary btn-sm"
            onClick={async ()=>{
              if (!newMemberEmail || !currentUser?.familyId) return;
              // Placeholder: In production, create invite doc and send email.
              alert(`Invite sent to ${newMemberEmail}`);
              setNewMemberEmail('');
              setIsAddOpen(false);
            }}
          >Send invite</button>
        </>
      )}>
        <label className="block text-sm text-gray-600 mb-1">Email</label>
        <input value={newMemberEmail} onChange={(e)=>setNewMemberEmail(e.target.value)} placeholder="name@example.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
        <p className="text-xs text-gray-500 mt-2">We’ll send an email with a join link tied to your invite code.</p>
      </Modal>
    </div>
  );
}


