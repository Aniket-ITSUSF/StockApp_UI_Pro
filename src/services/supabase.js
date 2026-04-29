import { createClient } from '@supabase/supabase-js';

// These two values are read at build time by Vite. Set them in your Railway
// frontend service environment variables before the next deploy.
//
//   VITE_SUPABASE_URL              = https://<project>.supabase.co
//   VITE_SUPABASE_PUBLISHABLE_KEY  = sb_publishable_...   (frontend-safe)
//
// We do NOT expose the secret key here under any circumstance.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  // Don't throw - the app should still render so the user sees a clear
  // error from AuthContext rather than a blank screen during local dev.
  console.warn(
    '[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY is missing. ' +
      'Sign-in / sign-up will be disabled until both are set.',
  );
}

export const supabase = createClient(
  SUPABASE_URL ?? 'https://missing.invalid',
  SUPABASE_PUBLISHABLE_KEY ?? 'missing',
  {
    auth: {
      // Persist sessions in localStorage and auto-refresh access tokens.
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
