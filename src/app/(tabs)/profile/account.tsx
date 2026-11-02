import { zodResolver } from '@hookform/resolvers/zod';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { FormTextField } from '@/components/form/form-text-field';
import {
  AppText,
  Button,
  Card,
  ErrorState,
  ListItem,
  LoadingState,
  Message,
  Screen,
} from '@/components/ui';
import { updatePassword } from '@/features/auth/api';
import { newPasswordFormSchema, type NewPasswordFormInput } from '@/features/auth/schemas';
import { useProfile, useUpdateProfile } from '@/features/profile/hooks';
import { profileSchema, type ProfileInput } from '@/features/profile/schemas';
import { mn } from '@/i18n/mn';
import { useAuth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import type { Profile } from '@/types/models';

export default function AccountScreen() {
  const { session } = useAuth();
  const profile = useProfile();

  return (
    <Screen>
      <Stack.Screen options={{ title: mn.profile.account }} />
      <Card style={{ paddingVertical: 4 }}>
        <ListItem icon="mail" title={mn.profile.email} subtitle={session?.user.email} />
      </Card>
      {profile.isPending ? (
        <LoadingState />
      ) : profile.isError ? (
        <ErrorState message={getErrorMessage(profile.error)} onRetry={() => profile.refetch()} />
      ) : (
        <ProfileForm profile={profile.data} />
      )}
      <PasswordForm />
    </Screen>
  );
}

function ProfileForm({ profile }: { profile: Profile }) {
  const updateProfile = useUpdateProfile();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { control, handleSubmit } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: profile.full_name ?? '', phone: profile.phone ?? '' },
  });

  const onSubmit = handleSubmit(async ({ fullName, phone }) => {
    setError(null);
    setNotice(null);
    try {
      await updateProfile.mutateAsync({ full_name: fullName, phone: phone || null });
      setNotice(mn.common.saved);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  });

  return (
    <Card style={{ gap: 16 }}>
      <FormTextField
        control={control}
        name="fullName"
        label={mn.profile.fullName}
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
      />
      <FormTextField
        control={control}
        name="phone"
        label={`${mn.profile.phone} (${mn.common.optional})`}
        placeholder={mn.profile.phonePlaceholder}
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
      />
      <Message tone="error" text={error} />
      <Message tone="success" text={notice} />
      <Button title={mn.common.save} loading={updateProfile.isPending} onPress={onSubmit} />
    </Card>
  );
}

function PasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<NewPasswordFormInput>({
    resolver: zodResolver(newPasswordFormSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async ({ password }) => {
    setError(null);
    setNotice(null);
    try {
      await updatePassword(password);
      reset();
      setNotice(mn.profile.passwordChanged);
    } catch (e) {
      setError(getErrorMessage(e));
    }
  });

  return (
    <Card style={{ gap: 16 }}>
      <AppText variant="subheading">{mn.profile.changePassword}</AppText>
      <FormTextField
        control={control}
        name="password"
        label={mn.auth.newPassword}
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
      />
      <Message tone="error" text={error} />
      <Message tone="success" text={notice} />
      <Button
        title={mn.profile.changePassword}
        variant="secondary"
        loading={isSubmitting}
        onPress={onSubmit}
      />
    </Card>
  );
}
