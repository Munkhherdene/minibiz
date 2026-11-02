import { supabase } from '@/lib/supabase';

// Each function throws the Supabase error so callers can map it with getErrorMessage().

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

/**
 * Signs the user in immediately. Requires "Confirm email" to be off in Supabase
 * (Authentication → Sign In / Providers → Email); a taken email throws `user_already_exists`.
 */
export async function signUp(fullName: string, email: string, password: string) {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

/** Signs the user in with a recovery session; follow with updatePassword(). */
export async function verifyRecoveryCode(email: string, token: string) {
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
