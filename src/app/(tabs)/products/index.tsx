import { EmptyState, Screen } from '@/components/ui';
import { mn } from '@/i18n/mn';

export default function ProductsScreen() {
  return (
    <Screen>
      <EmptyState icon="products" title={mn.common.comingSoon} description={mn.products.placeholderText} />
    </Screen>
  );
}
