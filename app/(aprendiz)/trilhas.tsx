import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Loading } from '../../src/components/ui/Loading';
import {
  getLearningPaths, getLessons, getUserProgress, markLessonCompleted, seedLearningContent,
} from '../../src/services/learningService';
import { useAuth } from '../../src/hooks/useAuth';
import type { LearningPath, Lesson, Progress } from '../../src/types';

type PathWithLessons = LearningPath & { lessons: Lesson[]; progress: Progress[] };

export default function TrilhasScreen() {
  const { user } = useAuth();
  const [paths, setPaths] = useState<PathWithLessons[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [completing, setCompleting] = useState<string | null>(null);

  async function load() {
    if (!user) return;
    try {
      await seedLearningContent();
      const rawPaths = await getLearningPaths();
      const enriched = await Promise.all(
        rawPaths.map(async (p) => {
          const [lessons, progress] = await Promise.all([
            getLessons(p.id),
            getUserProgress(user.id, p.id),
          ]);
          return { ...p, lessons, progress };
        })
      );
      setPaths(enriched);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [user]);

  async function handleComplete(pathId: string, lessonId: string) {
    if (!user) return;
    setCompleting(lessonId);
    try {
      await markLessonCompleted(user.id, pathId, lessonId);
      setPaths((prev) =>
        prev.map((p) => {
          if (p.id !== pathId) return p;
          const alreadyHas = p.progress.some((pr) => pr.lessonId === lessonId);
          if (alreadyHas) return p;
          return {
            ...p,
            progress: [...p.progress, {
              id: `${user.id}_${lessonId}`,
              userId: user.id,
              learningPathId: pathId,
              lessonId,
              completed: true,
              completedAt: new Date(),
            }],
          };
        })
      );
    } finally {
      setCompleting(null);
    }
  }

  if (loading) return <Loading fullScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trilhas de Aprendizagem</Text>
      </View>

      <FlatList
        data={paths}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        renderItem={({ item: path }) => {
          const done = path.lessons.filter((l) =>
            path.progress.some((pr) => pr.lessonId === l.id && pr.completed)
          ).length;
          const total = path.lessons.length;
          const pct = total > 0 ? done / total : 0;
          const open = expanded === path.id;

          return (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => setExpanded(open ? null : path.id)}
                activeOpacity={0.85}
              >
                <View style={styles.cardIconWrap}>
                  <Ionicons name="book-outline" size={24} color={Colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.pathTitle}>{path.title}</Text>
                  <Text style={styles.pathDesc} numberOfLines={2}>{path.description}</Text>
                  <View style={styles.progressRow}>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${pct * 100}%` as any }]} />
                    </View>
                    <Text style={styles.progressLabel}>{done}/{total}</Text>
                  </View>
                </View>
                <Ionicons
                  name={open ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>

              {open && (
                <View style={styles.lessonList}>
                  {path.lessons.map((lesson) => {
                    const completed = path.progress.some((pr) => pr.lessonId === lesson.id && pr.completed);
                    return (
                      <TouchableOpacity
                        key={lesson.id}
                        style={styles.lessonRow}
                        onPress={() => !completed && handleComplete(path.id, lesson.id)}
                        disabled={completed || completing === lesson.id}
                        activeOpacity={completed ? 1 : 0.7}
                      >
                        <Ionicons
                          name={completed ? 'checkmark-circle' : 'ellipse-outline'}
                          size={20}
                          color={completed ? Colors.success : Colors.textMuted}
                          style={{ marginRight: 10 }}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.lessonTitle, completed && styles.lessonDone]}>
                            {lesson.title}
                          </Text>
                          <Text style={styles.lessonDesc} numberOfLines={2}>{lesson.description}</Text>
                        </View>
                        {!completed && (
                          <Text style={styles.markBtn}>
                            {completing === lesson.id ? '...' : 'Concluir'}
                          </Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Nenhuma trilha disponível.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  list: { padding: 20, paddingBottom: 24 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 16 },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: { flex: 1, marginRight: 8 },
  pathTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  pathDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, lineHeight: 18 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.primaryLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  progressLabel: { fontSize: 11, color: Colors.textSecondary, minWidth: 28, textAlign: 'right' },
  lessonList: { borderTopWidth: 1, borderTopColor: Colors.border },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    paddingLeft: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lessonTitle: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  lessonDone: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  lessonDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  markBtn: { fontSize: 12, color: Colors.primary, fontWeight: '600', marginLeft: 8, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: Colors.textSecondary, marginTop: 12, fontSize: 14 },
});
