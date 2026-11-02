import { useState } from 'react';
import { Alert } from 'react-native';

import { AuthScreen } from '@/components/auth-screen';
import type { ImageChange } from '@/components/image-field';
import { TextLink } from '@/components/text-link';
import { signOut } from '@/features/auth/api';
import { createBusiness, uploadBusinessLogo } from '@/features/business/api';
import { BusinessForm } from '@/features/business/components/business-form';
import { useSetBusinessInCache } from '@/features/business/hooks';
import type { BusinessInput } from '@/features/business/schemas';
import { mn } from '@/i18n/mn';
import { getErrorMessage } from '@/lib/errors';

export default function OnboardingScreen() {
  const setBusinessInCache = useSetBusinessInCache();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: BusinessInput, logo: ImageChange) {
    setError(null);
    let business;
    try {
      business = await createBusiness(values);
    } catch (e) {
      setError(getErrorMessage(e));
      return false;
    }

    if (logo) {
      try {
        business = await uploadBusinessLogo(business, logo);
      } catch {
        // The business exists; the logo can be added later from Profile.
        Alert.alert(mn.onboarding.logoFailed);
      }
    }

    // Once the business is in the cache, the root guards open the tabs.
    setBusinessInCache(business);
    return true;
  }

  return (
    <AuthScreen title={mn.onboarding.title} subtitle={mn.onboarding.subtitle}>
      <BusinessForm
        defaultValues={{ currency: 'MNT' }}
        submitLabel={mn.onboarding.submit}
        error={error}
        onSubmit={handleSubmit}
      />
      <TextLink label={mn.profile.logout} onPress={() => signOut().catch(() => {})} />
    </AuthScreen>
  );
}
