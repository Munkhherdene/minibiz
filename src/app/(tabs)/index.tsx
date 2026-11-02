import { AppText, Card, EmptyState, Screen } from '@/components/ui';
import { useActiveBusiness } from '@/features/business/hooks';
import { formatDayLong } from '@/i18n/format';
import { mn } from '@/i18n/mn';

export default function HomeScreen() {
  const business = useActiveBusiness();

  return (
    <Screen edges={['top']}>
      <AppText variant="caption" tone="muted">
        {formatDayLong(new Date())}
      </AppText>
      <AppText variant="title">{business?.name ?? mn.home.greeting}</AppText>
      <Card>
        <EmptyState
          icon="finance"
          title={mn.home.placeholderTitle}
          description={mn.home.placeholderText}
        />
      </Card>
    </Screen>
  );
}
