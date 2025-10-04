'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface Submission { id: string; taskId: string; submittedAt: string; status: 'pending'|'approved'|'rejected'; }

export default function ValidationQueuePage() {
  const [items, setItems] = useState<Submission[]>([]);

  useEffect(() => {
    (async () => {
      const q = query(collection(db, 'task_submissions'), where('status', '==', 'pending'));
      const snap = await getDocs(q);
      setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Submission[]);
    })();
  }, []);

  const mark = async (id: string, status: 'approved'|'rejected') => {
    await updateDoc(doc(db, 'task_submissions', id), { status, reviewedAt: new Date().toISOString() });
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-6 section-y">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Photo Validation</h1>
        <p className="text-gray-600 mt-1">Approve or reject submitted task photos.</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        {items.length === 0 ? (
          <div className="text-gray-600">No pending submissions.</div>
        ) : (
          <ul className="divide-y">
            {items.map(i => (
              <li key={i.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Task {i.taskId}</p>
                  <p className="text-sm text-gray-500">Submitted {new Date(i.submittedAt).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>mark(i.id,'approved')} className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">Approve</button>
                  <button onClick={()=>mark(i.id,'rejected')} className="px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">Reject</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


