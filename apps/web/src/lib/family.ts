import { collection, addDoc, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase/config';
import { DEFAULT_TASK_CATEGORIES, Family, User } from '@typeb/types';

export async function createFamilyForUser(user: User): Promise<string> {
  const family: Omit<Family, 'id'> = {
    name: `${user.displayName?.split(' ')[0] || 'Family'} Family`,
    inviteCode: '',
    createdBy: user.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    memberIds: [user.id],
    parentIds: [user.id],
    childIds: [],
    maxMembers: 10,
    isPremium: false,
    taskCategories: DEFAULT_TASK_CATEGORIES,
  };

  const ref = await addDoc(collection(db, 'families'), family as any);
  const code = ref.id.slice(0, 6).toUpperCase();
  await updateDoc(doc(db, 'families', ref.id), { inviteCode: code, updatedAt: new Date() });
  await updateDoc(doc(db, 'users', user.id), { familyId: ref.id, role: 'parent', updatedAt: new Date() });
  return ref.id;
}

export async function joinFamilyByInviteCode(user: User, code: string): Promise<string | null> {
  const q = query(collection(db, 'families'), where('inviteCode', '==', code.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const famId = snap.docs[0].id;
  await updateDoc(doc(db, 'users', user.id), { familyId: famId, role: user.role || 'child', updatedAt: new Date() });
  return famId;
}


