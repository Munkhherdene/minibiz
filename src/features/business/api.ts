import { removeImage, uploadImage, type LocalImage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import type { Business, BusinessType } from '@/types/models';

/** Businesses the signed-in user belongs to (RLS limits the rows), oldest first. */
export async function fetchBusinesses(): Promise<Business[]> {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as Business[];
}

export async function createBusiness(input: {
  name: string;
  businessType: BusinessType;
  currency: string;
}): Promise<Business> {
  const { data, error } = await supabase.rpc('create_business', {
    p_name: input.name,
    p_business_type: input.businessType,
    p_currency: input.currency,
  });
  if (error) throw error;
  return data as Business;
}

export async function updateBusiness(
  id: string,
  changes: Partial<Pick<Business, 'name' | 'business_type' | 'logo_path'>>,
): Promise<Business> {
  const { data, error } = await supabase
    .from('businesses')
    .update(changes)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Business;
}

/** Uploads a new logo, points the business at it, then removes the previous file. */
export async function uploadBusinessLogo(business: Business, image: LocalImage) {
  const path = await uploadImage(`${business.id}/logo`, image);
  const updated = await updateBusiness(business.id, { logo_path: path });
  if (business.logo_path) await removeImage(business.logo_path);
  return updated;
}

export async function removeBusinessLogo(business: Business) {
  const updated = await updateBusiness(business.id, { logo_path: null });
  if (business.logo_path) await removeImage(business.logo_path);
  return updated;
}
