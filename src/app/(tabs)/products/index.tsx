import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';

import {
  ChoiceChips,
  EmptyState,
  ErrorState,
  Icon,
  LoadingState,
  Screen,
  TextField,
} from '@/components/ui';
import { colors, spacing, touchTarget } from '@/constants/theme';
import { useActiveBusiness } from '@/features/business/hooks';
import { ProductRow } from '@/features/products/components/product-row';
import { useProducts } from '@/features/products/hooks';
import { mn } from '@/i18n/mn';
import { getErrorMessage } from '@/lib/errors';
import { useDebouncedValue } from '@/lib/use-debounced-value';

type Filter = 'active' | 'archived';

const filterOptions: { value: Filter; label: string }[] = [
  { value: 'active', label: mn.products.active },
  { value: 'archived', label: mn.products.archived },
];

function openNewProduct() {
  router.push('/products/new');
}

export default function ProductsScreen() {
  const currency = useActiveBusiness()?.currency ?? 'MNT';
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('active');
  const debouncedSearch = useDebouncedValue(search.trim());
  const products = useProducts({ search: debouncedSearch, archived: filter === 'archived' });
  const items = products.data?.pages.flat() ?? [];

  function renderEmpty() {
    if (products.isPending) return <LoadingState />;
    if (products.isError) {
      return (
        <ErrorState message={getErrorMessage(products.error)} onRetry={() => products.refetch()} />
      );
    }
    if (debouncedSearch) return <EmptyState icon="search" title={mn.products.noResults} />;
    if (filter === 'archived') return <EmptyState icon="archive" title={mn.products.emptyArchived} />;
    return (
      <EmptyState
        icon="products"
        title={mn.products.emptyTitle}
        description={mn.products.emptyText}
        actionLabel={mn.products.add}
        onAction={openNewProduct}
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
              accessibilityLabel={mn.products.add}
              hitSlop={8}
              onPress={openNewProduct}
              style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
              <Icon name="add" color={colors.primary} />
            </Pressable>
          ),
        }}
      />
      <TextField
        placeholder={mn.products.searchPlaceholder}
        value={search}
        onChangeText={setSearch}
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      <ChoiceChips
        label={mn.products.active}
        hideLabel
        options={filterOptions}
        value={filter}
        onChange={setFilter}
      />
      <FlatList
        data={items}
        keyExtractor={(product) => product.id}
        renderItem={({ item }) => (
          <ProductRow
            product={item}
            currency={currency}
            onPress={() => router.push({ pathname: '/products/[id]', params: { id: item.id } })}
          />
        )}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty()}
        ListFooterComponent={
          products.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> : undefined
        }
        onEndReached={() => {
          if (products.hasNextPage && !products.isFetchingNextPage) products.fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        refreshing={products.isRefetching && !products.isFetchingNextPage}
        onRefresh={() => products.refetch()}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
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
  listContent: { flexGrow: 1, gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
});
