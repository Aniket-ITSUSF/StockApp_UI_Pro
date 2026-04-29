import { Navigate } from 'react-router-dom';

/**
 * `/` - always lands on /analyze. Kept as its own component so we can
 * add post-login onboarding logic here later (e.g. first-time-user redirect
 * to /plans, or honouring `?next=` query params from email confirmations).
 */
export default function HomeRedirect() {
  return <Navigate to="/analyze" replace />;
}
