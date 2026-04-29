import { LogIn, LogOut, UserCircle, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * AuthBadge - sidebar widget showing current auth status.
 *
 * Phase 8a: clicking "Sign in" navigates to /sign-in (preserving the current
 * URL in `state.from` so we return there after a successful login).
 */
export default function AuthBadge({ compact = false }) {
  // Tier comes ONLY from context - never from `profile.subscription_tier`,
  // which would show "PRO" on a lapsed subscription.
  const { session, profile, loading, signOut, isConfigured, tier, tierLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = Boolean(session?.access_token);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500 px-3 py-2">
        <Loader2 size={11} className="animate-spin" />
        <span>Loading…</span>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="text-xs text-slate-400 px-3 py-2 leading-tight">
        Auth not configured —<br />set VITE_SUPABASE_URL.
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/40 min-w-0">
        <UserCircle size={14} className="text-emerald-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-200 truncate">
            {profile?.email ?? session?.user?.email ?? 'Signed in'}
          </p>
          <p className="text-xs text-slate-400 truncate">
            {/* While tier is resolving show a subtle dash instead of an
                authoritative-looking "FREE" - prevents flashing the wrong
                tier on the user during /v1/me's first round-trip. */}
            {tierLoading ? '…' : tier.toUpperCase()}
            {profile?.market_preference ? ` · ${profile.market_preference}` : ''}
          </p>
        </div>
        <button
          onClick={async () => {
            await signOut();
            navigate('/sign-in', { replace: true });
          }}
          title="Sign out"
          className="text-slate-500 hover:text-rose-400 transition-colors p-1"
        >
          <LogOut size={12} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => navigate('/sign-in', { state: { from: location.pathname + location.search } })}
      className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-400 text-xs font-semibold transition-colors"
    >
      <LogIn size={11} />
      Sign in {compact ? '' : '/ Sign up'}
    </button>
  );
}
