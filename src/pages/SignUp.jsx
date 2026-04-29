import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import AuthShell, { Field, ErrorBanner, Divider, ConfigurationMissing } from '../components/AuthShell';

export default function SignUp() {
  const { signUpWithPassword, signInWithGoogle, isConfigured, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,    setError]    = useState(null);
  const [success,  setSuccess]  = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/analyze', { replace: true });
  }, [isAuthenticated, navigate]);

  if (!isConfigured) {
    return (
      <ConfigurationMissing
        message="Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to enable sign-up."
      />
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signUpWithPassword(email.trim(), password);
      setSuccess(true);
    } catch (err) {
      setError(err.message ?? 'Sign-up failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="We sent a confirmation link"
        footer={(
          <Link
            to="/sign-in"
            className="block text-center text-sm text-slate-400 hover:text-slate-200"
          >
            ← Back to sign in
          </Link>
        )}
      >
        <div className="flex items-start gap-2.5 text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3">
          <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
          <span>
            Click the link in the email we just sent to <strong>{email}</strong> to verify your
            account, then come back here to sign in.
          </span>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start free - upgrade to Pro anytime"
      footer={(
        <p className="text-sm text-slate-500 text-center">
          Already have an account?{' '}
          <Link to="/sign-in" className="text-emerald-400 hover:text-emerald-300 font-semibold">
            Sign in
          </Link>
        </p>
      )}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          minLength={8}
          required
        />
        {error && <ErrorBanner message={error} />}
        <button
          type="submit"
          disabled={submitting || loading}
          className="mt-1 w-full inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg px-4 py-3 transition-colors shadow-md shadow-emerald-500/20"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
          Create account
        </button>
      </form>

      <Divider label="or" />

      <button
        type="button"
        onClick={signInWithGoogle}
        className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-medium rounded-lg px-4 py-2.5 transition-colors"
      >
        Continue with Google
      </button>
    </AuthShell>
  );
}
