import { createContext } from 'react';

/**
 * AuthContext instance - kept in its own file so React Fast Refresh can
 * hot-reload AuthContext.jsx (component) and useAuth.js (hook) cleanly.
 *
 * THIS IS THE SINGLE SOURCE OF TRUTH FOR TIER IN THE UI.
 * No component should ever read `profile.subscription_tier`,
 * `profile.effective_tier`, or its own `/v1/agents` fetch and call that
 * "the tier". They must read `tier` (or the boolean helpers) from this
 * context. The backend is the *real* source of truth - this object is
 * just the cached, derived view.
 */
export const AuthContext = createContext({
  // ── Raw auth state ────────────────────────────────────────────────────────
  session: null,
  profile: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  isConfigured: false,

  // ── Canonical tier authority ──────────────────────────────────────────────
  // `tier` is always one of 'free' | 'pro' | 'ultra'. While the profile
  // is loading we deliberately return 'free' so unauthenticated UI defaults
  // to the locked-down experience - never accidentally Pro.
  tier: 'free',
  isFree: true,
  isPro: false,
  isUltra: false,
  // Set<string> of agent names this tier unlocks (server-derived).
  unlockedAgents: new Set(),
  // (name) => boolean - convenience predicate.
  canUseAgent: () => false,
  // The full TierLimits dict for `tier`, mirroring the backend.
  tierLimits: null,
  // Server-derived usage counters. Same shape as `/agents`.usage.
  usage: {},
  // True while either /v1/me or /v1/agents is in flight on initial load.
  tierLoading: true,

  // ── Auth actions ──────────────────────────────────────────────────────────
  signInWithPassword: async () => {},
  signUpWithPassword: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  // Re-fetch /v1/me + /v1/agents.
  refreshProfile: async () => {},
});
