import { EmptyState, Screen } from '@/components/ui';
import { mn } from '@/i18n/mn';

export default function FinanceScreen() {
  return (
    <Screen>
      <EmptyState icon="finance" title={mn.common.comingSoon} description={mn.finance.placeholderText} />
    </Screen>
  );
}
