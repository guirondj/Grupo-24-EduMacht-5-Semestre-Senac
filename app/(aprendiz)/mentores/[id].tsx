import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../src/constants/colors';
import { Button } from '../../../src/components/ui/Button';
import { Loading } from '../../../src/components/ui/Loading';
import { getUser } from '../../../src/services/userService';
import { sendMatchRequest, getMatchStatus } from '../../../src/services/matchService';
import { useAuth } from '../../../src/hooks/useAuth';
import type { User, Match } from '../../../src/types';

export default function MentorDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const [mentor, setMentor] = useState<User | null>(null);
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function load() {
      if (!id || !currentUser) return;
      const [m, s] = await Promise.all([
        getUser(id),
        getMatchStatus(currentUser.id, id),
      ]);
      setMentor(m);
      setMatch(s);
      setLoading(false);
    }
    load();
  }, [id, currentUser]);

  async function handleRequest() {
    if (!currentUser || !mentor) return;
    setSending(true);
    try {
      await sendMatchRequest(currentUser.id, mentor.id);
      setMatch({ id: '', apprenticeId: currentUser.id, mentorId: mentor.id, status: 'PENDING', createdAt: new Date(), updatedAt: new Date() });
      Alert.alert('Solicitação enviada!', `Aguarde ${mentor.name} aceitar a conexão.`);
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Não foi possível enviar a solicitação.');
    } finally {
      setSending(false);
    }
  }

  if (loading) return <Loading fullScreen />;
  if (!mentor) return (
    <View style={styles.container}>
      <Text style={styles.error}>Mentor não encontrado.</Text>
    </View>
  );

  const initials = mentor.name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();

  function renderButton() {
    if (!match) {
      return <Button title="Solicitar conexão" onPress={handleRequest} loading={sending} />;
    }
    if (match.status === 'PENDING') {
      return (
        <Button title="Solicitação enviada" onPress={() => {}} variant="outline" disabled />
      );
    }
    if (match.status === 'ACCEPTED') {
      return (
        <Button
          title="Enviar mensagem"
          onPress={() => router.push(`/(aprendiz)/mensagens/${match.id}`)}
        />
      );
    }
    return (
      <Button title="Conexão recusada" onPress={() => {}} variant="outline" disabled />
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.profileSection}>
        {mentor.photoURL ? (
          <Image source={{ uri: mentor.photoURL }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
        )}
        <Text style={styles.name}>{mentor.name}</Text>
        {mentor.area && <Text style={styles.area}>{mentor.area}</Text>}
      </View>

      {mentor.bio ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre</Text>
          <Text style={styles.bio}>{mentor.bio}</Text>
        </View>
      ) : null}

      {mentor.interests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interesses</Text>
          <View style={styles.tags}>
            {mentor.interests.map((i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{i}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {mentor.skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Competências</Text>
          <View style={styles.tags}>
            {mentor.skills.map((s) => (
              <View key={s} style={[styles.tag, styles.tagSkill]}>
                <Text style={[styles.tagText, styles.tagSkillText]}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.actionSection}>
        {renderButton()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 20, paddingTop: 56, paddingBottom: 40 },
  back: { marginBottom: 16 },
  profileSection: { alignItems: 'center', marginBottom: 28 },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 12 },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  initials: { fontSize: 32, fontWeight: '700', color: Colors.primary },
  name: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  area: { fontSize: 14, color: Colors.primary, marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 10 },
  bio: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagText: { fontSize: 13, color: Colors.primary, fontWeight: '500' },
  tagSkill: { backgroundColor: '#E8F5E9' },
  tagSkillText: { color: '#2E7D32' },
  actionSection: { marginTop: 8 },
  error: { textAlign: 'center', color: Colors.error, marginTop: 40 },
});
