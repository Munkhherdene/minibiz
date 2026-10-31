import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { AuthScreen, Message, SubmitButton, colors } from '@/components/auth-form';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    // On success the root layout's guard switches to the login screen.
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <AuthScreen title="Home" subtitle="You're logged in">
      <Text style={styles.email}>{session?.user.email}</Text>
      <Message type="error" text={error} />
      <SubmitButton title="Log out" loading={loading} onPress={handleLogout} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  email: { fontSize: 16, color: colors.text },
});
