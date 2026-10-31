import { AppText, Card, EmptyState, Screen } from '@/components/ui';
import { formatDayLong } from '@/i18n/format';
import { mn } from '@/i18n/mn';

export default function HomeScreen() {
  return (
    <Screen edges={['top']}>
      <AppText variant="caption" tone="muted">
        {formatDayLong(new Date())}
      </AppText>
      <AppText variant="title">{mn.home.greeting}</AppText>
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
