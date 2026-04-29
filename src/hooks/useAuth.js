import { useContext } from 'react';
import { AuthContext } from '../context/auth-context-instance';

/**
 * Read the auth state from anywhere in the tree.
 *
 * Lives in its own file so React Fast Refresh can keep AuthContext.jsx as a
 * pure-component module (mixing component exports with hook exports breaks HMR).
 */
export function useAuth() {
  return useContext(AuthContext);
}
