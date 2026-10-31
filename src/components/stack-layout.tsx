import { Stack } from 'expo-router';

import { colors, typography } from '@/constants/theme';

/** Shared stack navigator for each tab, with a clean white header. */
export function StackLayout({ title }: { title: string }) {
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { ...typography.subheading, color: colors.text },
        headerTintColor: colors.primary,
        contentStyle: { backgroundColor: colors.surface },
      }}>
      <Stack.Screen name="index" options={{ title }} />
    </Stack>
  );
}
