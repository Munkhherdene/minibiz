import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { AuthScreen } from '@/components/auth-screen';
import { FormTextField } from '@/components/form/form-text-field';
import { TextLink } from '@/components/text-link';
import { Button, Message } from '@/components/ui';
import { signUp } from '@/features/auth/api';
import { signupSchema, type SignupInput } from '@/features/auth/schemas';
import { mn } from '@/i18n/mn';
import { getErrorMessage } from '@/lib/errors';

export default function SignupScreen() {
  const [error, setError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async ({ fullName, email, password }) => {
    setError(null);
    try {
      await signUp(fullName, email, password);
      // The user is now signed in; the guards continue to onboarding.
    } catch (e) {
      setError(getErrorMessage(e));
    }
  });

  return (
    <AuthScreen title={mn.auth.signupTitle} subtitle={mn.auth.signupSubtitle}>
      <FormTextField
        control={control}
        name="fullName"
        label={mn.auth.fullName}
        placeholder={mn.auth.fullNamePlaceholder}
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
      />
      <FormTextField
        control={control}
        name="email"
        label={mn.auth.email}
        placeholder={mn.auth.emailPlaceholder}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <FormTextField
        control={control}
        name="password"
        label={mn.auth.password}
        placeholder={mn.auth.newPasswordPlaceholder}
        autoComplete="new-password"
        textContentType="newPassword"
        secureToggle
      />
      <FormTextField
        control={control}
        name="confirmPassword"
        label={mn.auth.confirmPassword}
        placeholder={mn.auth.confirmPasswordPlaceholder}
        autoComplete="new-password"
        textContentType="newPassword"
        secureToggle
        returnKeyType="go"
        onSubmitEditing={() => onSubmit()}
      />
      <Message tone="error" text={error} />
      <Button title={mn.auth.signup} loading={isSubmitting} onPress={onSubmit} />
      <TextLink
        prompt={mn.auth.haveAccount}
        label={mn.auth.login}
        onPress={() => router.replace('/login')}
      />
    </AuthScreen>
  );
}
