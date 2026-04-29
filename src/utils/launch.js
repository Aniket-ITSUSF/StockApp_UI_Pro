/**
 * Launch-phase feature flags.
 *
 * Right now we're only live for the Indian market. To re-enable US support
 * (sidebar toggle, Analyze market dropdown, Pre-Market US session, etc.),
 * flip `US_ENABLED` to `true` and ship.
 *
 * Keep this file dependency-free so it's safe to import from anywhere.
 */
export const US_ENABLED = false;

export const DEFAULT_MARKET = 'IN';

/**
 * Turn the API error response into a human-readable string. The backend
 * returns dict-shaped `detail` objects for tier/quota errors:
 *
 *   { error, agent, current_tier, required_tier, upgrade_url, message }
 *   { error, namespace, used, limit, period, current_tier, message }
 *
 * Older endpoints return plain strings. Network errors carry an `err.message`.
 */
export function describeApiError(err, fallback = 'Request failed') {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail === 'object') {
    return detail.message || detail.error || fallback;
  }
  return err?.message ?? fallback;
}

/**
 * Pull the structured upgrade hint out of a 402/429 response so we can
 * render an inline upgrade card with the right CTA. Returns null for
 * regular errors.
 */
export function extractUpgradeHint(err) {
  const detail = err?.response?.data?.detail;
  if (!detail || typeof detail !== 'object') return null;
  if (detail.error === 'tier_required') {
    return {
      kind: 'tier',
      message:        detail.message ?? 'Upgrade required',
      currentTier:    detail.current_tier,
      requiredTier:   detail.required_tier,
      upgradeUrl:     detail.upgrade_url ?? '/plans',
    };
  }
  if (detail.error === 'monthly_quota_exceeded') {
    return {
      kind: 'quota',
      message:      detail.message ?? 'Monthly limit reached',
      used:         detail.used,
      limit:        detail.limit,
      currentTier:  detail.current_tier,
      upgradeUrl:   detail.upgrade_url ?? '/plans',
    };
  }
  return null;
}
