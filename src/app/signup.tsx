import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { AuthScreen, Field, Message, SubmitButton, colors } from '@/components/auth-form';
import { supabase } from '@/lib/supabase';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSignup() {
    setNotice(null);
    if (!email.trim() || !password) {
      setError('Enter your email and a password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) {
      setError(error.message);
    } else if (!data.session) {
      // "Confirm email" is on in Supabase: no session until the link is clicked.
      setNotice('Check your email for a confirmation link, then log in.');
    }
    // With a session, the root layout's guard switches to the home screen.
    setLoading(false);
  }

  return (
    <AuthScreen title="Create account" subtitle="Sign up to get started">
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
        placeholder="At least 6 characters"
        autoComplete="new-password"
        textContentType="newPassword"
        secureTextEntry
      />
      <Field
        label="Confirm password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Repeat your password"
        autoComplete="new-password"
        textContentType="newPassword"
        secureTextEntry
        onSubmitEditing={handleSignup}
      />
      <Message type="error" text={error} />
      <Message type="success" text={notice} />
      <SubmitButton title="Sign up" loading={loading} onPress={handleSignup} />
      <Text style={styles.footer}>
        Already have an account?{' '}
        <Link href="/login" replace style={styles.link}>
          Log in
        </Link>
      </Text>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  footer: { textAlign: 'center', color: colors.muted, marginTop: 8 },
  link: { color: colors.primary, fontWeight: '600' },
});
