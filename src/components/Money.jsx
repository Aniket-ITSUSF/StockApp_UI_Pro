import { formatMoney } from '../utils/format';

/**
 * <Money> - locale-aware currency display.
 *
 *   <Money value={share.price} currency={share.currency} />
 *
 * Renders USD as `$1,234.56` and INR as `₹1,23,456.00`.
 */
export default function Money({ value, currency = 'USD', compact = false, className = '' }) {
  return <span className={className}>{formatMoney(value, currency, { compact })}</span>;
}
