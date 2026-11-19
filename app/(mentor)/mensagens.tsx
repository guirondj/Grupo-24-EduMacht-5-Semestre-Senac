import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Loading } from '../../src/components/ui/Loading';
import { getConversationsForUser } from '../../src/services/chatService';
import { getUser } from '../../src/services/userService';
import { useAuth } from '../../src/hooks/useAuth';
import type { Conversation, User } from '../../src/types';

type ConvItem = { conv: Conversation; other: User };

export default function MensagensMentorScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ConvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!user) return;
    try {
      const convs = await getConversationsForUser(user.id);
      const enriched = await Promise.all(
        convs.map(async (c) => {
          const otherId = c.participantIds.find((id) => id !== user.id);
          if (!otherId) return null;
          const other = await getUser(otherId);
          return other ? { conv: c, other } : null;
        })
      );
      setItems(enriched.filter(Boolean) as ConvItem[]);
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
        <Text style={styles.title}>Mensagens</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.conv.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        renderItem={({ item }) => {
          const { conv, other } = item;
          const initials = other.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(`/(mentor)/mensagens/${conv.id}`)}
              activeOpacity={0.85}
            >
              {other.photoURL ? (
                <Image source={{ uri: other.photoURL }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.initials}>{initials}</Text>
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.name}>{other.name}</Text>
                {conv.lastMessage && (
                  <Text style={styles.last} numberOfLines={1}>{conv.lastMessage}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Nenhuma conversa</Text>
            <Text style={styles.emptyDesc}>Aceite solicitações para começar a conversar com aprendizes.</Text>
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
  list: { paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 14 },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  initials: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  last: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginTop: 16 },
  emptyDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 6, textAlign: 'center', paddingHorizontal: 32 },
});
