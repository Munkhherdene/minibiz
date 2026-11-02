import { useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchBusinesses } from '@/features/business/api';
import { useAuth } from '@/lib/auth';
import type { Business } from '@/types/models';

export function businessesQueryKey(userId: string | undefined) {
  return ['businesses', userId] as const;
}

export function useBusinesses() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: businessesQueryKey(userId),
    queryFn: fetchBusinesses,
    enabled: !!userId,
  });
}

/**
 * The business the app is working in. The MVP uses the user's first business;
 * a business switcher can replace this later without changing callers.
 */
export function useActiveBusiness(): Business | undefined {
  return useBusinesses().data?.[0];
}

/** Puts a created or updated business into the cache so screens update immediately. */
export function useSetBusinessInCache() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  return (business: Business) => {
    queryClient.setQueryData<Business[]>(businessesQueryKey(session?.user.id), (current = []) => {
      const exists = current.some((b) => b.id === business.id);
      return exists
        ? current.map((b) => (b.id === business.id ? business : b))
        : [...current, business];
    });
  };
}
