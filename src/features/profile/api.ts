import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types/models';

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(
  userId: string,
  changes: Pick<Profile, 'full_name' | 'phone'>,
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(changes)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}
