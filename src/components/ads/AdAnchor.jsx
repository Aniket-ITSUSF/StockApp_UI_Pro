import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import AdUnit from './AdUnit';
import { SLOTS } from '../../utils/adsense';
import { useAdContext } from './AdProvider';

const STORAGE_KEY = 'ad_anchor_dismissed';

export default function AdAnchor() {
  const { adsEnabled } = useAdContext();
  const [dismissed, setDismissed] = useState(true); // start hidden, settle on mount to avoid SSR-style flash

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!adsEnabled || dismissed) return null;

  const handleDismiss = () => {
    try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch {}
    setDismissed(true);
  };

  return (
    <div
      className="md:hidden fixed left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 56px)' }}
    >
      <div className="flex items-stretch">
        <div className="flex-1 min-w-0">
          <AdUnit slot={SLOTS.anchor} format="horizontal" minHeight={50} />
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss ad"
          className="shrink-0 px-2 text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors flex items-center"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
