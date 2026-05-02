const STORAGE_KEY = 'cookie_consent_v1';

// 'all'      → personalized ads + analytics OK
// 'essential' → non-personalized ads only (data-npa=1), no analytics cookies
// null       → user has not chosen yet (banner shows)
export function readConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.choice ?? null;
  } catch {
    return null;
  }
}

export function writeConsent(choice) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ choice, ts: Date.now() }));
  } catch {
    // private mode or storage disabled - fall back to in-memory only
  }
}

export function consentGivenForPersonalized(choice = readConsent()) {
  return choice === 'all';
}
