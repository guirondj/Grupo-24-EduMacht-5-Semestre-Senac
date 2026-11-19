import { View, Text, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { Loading } from '../src/components/ui/Loading';
import { Button } from '../src/components/ui/Button';
import { logoutUser } from '../src/services/authService';
import { Colors } from '../src/constants/colors';

export default function Index() {
  const { firebaseUser, user, loading } = useAuth();

  if (loading) return <Loading fullScreen message="Carregando..." />;

  if (!firebaseUser) return <Redirect href="/(auth)/login" />;

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Perfil não encontrado</Text>
        <Text style={styles.desc}>
          Não foi possível carregar seu perfil. Verifique sua conexão ou entre novamente.
        </Text>
        <Button title="Voltar ao login" onPress={() => logoutUser()} />
      </View>
    );
  }

  if (user.role === 'MENTOR') return <Redirect href="/(mentor)" />;

  return <Redirect href="/(aprendiz)" />;
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: Colors.background },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  desc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24 },
});
