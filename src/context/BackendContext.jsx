import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getHealth } from '../services/api';

/**
 * Provides real-time backend connection status to the whole app.
 *
 * status:  'checking' | 'connected' | 'disconnected'
 * retry:   () => void   - call to manually trigger a health check
 *
 * Backend URL is intentionally NOT exposed - never surface infra endpoints to users.
 */
const BackendContext = createContext(null);

const POLL_INTERVAL_MS = 30_000; // re-check every 30 seconds

export function BackendProvider({ children }) {
  const [status,      setStatus]      = useState('checking');
  const [lastChecked, setLastChecked] = useState(null);
  const timerRef = useRef(null);

  const check = useCallback(async () => {
    setStatus('checking');
    try {
      await getHealth();
      setStatus('connected');
    } catch {
      setStatus('disconnected');
    }
    setLastChecked(new Date());
  }, []);

  // Check on mount, then on interval
  useEffect(() => {
    check();
    timerRef.current = setInterval(check, POLL_INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [check]);

  return (
    <BackendContext.Provider value={{ status, lastChecked, retry: check }}>
      {children}
    </BackendContext.Provider>
  );
}

export const useBackend = () => useContext(BackendContext);
