import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Message } from '@/components/auth-form';
import { Icon, type IconName } from '@/components/icon';
import { colors } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { displayName, formatDate } from '@/lib/user';
import { supabase } from '@/lib/supabase';

const dateTime: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
};

export default function ProfileScreen() {
  const { session } = useAuth();
  const user = session?.user;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signOut();
    // On success the root layout's guard switches to the login screen.
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  const name = displayName(user);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.card}>
          <InfoRow icon="mail" label="Email" value={user?.email ?? '—'} />
          <View style={styles.divider} />
          <InfoRow
            icon="calendar"
            label="Member since"
            value={formatDate(user?.created_at, { year: 'numeric', month: 'short', day: 'numeric' })}
          />
          <View style={styles.divider} />
          <InfoRow icon="clock" label="Last sign in" value={formatDate(user?.last_sign_in_at, dateTime)} />
        </View>

        <Message type="error" text={error} />

        <Pressable
          accessibilityRole="button"
          disabled={loading}
          onPress={handleLogout}
          style={({ pressed }) => [styles.logout, (pressed || loading) && styles.pressed]}>
          {loading ? (
            <ActivityIndicator color={colors.error} />
          ) : (
            <>
              <Icon name="logout" size={20} color={colors.error} />
              <Text style={styles.logoutText}>Log out</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Icon name={icon} size={20} color={colors.primary} />
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  content: { padding: 20, paddingBottom: 32, gap: 20 },
  header: { alignItems: 'center', paddingVertical: 12 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: colors.primary },
  name: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 12 },
  email: { fontSize: 15, color: colors.muted, marginTop: 2 },
  card: { backgroundColor: colors.background, borderRadius: 16, paddingHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 13, color: colors.muted },
  rowValue: { fontSize: 16, color: colors.text, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.background,
    borderRadius: 16,
    paddingVertical: 16,
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: colors.error },
  pressed: { opacity: 0.6 },
});
