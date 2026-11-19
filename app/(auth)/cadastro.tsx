import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, Alert, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { registerUser } from '../../src/services/authService';
import { cadastroSchema, type CadastroFormData } from '../../src/utils/validators';
import type { UserRole } from '../../src/types';

export default function CadastroScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors }, watch } = useForm<CadastroFormData>({
    resolver: zodResolver(cadastroSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'APPRENTICE',
    },
  });

  const selectedRole = watch('role');

  async function onSubmit(data: CadastroFormData) {
    setLoading(true);
    try {
      await registerUser(data.name, data.email, data.password, data.role as UserRole);
      router.replace('/');
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'Este e-mail já está em uso.'
        : 'Erro ao cadastrar. Tente novamente.';
      Alert.alert('Erro', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.logo}>Edu Match</Text>
          <Text style={styles.subtitle}>Crie sua conta</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Tipo de perfil</Text>
          <Controller
            control={control}
            name="role"
            render={({ field: { onChange, value } }) => (
              <View style={styles.roleRow}>
                <TouchableOpacity
                  style={[styles.roleBtn, value === 'APPRENTICE' && styles.roleBtnActive]}
                  onPress={() => onChange('APPRENTICE')}
                >
                  <Ionicons
                    name="school-outline"
                    size={22}
                    color={value === 'APPRENTICE' ? '#fff' : Colors.primary}
                  />
                  <Text style={[styles.roleBtnText, value === 'APPRENTICE' && styles.roleBtnTextActive]}>
                    Aprendiz
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleBtn, value === 'MENTOR' && styles.roleBtnActive]}
                  onPress={() => onChange('MENTOR')}
                >
                  <Ionicons
                    name="briefcase-outline"
                    size={22}
                    color={value === 'MENTOR' ? '#fff' : Colors.primary}
                  />
                  <Text style={[styles.roleBtnText, value === 'MENTOR' && styles.roleBtnTextActive]}>
                    Mentor
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Nome completo"
                placeholder="Seu nome"
                leftIcon="person-outline"
                onChangeText={onChange}
                value={value}
                error={errors.name?.message}
                autoCapitalize="words"
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <Input
                label="E-mail"
                placeholder="seu@email.com"
                keyboardType="email-address"
                leftIcon="mail-outline"
                onChangeText={onChange}
                value={value}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Senha"
                placeholder="Mínimo 6 caracteres"
                leftIcon="lock-closed-outline"
                isPassword
                onChangeText={onChange}
                value={value}
                error={errors.password?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Confirmar senha"
                placeholder="Repita a senha"
                leftIcon="lock-closed-outline"
                isPassword
                onChangeText={onChange}
                value={value}
                error={errors.confirmPassword?.message}
              />
            )}
          />

          <Button title="Criar conta" onPress={handleSubmit(onSubmit)} loading={loading} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Já tem conta?</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.footerLink}> Entrar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: Colors.background },
  container: { flexGrow: 1, padding: 24 },
  back: { marginBottom: 8 },
  header: { alignItems: 'center', marginBottom: 24 },
  logo: { fontSize: 28, fontWeight: '800', color: Colors.primary },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
  },
  sectionTitle: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary, marginBottom: 10 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  roleBtnActive: { backgroundColor: Colors.primary },
  roleBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  roleBtnTextActive: { color: '#fff' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: Colors.textSecondary, fontSize: 14 },
  footerLink: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
});
