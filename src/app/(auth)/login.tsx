import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { AuthScreen, Field, Message, SubmitButton } from '@/components/auth-form';
import { colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    // On success the root layout's guard switches to the home screen.
    if (error) setError(error.message);
    setLoading(false);
  }

  return (
    <AuthScreen title="Welcome back" subtitle="Log in to your account">
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        autoComplete="current-password"
        textContentType="password"
        secureTextEntry
        onSubmitEditing={handleLogin}
      />
      <Message type="error" text={error} />
      <SubmitButton title="Log in" loading={loading} onPress={handleLogin} />
      <Text style={styles.footer}>
        Don&apos;t have an account?{' '}
        <Link href="/signup" replace style={styles.link}>
          Sign up
        </Link>
      </Text>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  footer: { textAlign: 'center', color: colors.muted, marginTop: 8 },
  link: { color: colors.primary, fontWeight: '600' },
});
