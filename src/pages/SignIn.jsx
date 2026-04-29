import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import AuthShell, { Field, ErrorBanner, Divider, ConfigurationMissing } from '../components/AuthShell';

/**
 * /sign-in - email + password plus Google OAuth.
 *
 * Honours `location.state.from` so AuthGate can redirect users back to the
 * page they originally requested (e.g. /analyze?ticker=AAPL).
 */
export default function SignIn() {
  const { signInWithPassword, signInWithGoogle, isConfigured, loading, isAuthenticated } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const fallback  = '/analyze';
  const from      = location.state?.from ?? fallback;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // If already signed in (e.g. user hit /sign-in after auth), bounce them out.
  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  if (!isConfigured) {
    return (
      <ConfigurationMissing
        message="Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to enable sign-in."
      />
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithPassword(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message ?? 'Sign-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      await signInWithGoogle();
      // Supabase OAuth performs a redirect; navigation happens after callback.
    } catch (err) {
      setError(err.message ?? 'Google sign-in failed');
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your EquiQuant account"
      footer={(
        <p className="text-sm text-slate-500 text-center">
          Don&apos;t have an account?{' '}
          <Link to="/sign-up" className="text-emerald-400 hover:text-emerald-300 font-semibold">
            Create one
          </Link>
        </p>
      )}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          required
        />
        {error && <ErrorBanner message={error} />}
        <button
          type="submit"
          disabled={submitting || loading}
          className="mt-1 w-full inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg px-4 py-3 transition-colors shadow-md shadow-emerald-500/20"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
          Sign in
        </button>
      </form>

      <Divider label="or" />

      <button
        type="button"
        onClick={handleGoogle}
        className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-medium rounded-lg px-4 py-2.5 transition-colors"
      >
        Continue with Google
      </button>
    </AuthShell>
  );
}
