import {
  collection,
  doc,
  addDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { LearningPath, Lesson, Progress } from '../types';

export async function getLearningPaths(): Promise<LearningPath[]> {
  const snap = await getDocs(
    query(collection(db, 'learning_paths'), where('active', '==', true))
  );
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    createdAt: d.data().createdAt?.toDate() ?? new Date(),
  })) as LearningPath[];
}

export async function getLessons(learningPathId: string): Promise<Lesson[]> {
  const snap = await getDocs(
    query(
      collection(db, 'lessons'),
      where('learningPathId', '==', learningPathId),
      where('active', '==', true),
      orderBy('order', 'asc')
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Lesson[];
}

export async function getUserProgress(userId: string, learningPathId: string): Promise<Progress[]> {
  const snap = await getDocs(
    query(
      collection(db, 'progress'),
      where('userId', '==', userId),
      where('learningPathId', '==', learningPathId)
    )
  );
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
    completedAt: d.data().completedAt?.toDate(),
  })) as Progress[];
}

export async function markLessonCompleted(userId: string, learningPathId: string, lessonId: string) {
  const progressId = `${userId}_${lessonId}`;
  await setDoc(doc(db, 'progress', progressId), {
    userId,
    learningPathId,
    lessonId,
    completed: true,
    completedAt: serverTimestamp(),
  });
}

export async function seedLearningContent() {
  const existing = await getDocs(collection(db, 'learning_paths'));
  if (!existing.empty) return;

  const pathRef = await addDoc(collection(db, 'learning_paths'), {
    title: 'Comunicação Profissional',
    description: 'Desenvolva habilidades essenciais de comunicação para o ambiente de trabalho.',
    active: true,
    createdAt: serverTimestamp(),
  });

  const lessons = [
    { title: 'Escuta ativa', description: 'Aprenda a ouvir de forma eficaz e empática.', order: 1 },
    { title: 'Comunicação assertiva', description: 'Expresse suas ideias com clareza e respeito.', order: 2 },
    { title: 'Linguagem corporal', description: 'Entenda o impacto da comunicação não-verbal.', order: 3 },
    { title: 'Feedback construtivo', description: 'Como dar e receber feedback de forma produtiva.', order: 4 },
    { title: 'Comunicação em reuniões', description: 'Participe e conduza reuniões com eficiência.', order: 5 },
  ];

  for (const lesson of lessons) {
    await addDoc(collection(db, 'lessons'), {
      learningPathId: pathRef.id,
      ...lesson,
      active: true,
    });
  }
}
