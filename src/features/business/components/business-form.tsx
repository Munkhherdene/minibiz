import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { FormTextField } from '@/components/form/form-text-field';
import { ImageField, type ImageChange } from '@/components/image-field';
import { Button, ChoiceChips, Message } from '@/components/ui';
import { businessSchema, type BusinessInput } from '@/features/business/schemas';
import { mn } from '@/i18n/mn';
import { BUSINESS_TYPES, CURRENCIES } from '@/types/models';

const typeOptions = BUSINESS_TYPES.map((value) => ({ value, label: mn.business.types[value] }));
const currencyOptions = CURRENCIES.map((value) => ({ value, label: mn.business.currencies[value] }));

export function BusinessForm({
  defaultValues,
  currentLogoUrl = null,
  currencyLocked = false,
  submitLabel,
  error,
  notice,
  onSubmit,
}: {
  defaultValues: Partial<BusinessInput>;
  currentLogoUrl?: string | null;
  currencyLocked?: boolean;
  submitLabel: string;
  error: string | null;
  notice?: string | null;
  /** Resolves to true when saved; the parent shows its own error otherwise. */
  onSubmit: (values: BusinessInput, logo: ImageChange) => Promise<boolean>;
}) {
  const [logo, setLogo] = useState<ImageChange>(undefined);
  const [logoError, setLogoError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<BusinessInput>({
    resolver: zodResolver(businessSchema),
    defaultValues: { name: '', currency: 'MNT', ...defaultValues },
  });

  const shownLogo = logo === undefined ? currentLogoUrl : (logo?.uri ?? null);

  const submit = handleSubmit(async (values) => {
    setLogoError(null);
    if (await onSubmit(values, logo)) setLogo(undefined);
  });

  return (
    <>
      <FormTextField
        control={control}
        name="name"
        label={mn.business.name}
        placeholder={mn.business.namePlaceholder}
        autoCapitalize="sentences"
        maxLength={100}
      />
      <Controller
        control={control}
        name="businessType"
        render={({ field, fieldState }) => (
          <ChoiceChips
            label={mn.business.type}
            options={typeOptions}
            value={field.value}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="currency"
        render={({ field }) => (
          <ChoiceChips
            label={mn.business.currency}
            options={currencyOptions}
            value={field.value}
            onChange={field.onChange}
            disabled={currencyLocked}
          />
        )}
      />
      {currencyLocked ? <Message tone="info" text={mn.business.currencyLocked} /> : null}
      <ImageField
        label={mn.business.logo}
        addLabel={mn.business.addLogo}
        changeLabel={mn.business.changeLogo}
        removeLabel={mn.business.removeLogo}
        imageUri={shownLogo}
        onPick={(image) => {
          setLogoError(null);
          setLogo(image);
        }}
        onRemove={() => setLogo(null)}
        onError={setLogoError}
        disabled={isSubmitting}
      />
      <Message tone="error" text={logoError ?? error} />
      <Message tone="success" text={notice ?? null} />
      <Button title={submitLabel} loading={isSubmitting} onPress={submit} />
    </>
  );
}
