import { useState, useEffect, useCallback } from 'react';
import { getPreMarketHotlist, evaluateTickerFast } from '../services/api';

/**
 * Fetches today's pre-market hotlist for the given session, then runs
 * evaluateTickerFast() concurrently for every ticker.  Returns merged items
 * (hotlist fields + alpha_score, current_price, regime from fast eval).
 *
 * Fast eval is math-only — zero LLM tokens consumed.
 */
export function useHotTradesFastEval(session = 'US') {
  const [items,   setItems]   = useState([]);
  const [meta,    setMeta]    = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res    = await getPreMarketHotlist(session);
      const data   = res.data ?? {};
      const hotlist = data.hotlist ?? [];

      setMeta({
        macro_context:  data.macro_context,
        analyst_note:   data.analyst_note,
        run_timestamp:  data.run_timestamp,
        valid_until:    data.valid_until,
      });

      if (hotlist.length === 0) {
        setItems([]);
        return;
      }

      // Parallel fast eval — Promise.allSettled so one failure never blocks others
      const evals = await Promise.allSettled(
        hotlist.map((item) => evaluateTickerFast(item.ticker))
      );

      const merged = hotlist.map((item, i) => {
        const ev = evals[i].status === 'fulfilled' ? evals[i].value.data : null;
        return {
          ...item,
          alpha_score:   ev?.weighted_alpha_score ?? null,
          current_price: ev?.current_price        ?? null,
          regime:        ev?.regime               ?? null,
        };
      });

      setItems(merged);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { load(); }, [load]);

  return { items, meta, loading, reload: load };
}
