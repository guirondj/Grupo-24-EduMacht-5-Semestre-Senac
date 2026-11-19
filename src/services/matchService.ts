import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Match, MatchStatus } from '../types';

function toMatch(d: any): Match {
  return {
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate() ?? new Date(),
    updatedAt: d.data().updatedAt?.toDate() ?? new Date(),
  } as Match;
}

export async function sendMatchRequest(apprenticeId: string, mentorId: string) {
  if (apprenticeId === mentorId) throw new Error('Você não pode solicitar conexão com você mesmo.');

  // Check for existing pending/accepted request
  const existing = await getDocs(
    query(
      collection(db, 'matches'),
      where('apprenticeId', '==', apprenticeId),
      where('mentorId', '==', mentorId),
      where('status', 'in', ['PENDING', 'ACCEPTED'])
    )
  );
  if (!existing.empty) throw new Error('Já existe uma solicitação em aberto ou conexão com este mentor.');

  const ref = await addDoc(collection(db, 'matches'), {
    apprenticeId,
    mentorId,
    status: 'PENDING',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function respondToMatch(matchId: string, mentorId: string, accept: boolean) {
  const newStatus: MatchStatus = accept ? 'ACCEPTED' : 'REJECTED';
  await updateDoc(doc(db, 'matches', matchId), {
    status: newStatus,
    updatedAt: serverTimestamp(),
  });

  if (accept) {
    // Create conversation
    await addDoc(collection(db, 'conversations'), {
      participantIds: [],
      matchId,
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
    });
  }
}

export async function getMatchStatus(apprenticeId: string, mentorId: string): Promise<Match | null> {
  const snap = await getDocs(
    query(
      collection(db, 'matches'),
      where('apprenticeId', '==', apprenticeId),
      where('mentorId', '==', mentorId)
    )
  );
  if (snap.empty) return null;
  return toMatch(snap.docs[0]);
}

export async function getPendingRequestsForMentor(mentorId: string): Promise<Match[]> {
  const snap = await getDocs(
    query(
      collection(db, 'matches'),
      where('mentorId', '==', mentorId),
      where('status', '==', 'PENDING')
    )
  );
  return snap.docs.map(toMatch);
}

export async function getAcceptedMatchesForUser(userId: string, role: 'APPRENTICE' | 'MENTOR'): Promise<Match[]> {
  const field = role === 'APPRENTICE' ? 'apprenticeId' : 'mentorId';
  const snap = await getDocs(
    query(
      collection(db, 'matches'),
      where(field, '==', userId),
      where('status', '==', 'ACCEPTED')
    )
  );
  return snap.docs.map(toMatch);
}

export function subscribePendingRequests(mentorId: string, cb: (matches: Match[]) => void) {
  return onSnapshot(
    query(
      collection(db, 'matches'),
      where('mentorId', '==', mentorId),
      where('status', '==', 'PENDING')
    ),
    (snap) => cb(snap.docs.map(toMatch))
  );
}
