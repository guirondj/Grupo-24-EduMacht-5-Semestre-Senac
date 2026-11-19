import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../src/constants/colors';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { profileSchema, type ProfileFormData } from '../../src/utils/validators';
import { updateUser, uploadProfilePhoto } from '../../src/services/userService';
import { logoutUser } from '../../src/services/authService';
import { useAuth } from '../../src/hooks/useAuth';
import { INTERESTS, SKILLS, AREAS } from '../../src/constants/config';

export default function PerfilAprendizScreen() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      bio: user?.bio ?? '',
      area: user?.area ?? '',
      interests: user?.interests ?? [],
      skills: user?.skills ?? [],
    },
  });

  async function handlePhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria nas configurações.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !user) return;
    setUploading(true);
    try {
      await uploadProfilePhoto(user.id, result.assets[0].uri);
      await refreshUser();
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar a foto.');
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(data: ProfileFormData) {
    if (!user) return;
    setSaving(true);
    try {
      await updateUser(user.id, { ...data, updatedAt: new Date() });
      await refreshUser();
      Alert.alert('Sucesso', 'Perfil atualizado.');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o perfil.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Sair', 'Deseja encerrar a sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair', style: 'destructive', onPress: async () => {
          await logoutUser();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  const initials = user?.name?.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase() ?? '?';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={handlePhoto} disabled={uploading}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.initials}>{initials}</Text>
            </View>
          )}
          <View style={styles.cameraBtn}>
            <Ionicons name={uploading ? 'hourglass-outline' : 'camera'} size={16} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.role}>Aprendiz</Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, value } }) => (
            <Input label="Nome completo" leftIcon="person-outline" onChangeText={onChange} value={value} error={errors.name?.message} />
          )}
        />
        <Controller
          control={control}
          name="bio"
          render={({ field: { onChange, value } }) => (
            <Input label="Bio (opcional)" leftIcon="text-outline" onChangeText={onChange} value={value ?? ''} error={errors.bio?.message} multiline />
          )}
        />
        <Controller
          control={control}
          name="area"
          render={({ field: { onChange, value } }) => (
            <View style={styles.selectorGroup}>
              <Text style={styles.selectorLabel}>Área de interesse</Text>
              <View style={styles.chips}>
                {AREAS.map((a) => (
                  <TouchableOpacity
                    key={a}
                    style={[styles.chip, value === a && styles.chipActive]}
                    onPress={() => onChange(value === a ? '' : a)}
                  >
                    <Text style={[styles.chipText, value === a && styles.chipTextActive]}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        />
        <Controller
          control={control}
          name="interests"
          render={({ field: { onChange, value } }) => (
            <View style={styles.selectorGroup}>
              <Text style={styles.selectorLabel}>Interesses (máx. 5)</Text>
              <View style={styles.chips}>
                {INTERESTS.map((i) => {
                  const sel = (value ?? []).includes(i);
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.chip, sel && styles.chipActive]}
                      onPress={() => {
                        if (sel) onChange((value ?? []).filter((v) => v !== i));
                        else if ((value ?? []).length < 5) onChange([...(value ?? []), i]);
                      }}
                    >
                      <Text style={[styles.chipText, sel && styles.chipTextActive]}>{i}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        />
        <Controller
          control={control}
          name="skills"
          render={({ field: { onChange, value } }) => (
            <View style={styles.selectorGroup}>
              <Text style={styles.selectorLabel}>Competências que quer desenvolver</Text>
              <View style={styles.chips}>
                {SKILLS.map((s) => {
                  const sel = (value ?? []).includes(s);
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.chip, sel && styles.chipActive]}
                      onPress={() => {
                        if (sel) onChange((value ?? []).filter((v) => v !== s));
                        else onChange([...(value ?? []), s]);
                      }}
                    >
                      <Text style={[styles.chipText, sel && styles.chipTextActive]}>{s}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        />

        <Button title="Salvar perfil" onPress={handleSubmit(onSubmit)} loading={saving} style={{ marginTop: 8 }} />
        <Button title="Sair da conta" onPress={handleLogout} variant="outline" style={{ marginTop: 10 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  container: { paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 28, fontWeight: '700', color: Colors.primary },
  cameraBtn: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  role: { fontSize: 13, color: Colors.textSecondary, marginTop: 10 },
  form: { paddingHorizontal: 20 },
  selectorGroup: { marginBottom: 16 },
  selectorLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: '600' },
});
