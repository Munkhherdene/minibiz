import { randomUUID } from 'expo-crypto';

import { supabase } from '@/lib/supabase';

// Public-read bucket; the first path segment is the business id
// ({business_id}/logo/..., {business_id}/products/...), which storage policies check.
const ASSETS_BUCKET = 'business-assets';

export type LocalImage = { base64: string; mimeType: string };

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Uploads an image into `folder` under a new unique name and returns its path. */
export async function uploadImage(folder: string, image: LocalImage): Promise<string> {
  const extension = EXTENSIONS[image.mimeType] ?? 'jpg';
  const path = `${folder}/${randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(ASSETS_BUCKET)
    .upload(path, base64ToBytes(image.base64), { contentType: image.mimeType });
  if (error) throw error;
  return path;
}

/** Best effort: a leftover file is harmless. */
export async function removeImage(path: string) {
  await supabase.storage.from(ASSETS_BUCKET).remove([path]);
}

export function assetUrl(path: string) {
  return supabase.storage.from(ASSETS_BUCKET).getPublicUrl(path).data.publicUrl;
}
