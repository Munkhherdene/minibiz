import type { User } from '@supabase/supabase-js';

// "jane.doe@example.com" -> "Jane.doe"
export function displayName(user: User | undefined) {
  const local = user?.email?.split('@')[0] ?? '';
  return local ? local[0].toUpperCase() + local.slice(1) : 'there';
}

export function formatDate(value: string | undefined, options: Intl.DateTimeFormatOptions) {
  return value ? new Date(value).toLocaleDateString(undefined, options) : '—';
}
