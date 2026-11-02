import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import type { ImageChange } from '@/components/image-field';
import { Screen } from '@/components/ui';
import { useActiveBusiness } from '@/features/business/hooks';
import { ProductForm } from '@/features/products/components/product-form';
import { useCreateProduct, useUploadProductImage } from '@/features/products/hooks';
import type { ProductInput } from '@/features/products/schemas';
import { mn } from '@/i18n/mn';
import { getErrorMessage } from '@/lib/errors';

export default function NewProductScreen() {
  const business = useActiveBusiness();
  const createProduct = useCreateProduct();
  const uploadImage = useUploadProductImage();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: ProductInput, image: ImageChange) {
    if (!business) return false;
    setError(null);
    let product;
    try {
      product = await createProduct.mutateAsync({ businessId: business.id, input: values });
    } catch (e) {
      setError(getErrorMessage(e));
      return false;
    }

    if (image) {
      try {
        await uploadImage.mutateAsync({ product, image });
      } catch {
        // The product exists; the photo can be added again from Edit.
        Alert.alert(mn.products.imageFailed);
      }
    }

    router.replace({ pathname: '/products/[id]', params: { id: product.id } });
    return true;
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: mn.products.newTitle }} />
      <ProductForm
        showOpeningStock
        submitLabel={mn.common.save}
        error={error}
        onSubmit={handleSubmit}
      />
    </Screen>
  );
}
