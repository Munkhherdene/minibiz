import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ErrorState, LoadingState } from '@/components/ui';
import { useBusinesses } from '@/features/business/hooks';
import { AuthProvider, useAuth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { queryClient } from '@/lib/query-client';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootNavigator />
        <StatusBar style="dark" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const { session, isLoading, isRecoveringPassword } = useAuth();
  const businesses = useBusinesses();

  // During password recovery a session exists, but the user stays on the auth screens.
  const signedIn = !!session && !isRecoveringPassword;
  const hasBusiness = (businesses.data?.length ?? 0) > 0;

  if (isLoading || (signedIn && businesses.isPending)) return <LoadingState />;

  if (signedIn && businesses.isError) {
    return (
      <ErrorState message={getErrorMessage(businesses.error)} onRetry={() => businesses.refetch()} />
    );
  }

  // The guards redirect automatically when the session or business changes,
  // so screens never navigate after sign in, sign out or onboarding.
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={signedIn && hasBusiness}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>

      <Stack.Protected guard={signedIn && !hasBusiness}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>

      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}
