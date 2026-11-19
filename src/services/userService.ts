import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import type { User } from '../types';

export async function getUser(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    ...data,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
  } as User;
}

export async function updateUser(uid: string, fields: Partial<Omit<User, 'id' | 'email' | 'role' | 'createdAt'>>) {
  await updateDoc(doc(db, 'users', uid), {
    ...fields,
    updatedAt: serverTimestamp(),
  });
}

export async function getMentors(interestFilter?: string): Promise<User[]> {
  let q = query(
    collection(db, 'users'),
    where('role', '==', 'MENTOR'),
    where('status', '==', 'ACTIVE')
  );

  const snap = await getDocs(q);
  const mentors = snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate() ?? new Date(),
    updatedAt: d.data().updatedAt?.toDate() ?? new Date(),
  })) as User[];

  if (interestFilter) {
    return mentors.filter((m) =>
      m.interests.some((i) =>
        i.toLowerCase().includes(interestFilter.toLowerCase())
      )
    );
  }

  return mentors;
}

export async function uploadProfilePhoto(uid: string, uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(storage, `profiles/${uid}/photo.jpg`);
  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);
  await updateDoc(doc(db, 'users', uid), { photoURL: url, updatedAt: serverTimestamp() });
  return url;
}

export async function blockUser(reporterId: string, reportedUserId: string, reason: string) {
  const { addDoc, collection: col } = await import('firebase/firestore');
  await addDoc(col(db, 'reports'), {
    reporterId,
    reportedUserId,
    reason,
    status: 'OPEN',
    createdAt: serverTimestamp(),
  });
}
