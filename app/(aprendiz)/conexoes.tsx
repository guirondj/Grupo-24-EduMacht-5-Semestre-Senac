import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Loading } from '../../src/components/ui/Loading';
import { getAcceptedMatchesForUser } from '../../src/services/matchService';
import { getUser } from '../../src/services/userService';
import { useAuth } from '../../src/hooks/useAuth';
import type { User, Match } from '../../src/types';

type ConnectionItem = { match: Match; mentor: User };

export default function ConexoesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ConnectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!user) return;
    try {
      const matches = await getAcceptedMatchesForUser(user.id);
      const enriched = await Promise.all(
        matches.map(async (m) => {
          const mentor = await getUser(m.mentorId);
          return mentor ? { match: m, mentor } : null;
        })
      );
      setItems(enriched.filter(Boolean) as ConnectionItem[]);
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

  if (loading) return <Loading fullScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Minhas Conexões</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.match.id}
        renderItem={({ item }) => {
          const { mentor, match } = item;
          const initials = mentor.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(aprendiz)/mensagens/${match.id}`)}
              activeOpacity={0.85}
            >
              {mentor.photoURL ? (
                <Image source={{ uri: mentor.photoURL }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.initials}>{initials}</Text>
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.name}>{mentor.name}</Text>
                {mentor.area && <Text style={styles.area}>{mentor.area}</Text>}
                {mentor.bio && (
                  <Text style={styles.bio} numberOfLines={2}>{mentor.bio}</Text>
                )}
              </View>
              <View style={styles.chatBtn}>
                <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
              </View>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="link-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Nenhuma conexão ainda</Text>
            <Text style={styles.emptyDesc}>Encontre um mentor e solicite uma conexão.</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
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
  chatBtn: { padding: 8 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginTop: 16 },
  emptyDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
});
