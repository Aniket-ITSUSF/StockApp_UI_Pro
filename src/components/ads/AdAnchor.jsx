import { useState } from 'react';
import { X } from 'lucide-react';
import AdUnit from './AdUnit';
import { SLOTS } from '../../utils/adsense';
import { useAdContext } from './adContext';

const STORAGE_KEY = 'ad_anchor_dismissed';

function readDismissed() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export default function AdAnchor() {
  const { adsEnabled, consentChosen } = useAdContext();
  const [dismissed, setDismissed] = useState(() => readDismissed());

  if (!adsEnabled || !consentChosen || dismissed) return null;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Storage can be unavailable in private browsing.
    }
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
