import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchProfile, updateProfile } from '@/features/profile/api';
import { useAuth } from '@/lib/auth';
import type { Profile } from '@/types/models';

function profileQueryKey(userId: string | undefined) {
  return ['profile', userId] as const;
}

export function useProfile() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: profileQueryKey(userId),
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const userId = session?.user.id;
  return useMutation({
    mutationFn: (changes: Pick<Profile, 'full_name' | 'phone'>) => updateProfile(userId!, changes),
    onSuccess: (profile) => queryClient.setQueryData(profileQueryKey(userId), profile),
  });
}
