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
import { recoverPassword } from '../../src/services/authService';
import { recuperarSenhaSchema, type RecuperarSenhaFormData } from '../../src/utils/validators';

export default function RecuperarSenhaScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RecuperarSenhaFormData>({
    resolver: zodResolver(recuperarSenhaSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(data: RecuperarSenhaFormData) {
    setLoading(true);
    try {
      await recoverPassword(data.email);
      setSent(true);
    } catch {
      Alert.alert('Erro', 'Não foi possível enviar o e-mail. Verifique o endereço informado.');
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

        <View style={styles.iconWrapper}>
          <Ionicons name="lock-open-outline" size={56} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Recuperar senha</Text>
        <Text style={styles.desc}>
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </Text>

        {sent ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
            <Text style={styles.successText}>
              E-mail enviado! Verifique sua caixa de entrada.
            </Text>
            <Button
              title="Voltar ao login"
              onPress={() => router.replace('/(auth)/login')}
              style={{ marginTop: 16 }}
            />
          </View>
        ) : (
          <View style={styles.card}>
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
            <Button title="Enviar link" onPress={handleSubmit(onSubmit)} loading={loading} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { backgroundColor: Colors.background },
  container: { flexGrow: 1, padding: 24, alignItems: 'center' },
  back: { alignSelf: 'flex-start', marginBottom: 24 },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8 },
  desc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 32 },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
  },
  successBox: { alignItems: 'center', width: '100%', paddingTop: 16 },
  successText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginTop: 12 },
});
