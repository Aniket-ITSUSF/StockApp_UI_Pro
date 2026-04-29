import { Loader2 } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * AuthGate - wraps any route that requires a signed-in user.
 *
 * When Supabase isn't configured (local dev w/o keys), the gate transparently
 * passes through so the app stays usable. When configured but the user is
 * not signed in, redirects to `/sign-in` while preserving the originally
 * requested URL in `location.state.from`.
 */
export default function AuthGate({ children }) {
  const { session, loading, isConfigured } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <Loader2 size={20} className="animate-spin mr-2" />
        <span className="text-sm">Loading…</span>
      </div>
    );
  }

  // Local dev without Supabase env vars - let the app render so devs can work
  // on UI without setting up auth. Production deployments always have
  // VITE_SUPABASE_URL set, so this branch is dev-only.
  if (!isConfigured) return children;

  const isAuthenticated = Boolean(session?.access_token);
  if (!isAuthenticated) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname + location.search }} />;
  }

  return children;
}
