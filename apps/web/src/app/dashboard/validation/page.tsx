'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { analytics } from '@/services/analytics';
import { db } from '@/lib/firebase/config';

interface Submission { id: string; taskId: string; submittedAt: string; status: 'pending'|'approved'|'rejected'; }

export default function ValidationQueuePage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const q = query(collection(db, 'task_submissions'), where('status', '==', 'pending'));
      const snap = await getDocs(q);
      setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Submission[]);
    })();
  }, []);

  const mark = async (id: string, status: 'approved'|'rejected', notes?: string) => {
    await updateDoc(doc(db, 'task_submissions', id), { status, reviewedAt: new Date().toISOString(), validationNotes: notes || '' });
    analytics.trackEvent({ name: `validation_${status}`, category: 'validation', label: id });
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const markSelected = async (status: 'approved'|'rejected', notes?: string) => {
    const ids = Object.keys(selected).filter(k => selected[k]);
    await Promise.all(ids.map(id => updateDoc(doc(db, 'task_submissions', id), { status, reviewedAt: new Date().toISOString(), validationNotes: notes || '' })));
    analytics.trackEvent({ name: `validation_bulk_${status}`, category: 'validation', parameters: { count: ids.length } });
    setItems(prev => prev.filter(i => !selected[i.id]));
    setSelected({});
  };

  return (
    <div className="space-y-6 section-y">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Photo Validation</h1>
        <p className="text-gray-600 mt-1">Approve or reject submitted task photos.</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        {items.length === 0 ? (
          <div className="text-center text-gray-600 p-8">
            <div className="mb-3 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            No pending submissions.
            <div className="mt-2"><a href="/help" className="text-sm hover:underline">Learn how photo validation works</a></div>
          </div>
        ) : (
          <>
          <div className="flex justify-end gap-2 mb-3">
            <button onClick={()=>{ const n = prompt('Add notes (optional)'); markSelected('approved', n || undefined); }} className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">Approve selected</button>
            <button onClick={()=>{ const n = prompt('Add notes (optional)'); markSelected('rejected', n || undefined); }} className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">Reject selected</button>
          </div>
          <ul className="divide-y">
            {items.map(i => (
              <li key={i.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={!!selected[i.id]} onChange={(e)=>setSelected(prev=>({ ...prev, [i.id]: e.target.checked }))} />
                  <p className="font-medium text-gray-900">Task {i.taskId}</p>
                  <p className="text-sm text-gray-500" title={new Date(i.submittedAt).toLocaleString()}>
                    Submitted {new Date(i.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>{ const n = prompt('Add notes (optional)'); mark(i.id,'approved', n || undefined); }} className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">Approve</button>
                  <button onClick={()=>{ const n = prompt('Add notes (optional)'); mark(i.id,'rejected', n || undefined); }} className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">Reject</button>
                </div>
              </li>
            ))}
          </ul>
          </>
        )}
      </div>
    </div>
  );
}


