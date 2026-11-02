import { Stack } from 'expo-router';
import { useState } from 'react';

import type { ImageChange } from '@/components/image-field';
import { LoadingState, Screen } from '@/components/ui';
import { removeBusinessLogo, updateBusiness, uploadBusinessLogo } from '@/features/business/api';
import { BusinessForm } from '@/features/business/components/business-form';
import { useActiveBusiness, useSetBusinessInCache } from '@/features/business/hooks';
import type { BusinessInput } from '@/features/business/schemas';
import { mn } from '@/i18n/mn';
import { getErrorMessage } from '@/lib/errors';
import { assetUrl } from '@/lib/storage';
import { CURRENCIES, type Currency } from '@/types/models';

export default function BusinessSettingsScreen() {
  const business = useActiveBusiness();
  const setBusinessInCache = useSetBusinessInCache();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!business) return <LoadingState />;

  async function handleSubmit(values: BusinessInput, logo: ImageChange) {
    if (!business) return false;
    setError(null);
    setNotice(null);
    try {
      let updated = await updateBusiness(business.id, {
        name: values.name,
        business_type: values.businessType,
      });
      if (logo) updated = await uploadBusinessLogo(updated, logo);
      else if (logo === null && updated.logo_path) updated = await removeBusinessLogo(updated);
      setBusinessInCache(updated);
      setNotice(mn.common.saved);
      return true;
    } catch (e) {
      setError(getErrorMessage(e));
      return false;
    }
  }

  const currency = (CURRENCIES as readonly string[]).includes(business.currency)
    ? (business.currency as Currency)
    : undefined;

  return (
    <Screen>
      <Stack.Screen options={{ title: mn.profile.businessSection }} />
      <BusinessForm
        defaultValues={{ name: business.name, businessType: business.business_type, currency }}
        currentLogoUrl={business.logo_path ? assetUrl(business.logo_path) : null}
        currencyLocked
        submitLabel={mn.common.save}
        error={error}
        notice={notice}
        onSubmit={handleSubmit}
      />
    </Screen>
  );
}
