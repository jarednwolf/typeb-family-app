'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { authAdapter } from '@/lib/firebase/auth-adapter';
import { User } from '@typeb/types';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export default function QuickCreateTaskModal({ open, onClose, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [members, setMembers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const current = await authAdapter.getCurrentUser();
      if (!current?.familyId) return;
      const membersQuery = query(collection(db, 'users'), where('familyId', '==', current.familyId));
      const snapshot = await getDocs(membersQuery);
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User));
      setMembers(list);
      setAssignee(current.id);
    })();
  }, [open]);

  const createTask = async () => {
    const current = await authAdapter.getCurrentUser();
    if (!current?.familyId || !title) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'tasks'), {
        familyId: current.familyId,
        title,
        description: '',
        assignedTo: assignee || current.id,
        assignedBy: current.id,
        createdBy: current.id,
        status: 'pending',
        priority: 'medium',
        dueDate: dueDate ? new Date(dueDate) : new Date(),
        points: 10,
        requiresPhoto: false,
        isRecurring: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      onClose();
      onCreated?.();
      setTitle(''); setDueDate('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Quick Create Task" footer={(
      <>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={createTask} disabled={!title || saving}>{saving ? 'Creating…' : 'Create'}</button>
      </>
    )}>
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Title</label>
          <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="e.g., Clean the kitchen" className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Assign to</label>
            <select value={assignee} onChange={(e)=>setAssignee(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
              {members.map(m => (<option key={m.id} value={m.id}>{m.displayName}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Due date</label>
            <input type="date" value={dueDate} onChange={(e)=>setDueDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    </Modal>
  );
}


