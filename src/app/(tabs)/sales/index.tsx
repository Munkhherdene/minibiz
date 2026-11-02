import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';

import { ChoiceChips, EmptyState, ErrorState, Icon, LoadingState, Screen } from '@/components/ui';
import { colors, spacing, touchTarget } from '@/constants/theme';
import { useActiveBusiness } from '@/features/business/hooks';
import { SaleRow } from '@/features/sales/components/sale-row';
import { useSales } from '@/features/sales/hooks';
import { SALE_RANGES, rangeStart, type SaleRange } from '@/features/sales/ranges';
import { mn } from '@/i18n/mn';
import { getErrorMessage } from '@/lib/errors';

const rangeOptions = SALE_RANGES.map((value) => ({ value, label: mn.sales.ranges[value] }));

function openNewSale() {
  router.push('/sales/new');
}

export default function SalesScreen() {
  const currency = useActiveBusiness()?.currency ?? 'MNT';
  const [range, setRange] = useState<SaleRange>('today');
  const sales = useSales(rangeStart(range));
  const items = sales.data?.pages.flat() ?? [];

  function renderEmpty() {
    if (sales.isPending) return <LoadingState />;
    if (sales.isError) {
      return <ErrorState message={getErrorMessage(sales.error)} onRetry={() => sales.refetch()} />;
    }
    return (
      <EmptyState
        icon="sales"
        title={range === 'all' ? mn.sales.emptyTitle : mn.sales.emptyRange}
        description={range === 'all' ? mn.sales.emptyText : undefined}
        actionLabel={mn.sales.add}
        onAction={openNewSale}
      />
    );
  }

  return (
    <Screen scroll={false}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={mn.sales.add}
              hitSlop={8}
              onPress={openNewSale}
              style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
              <Icon name="add" color={colors.primary} />
            </Pressable>
          ),
        }}
      />
      <ChoiceChips
        label={mn.sales.ranges.all}
        hideLabel
        options={rangeOptions}
        value={range}
        onChange={setRange}
      />
      <FlatList
        data={items}
        keyExtractor={(sale) => sale.id}
        renderItem={({ item }) => (
          <SaleRow
            sale={item}
            currency={currency}
            onPress={() => router.push({ pathname: '/sales/[id]', params: { id: item.id } })}
          />
        )}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty()}
        ListFooterComponent={
          sales.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> : undefined
        }
        onEndReached={() => {
          if (sales.hasNextPage && !sales.isFetchingNextPage) sales.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        refreshing={sales.isRefetching && !sales.isFetchingNextPage}
        onRefresh={() => sales.refetch()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  list: { flex: 1, marginHorizontal: -spacing.lg },
  listContent: {
    flexGrow: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
