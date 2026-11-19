import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Conversation, Message } from '../types';

function toConversation(d: any): Conversation {
  const data = d.data();
  return {
    id: d.id,
    participantIds: data.participantIds ?? [],
    matchId: data.matchId,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    lastMessage: data.lastMessage ?? '',
    lastMessageAt: data.lastMessageAt?.toDate(),
  };
}

export async function getConversationsForUser(userId: string): Promise<Conversation[]> {
  const snap = await getDocs(
    query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', userId)
    )
  );
  return snap.docs.map(toConversation);
}

export async function getConversationByMatch(matchId: string): Promise<Conversation | null> {
  const snap = await getDocs(
    query(collection(db, 'conversations'), where('matchId', '==', matchId))
  );
  if (snap.empty) return null;
  return toConversation(snap.docs[0]);
}

export async function ensureConversation(matchId: string, participantIds: string[]): Promise<string> {
  const existing = await getConversationByMatch(matchId);
  if (existing) {
    // Update participantIds if empty
    if (existing.participantIds.length === 0) {
      await updateDoc(doc(db, 'conversations', existing.id), { participantIds });
    }
    return existing.id;
  }
  const ref = await addDoc(collection(db, 'conversations'), {
    participantIds,
    matchId,
    createdAt: serverTimestamp(),
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
  });
  return ref.id;
}

export async function sendMessage(conversationId: string, senderId: string, content: string) {
  const trimmed = content.trim();
  if (!trimmed) throw new Error('Mensagem não pode ser vazia.');

  const msgRef = await addDoc(
    collection(db, 'conversations', conversationId, 'messages'),
    {
      senderId,
      content: trimmed,
      createdAt: serverTimestamp(),
      read: false,
    }
  );

  await updateDoc(doc(db, 'conversations', conversationId), {
    lastMessage: trimmed,
    lastMessageAt: serverTimestamp(),
  });

  return msgRef.id;
}

export function subscribeMessages(
  conversationId: string,
  cb: (messages: Message[]) => void
) {
  return onSnapshot(
    query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc')
    ),
    (snap) => {
      const msgs: Message[] = snap.docs.map((d) => ({
        id: d.id,
        senderId: d.data().senderId,
        content: d.data().content,
        createdAt: d.data().createdAt?.toDate() ?? new Date(),
        read: d.data().read ?? false,
      }));
      cb(msgs);
    }
  );
}

export function subscribeConversations(userId: string, cb: (convs: Conversation[]) => void) {
  return onSnapshot(
    query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', userId)
    ),
    (snap) => cb(snap.docs.map(toConversation))
  );
}
