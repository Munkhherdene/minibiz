import { EmptyState, Screen } from '@/components/ui';
import { mn } from '@/i18n/mn';

export default function SalesScreen() {
  return (
    <Screen>
      <EmptyState icon="sales" title={mn.common.comingSoon} description={mn.sales.placeholderText} />
    </Screen>
  );
}
