import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { AuthScreen } from '@/components/auth-screen';
import { FormTextField } from '@/components/form/form-text-field';
import { TextLink } from '@/components/text-link';
import { Button, Message } from '@/components/ui';
import { signIn } from '@/features/auth/api';
import { loginSchema, type LoginInput } from '@/features/auth/schemas';
import { mn } from '@/i18n/mn';
import { getErrorMessage } from '@/lib/errors';

export default function LoginScreen() {
  const [error, setError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setError(null);
    try {
      await signIn(email, password);
      // On success the root layout's guards switch to onboarding or the tabs.
    } catch (e) {
      setError(getErrorMessage(e));
    }
  });

  return (
    <AuthScreen title={mn.auth.loginTitle} subtitle={mn.auth.loginSubtitle}>
      <FormTextField
        control={control}
        name="email"
        label={mn.auth.email}
        placeholder={mn.auth.emailPlaceholder}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        returnKeyType="next"
      />
      <FormTextField
        control={control}
        name="password"
        label={mn.auth.password}
        placeholder={mn.auth.passwordPlaceholder}
        autoComplete="current-password"
        textContentType="password"
        secureToggle
        returnKeyType="go"
        onSubmitEditing={() => onSubmit()}
      />
      <Message tone="error" text={error} />
      <Button title={mn.auth.login} loading={isSubmitting} onPress={onSubmit} />
      <TextLink label={mn.auth.forgotPassword} onPress={() => router.push('/forgot-password')} />
      <TextLink
        prompt={mn.auth.noAccount}
        label={mn.auth.signup}
        onPress={() => router.replace('/signup')}
      />
    </AuthScreen>
  );
}
