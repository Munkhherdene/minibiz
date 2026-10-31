import { useState } from 'react';

import { AppText, Button, Card, Divider, ListItem, Screen } from '@/components/ui';
import { formatDate } from '@/i18n/format';
import { mn } from '@/i18n/mn';
import { useAuth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

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
      setError(getErrorMessage(error));
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Card style={{ paddingVertical: 4 }}>
        <ListItem icon="mail" title={mn.profile.email} subtitle={user?.email} />
        <Divider />
        <ListItem
          icon="calendar"
          title={mn.profile.memberSince}
          subtitle={user?.created_at ? formatDate(user.created_at) : undefined}
        />
      </Card>

      {error ? <AppText tone="error">{error}</AppText> : null}

      <Button
        title={mn.profile.logout}
        icon="logout"
        variant="danger"
        loading={loading}
        onPress={handleLogout}
      />
    </Screen>
  );
}
