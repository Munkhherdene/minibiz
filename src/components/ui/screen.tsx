import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, spacing } from '@/constants/theme';

/**
 * Standard screen container. Screens under a stack header only need
 * the default edges ([]); screens without a header pass ['top'].
 */
export function Screen({
  children,
  scroll = true,
  edges = [],
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
}) {
  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fill]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  content: { flexGrow: 1, padding: spacing.lg, gap: spacing.lg },
  fill: { flex: 1 },
});
