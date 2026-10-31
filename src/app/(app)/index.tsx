import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { colors } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { displayName, formatDate } from '@/lib/user';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { session } = useAuth();
  const user = session?.user;
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.date}>{today}</Text>
        <Text style={styles.title}>
          {greeting()}, {displayName(user)}
        </Text>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Welcome to minibiz</Text>
          <Text style={styles.heroText}>Signed in as {user?.email}</Text>
        </View>

        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={[styles.card, styles.empty]}>
          <Icon name="inbox" size={32} color={colors.muted} />
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Text style={styles.emptyText}>Your business activity will show up here.</Text>
        </View>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Icon name="calendar" size={20} color={colors.primary} />
            <Text style={styles.rowLabel}>Member since</Text>
            <Text style={styles.rowValue}>
              {formatDate(user?.created_at, { year: 'numeric', month: 'short', day: 'numeric' })}
            </Text>
          </View>
          <View style={styles.divider} />
          <Link href="/profile" asChild>
            <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <Icon name="profile" size={20} color={colors.primary} />
              <Text style={styles.rowLabel}>Profile & settings</Text>
              <Icon name="chevron" size={18} color={colors.muted} />
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 20, paddingBottom: 32 },
  date: { fontSize: 14, color: colors.muted },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, marginTop: 4 },
  hero: { backgroundColor: colors.primary, borderRadius: 16, padding: 20, marginTop: 20 },
  heroTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  heroText: { fontSize: 14, color: colors.primarySoft, marginTop: 6 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 28,
    marginBottom: 10,
  },
  card: { backgroundColor: colors.background, borderRadius: 16, paddingHorizontal: 16 },
  empty: { alignItems: 'center', paddingVertical: 28, gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 4 },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rowLabel: { flex: 1, fontSize: 16, color: colors.text },
  rowValue: { fontSize: 15, color: colors.muted },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  pressed: { opacity: 0.6 },
});
