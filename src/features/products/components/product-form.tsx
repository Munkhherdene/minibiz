import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { FormTextField } from '@/components/form/form-text-field';
import { ImageField, type ImageChange } from '@/components/image-field';
import { Button, ChoiceChips, Message } from '@/components/ui';
import { requiresWholeQuantity } from '@/domain/inventory';
import {
  productSchema,
  type ProductFormValues,
  type ProductInput,
} from '@/features/products/schemas';
import { mn } from '@/i18n/mn';
import { UNITS } from '@/types/models';

const unitOptions = UNITS.map((value) => ({ value, label: mn.products.units[value] }));

const emptyValues: ProductFormValues = {
  name: '',
  sellingPrice: '',
  costPrice: '',
  unit: 'pcs',
  openingStock: '',
  lowStockThreshold: '',
  sku: '',
  barcode: '',
};

const optional = (label: string) => `${label} (${mn.common.optional})`;

export function ProductForm({
  defaultValues,
  currentImageUrl = null,
  showOpeningStock = false,
  submitLabel,
  error,
  onSubmit,
}: {
  defaultValues?: Partial<ProductFormValues>;
  currentImageUrl?: string | null;
  /** Opening stock can only be set when creating; later it changes through movements. */
  showOpeningStock?: boolean;
  submitLabel: string;
  error: string | null;
  /** Resolves to true when saved; the parent shows its own error otherwise. */
  onSubmit: (values: ProductInput, image: ImageChange) => Promise<boolean>;
}) {
  const [image, setImage] = useState<ImageChange>(undefined);
  const [imageError, setImageError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ProductFormValues, unknown, ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: { ...emptyValues, ...defaultValues },
  });
  const unit = useWatch({ control, name: 'unit' });
  const quantityKeyboard = requiresWholeQuantity(unit) ? 'number-pad' : 'decimal-pad';

  const shownImage = image === undefined ? currentImageUrl : (image?.uri ?? null);

  const submit = handleSubmit(async (values) => {
    setImageError(null);
    if (await onSubmit(values, image)) setImage(undefined);
  });

  return (
    <>
      <FormTextField
        control={control}
        name="name"
        label={mn.products.name}
        placeholder={mn.products.namePlaceholder}
        autoCapitalize="sentences"
        maxLength={100}
      />
      <FormTextField
        control={control}
        name="sellingPrice"
        label={mn.products.sellingPrice}
        placeholder="0"
        keyboardType="decimal-pad"
      />
      <FormTextField
        control={control}
        name="costPrice"
        label={optional(mn.products.costPrice)}
        placeholder="0"
        keyboardType="decimal-pad"
      />
      <Controller
        control={control}
        name="unit"
        render={({ field }) => (
          <ChoiceChips
            label={mn.products.unit}
            options={unitOptions}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      {showOpeningStock ? (
        <FormTextField
          control={control}
          name="openingStock"
          label={optional(mn.products.openingStock)}
          hint={mn.products.openingStockHint}
          placeholder="0"
          keyboardType={quantityKeyboard}
        />
      ) : null}
      <FormTextField
        control={control}
        name="lowStockThreshold"
        label={optional(mn.products.lowStockThreshold)}
        hint={mn.products.lowStockHint}
        keyboardType={quantityKeyboard}
      />
      <FormTextField
        control={control}
        name="sku"
        label={optional(mn.products.sku)}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={64}
      />
      <FormTextField
        control={control}
        name="barcode"
        label={optional(mn.products.barcode)}
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={64}
      />
      <ImageField
        label={mn.products.image}
        addLabel={mn.products.addImage}
        changeLabel={mn.products.changeImage}
        removeLabel={mn.products.removeImage}
        imageUri={shownImage}
        onPick={(picked) => {
          setImageError(null);
          setImage(picked);
        }}
        onRemove={() => setImage(null)}
        onError={setImageError}
        disabled={isSubmitting}
      />
      <Message tone="error" text={imageError ?? error} />
      <Button title={submitLabel} loading={isSubmitting} onPress={submit} />
    </>
  );
}
