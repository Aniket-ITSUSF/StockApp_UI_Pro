import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import api from '../services/api';
import { AuthContext } from './auth-context-instance';

/**
 * AuthProvider - single source of truth for the signed-in user AND for the
 * user's subscription tier across the entire UI.
 *
 * State slices:
 *   1. `session`     - Supabase JWT + refresh token (kept fresh by supabase-js).
 *   2. `profile`     - backend `/v1/me` view (subscription, market, usage).
 *   3. `catalogue`   - backend `/v1/agents` view (per-agent unlock + tier_limits).
 *
 * Tier authority rules (DO NOT VIOLATE IN NEW COMPONENTS):
 *   - The canonical `tier` exposed here is ALWAYS the backend-computed
 *     `effective_tier` from `/v1/me` (or `/v1/agents` for anonymous callers).
 *     Never `subscription_tier` raw - that ignores expiry/lapsed status.
 *   - While either fetch is in flight, `tierLoading` is true and `tier`
 *     stays at 'free'. UI must NOT flash a paid-tier UI before the
 *     server confirms entitlement.
 *   - The set of unlocked agents comes from /v1/agents and is the same
 *     mapping the backend uses to redact /evaluate responses, so the UI
 *     and the server can never disagree about which agents are visible.
 *
 * Components consume this via `useAuth()` and read `tier`, `isPro`,
 * `isUltra`, `canUseAgent(name)`, `unlockedAgents`. There is an ESLint
 * rule banning direct `profile.subscription_tier` reads outside this file.
 */

const VALID_TIERS = new Set(['free', 'pro', 'ultra']);

/**
 * Normalise whatever shape the backend hands us into one of the three
 * canonical tier strings. Anything unrecognised collapses to 'free' so a
 * malformed backend response can never accidentally unlock paid UI.
 */
function normaliseTier(raw) {
  if (typeof raw !== 'string') return 'free';
  const lc = raw.toLowerCase();
  return VALID_TIERS.has(lc) ? lc : 'free';
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  // The /v1/agents catalogue: { tier, agents, tier_limits, usage }. Carried
  // here so every component shares the same per-agent unlock state.
  const [catalogue, setCatalogue] = useState(null);
  // Start `loading` false when Supabase isn't configured so the rest of the
  // app doesn't hang on a perpetual auth check during local dev without keys.
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [tierLoading, setTierLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Pull /v1/me + /v1/agents in parallel ─────────────────────────────────
  // Both endpoints are tier-aware and re-derive `effective_tier` server-side
  // from the DB row. /agents is also called for anonymous visitors (it
  // gracefully returns the free-tier view) so locked components have a
  // consistent unlocked-set even before sign-in.
  const refreshProfile = useCallback(async () => {
    setTierLoading(true);
    const hasToken = Boolean(session?.access_token);

    try {
      const meReq = hasToken ? api.get('/v1/me') : Promise.resolve(null);
      const agentsReq = api.get('/v1/agents');
      const [meRes, agentsRes] = await Promise.allSettled([meReq, agentsReq]);

      // /v1/me - only meaningful when authed.
      if (hasToken) {
        if (meRes.status === 'fulfilled' && meRes.value) {
          setProfile(meRes.value.data);
          setError(null);
        } else {
          // 401 here means the JWT expired between fetch & call - supabase
          // will refresh the token on the next tick; don't surface the error.
          const status = meRes.reason?.response?.status;
          if (status !== 401) setError(meRes.reason ?? new Error('me fetch failed'));
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      // /v1/agents - public, always populated.
      if (agentsRes.status === 'fulfilled') {
        setCatalogue(agentsRes.value.data);
      } else {
        // Don't blank an existing catalogue on a transient error; just log.
        console.warn('[AuthContext] /v1/agents failed:', agentsRes.reason);
      }
    } finally {
      setTierLoading(false);
    }
  }, [session?.access_token]);

  // ── Subscribe to Supabase auth state changes ──────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    let active = true;

    // Hydrate from localStorage on first paint.
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    // Stay in sync with sign-in / sign-out / token-refresh events.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!active) return;
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription?.subscription?.unsubscribe?.();
    };
  }, []);

  // Fetch /me + /agents whenever the session token changes (login, refresh,
  // logout). Wrapped in queueMicrotask so the synchronous body of the effect
  // doesn't contain a setState call (React Compiler / strict mode lint).
  useEffect(() => {
    queueMicrotask(() => { refreshProfile(); });
  }, [refreshProfile]);

  // ── Auth actions exposed to the rest of the app ───────────────────────────
  const signInWithPassword = useCallback(async (email, password) => {
    const { data, error: e } = await supabase.auth.signInWithPassword({ email, password });
    if (e) throw e;
    return data;
  }, []);

  const signUpWithPassword = useCallback(async (email, password) => {
    const { data, error: e } = await supabase.auth.signUp({ email, password });
    if (e) throw e;
    return data;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { data, error: e } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (e) throw e;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setCatalogue(null);
  }, []);

  // ── Derived tier authority ────────────────────────────────────────────────
  // Order of preference, mirroring the backend's `effective_tier`:
  //   1. profile.effective_tier (subscription-validity-aware, server-derived)
  //   2. catalogue.tier         (same, but available even pre-/me/)
  //   3. 'free'                 (anonymous + initial-paint fallback)
  // We deliberately DO NOT consult profile.subscription_tier here - it can
  // be 'pro' on a row whose subscription has lapsed, in which case the
  // server already returns effective_tier='free'. Reading the raw column
  // is the bug we're killing.
  const tier = useMemo(
    () => normaliseTier(profile?.effective_tier ?? catalogue?.tier ?? 'free'),
    [profile?.effective_tier, catalogue?.tier],
  );

  const unlockedAgents = useMemo(() => {
    const list = catalogue?.agents ?? [];
    return new Set(list.filter((a) => a.is_unlocked).map((a) => a.name));
  }, [catalogue?.agents]);

  const canUseAgent = useCallback(
    (name) => unlockedAgents.has(name),
    [unlockedAgents],
  );

  const tierLimits = useMemo(
    () => catalogue?.tier_limits?.[tier] ?? null,
    [catalogue?.tier_limits, tier],
  );

  const usage = useMemo(
    () => catalogue?.usage?.usage ?? profile?.usage_summary?.usage ?? {},
    [catalogue?.usage?.usage, profile?.usage_summary?.usage],
  );

  const value = useMemo(
    () => ({
      // raw
      session,
      profile,
      loading,
      error,
      isAuthenticated: Boolean(session?.access_token),
      isConfigured: isSupabaseConfigured,
      // tier authority
      tier,
      isFree: tier === 'free',
      isPro: tier === 'pro' || tier === 'ultra',
      isUltra: tier === 'ultra',
      unlockedAgents,
      canUseAgent,
      tierLimits,
      usage,
      tierLoading,
      // raw catalogue exposed for the Settings page (renders agent grid).
      // Treated as read-only metadata; never derive tier from it directly.
      agentsCatalogue: catalogue,
      // actions
      signInWithPassword,
      signUpWithPassword,
      signInWithGoogle,
      signOut,
      refreshProfile,
    }),
    [
      session, profile, catalogue, loading, error,
      tier, unlockedAgents, canUseAgent, tierLimits, usage, tierLoading,
      signInWithPassword, signUpWithPassword, signInWithGoogle, signOut, refreshProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

