import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Loading } from '../../src/components/ui/Loading';
import { Button } from '../../src/components/ui/Button';
import {
  getPendingRequestsForMentor, respondToMatch, subscribePendingRequests,
} from '../../src/services/matchService';
import { getUser } from '../../src/services/userService';
import { useAuth } from '../../src/hooks/useAuth';
import type { Match, User } from '../../src/types';

type RequestItem = { match: Match; apprentice: User };

export default function SolicitacoesScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  async function enrich(matches: Match[]): Promise<RequestItem[]> {
    const enriched = await Promise.all(
      matches.map(async (m) => {
        const apprentice = await getUser(m.apprenticeId);
        return apprentice ? { match: m, apprentice } : null;
      })
    );
    return enriched.filter(Boolean) as RequestItem[];
  }

  async function load() {
    if (!user) return;
    try {
      const matches = await getPendingRequestsForMentor(user.id);
      setItems(await enrich(matches));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (!user) return;
    load();
    const unsub = subscribePendingRequests(user.id, async (matches) => {
      setItems(await enrich(matches));
    });
    return unsub;
  }, [user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [user]);

  async function handleRespond(matchId: string, accept: boolean) {
    setActing(matchId);
    try {
      await respondToMatch(matchId, accept);
      setItems((prev) => prev.filter((i) => i.match.id !== matchId));
      Alert.alert(accept ? 'Conexão aceita!' : 'Solicitação recusada', '');
    } catch {
      Alert.alert('Erro', 'Não foi possível processar a solicitação.');
    } finally {
      setActing(null);
    }
  }

  if (loading) return <Loading fullScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Solicitações</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.match.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        renderItem={({ item }) => {
          const { match, apprentice } = item;
          const initials = apprentice.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
          const isActing = acting === match.id;
          return (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                {apprentice.photoURL ? (
                  <Image source={{ uri: apprentice.photoURL }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.initials}>{initials}</Text>
                  </View>
                )}
                <View style={styles.info}>
                  <Text style={styles.name}>{apprentice.name}</Text>
                  {apprentice.area && <Text style={styles.area}>{apprentice.area}</Text>}
                  {apprentice.bio && (
                    <Text style={styles.bio} numberOfLines={2}>{apprentice.bio}</Text>
                  )}
                </View>
              </View>
              {apprentice.interests.length > 0 && (
                <View style={styles.tags}>
                  {apprentice.interests.slice(0, 3).map((i) => (
                    <View key={i} style={styles.tag}>
                      <Text style={styles.tagText}>{i}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.actions}>
                <Button
                  title="Recusar"
                  variant="outline"
                  size="sm"
                  onPress={() => handleRespond(match.id, false)}
                  loading={isActing}
                  disabled={isActing}
                  style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                  title="Aceitar"
                  size="sm"
                  onPress={() => handleRespond(match.id, true)}
                  loading={isActing}
                  disabled={isActing}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Nenhuma solicitação</Text>
            <Text style={styles.emptyDesc}>Novas solicitações de conexão aparecerão aqui.</Text>
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
    padding: 16,
    marginBottom: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  avatar: { width: 52, height: 52, borderRadius: 26, marginRight: 14 },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  initials: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  area: { fontSize: 12, color: Colors.primary, marginTop: 2 },
  bio: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  tag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: { fontSize: 12, color: Colors.primary },
  actions: { flexDirection: 'row' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginTop: 16 },
  emptyDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
});
