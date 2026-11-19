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
import type { Match, User } from '../../src/types';

type ConnectionItem = { match: Match; apprentice: User };

export default function AprendizesScreen() {
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
          const apprentice = await getUser(m.apprenticeId);
          return apprentice ? { match: m, apprentice } : null;
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
        <Text style={styles.title}>Meus Aprendizes</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.match.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        renderItem={({ item }) => {
          const { match, apprentice } = item;
          const initials = apprentice.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(mentor)/mensagens/${match.id}`)}
              activeOpacity={0.85}
            >
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
                {apprentice.interests.length > 0 && (
                  <Text style={styles.interests} numberOfLines={1}>
                    {apprentice.interests.slice(0, 3).join(' · ')}
                  </Text>
                )}
              </View>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Nenhum aprendiz</Text>
            <Text style={styles.emptyDesc}>Aceite solicitações de conexão para ver seus aprendizes aqui.</Text>
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
    padding: 14,
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
  interests: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginTop: 16 },
  emptyDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
});
