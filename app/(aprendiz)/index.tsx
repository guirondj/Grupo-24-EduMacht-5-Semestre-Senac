import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { useAuth } from '../../src/hooks/useAuth';
import { logoutUser } from '../../src/services/authService';

export default function AprendizHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const cards = [
    {
      icon: 'people-outline' as const,
      title: 'Encontrar mentores',
      desc: 'Busque profissionais por interesse',
      route: '/(aprendiz)/mentores' as const,
      color: Colors.primary,
    },
    {
      icon: 'link-outline' as const,
      title: 'Minhas conexões',
      desc: 'Veja seus mentores aprovados',
      route: '/(aprendiz)/conexoes' as const,
      color: '#10B981',
    },
    {
      icon: 'chatbubble-outline' as const,
      title: 'Mensagens',
      desc: 'Converse com seus mentores',
      route: '/(aprendiz)/mensagens' as const,
      color: '#3B82F6',
    },
    {
      icon: 'book-outline' as const,
      title: 'Trilhas de aprendizagem',
      desc: 'Desenvolva suas habilidades',
      route: '/(aprendiz)/trilhas' as const,
      color: '#F59E0B',
    },
  ];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.role}>Aprendiz</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(aprendiz)/perfil')} style={styles.avatarBtn}>
          <Ionicons name="person-circle-outline" size={40} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.banner}>
        <Ionicons name="rocket-outline" size={28} color="#fff" />
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Comece sua jornada</Text>
          <Text style={styles.bannerDesc}>Encontre um mentor e acelere seu desenvolvimento</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>O que você quer fazer?</Text>
      <View style={styles.grid}>
        {cards.map((card) => (
          <TouchableOpacity
            key={card.title}
            style={styles.card}
            onPress={() => router.push(card.route)}
            activeOpacity={0.85}
          >
            <View style={[styles.cardIcon, { backgroundColor: card.color + '15' }]}>
              <Ionicons name={card.icon} size={28} color={card.color} />
            </View>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardDesc}>{card.desc}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 20, paddingTop: 56 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  role: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  avatarBtn: {},
  banner: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 28,
  },
  bannerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  bannerDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  cardDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
});
