import { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';
import { readConsent, writeConsent } from '../utils/consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (readConsent() === null) setVisible(true);
  }, []);

  if (!visible) return null;

  const choose = (choice) => {
    writeConsent(choice);
    setVisible(false);
    // Reload so AdSense initializes with the chosen personalization mode
    if (typeof window !== 'undefined') window.location.reload();
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed left-0 right-0 z-[60] bg-slate-900/95 backdrop-blur-md border-t border-slate-700 shadow-2xl"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0px)' }}
    >
      <div className="max-w-5xl mx-auto px-4 py-4 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Cookie size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300 leading-relaxed">
            We use essential cookies to operate AlphaDesk and, with your consent, additional cookies for personalized ads and measurement.{' '}
            <a href="/privacy.html" className="text-emerald-400 hover:text-emerald-300 underline" target="_blank" rel="noopener">
              Privacy Policy
            </a>
            {' · '}
            <a href="/terms.html" className="text-emerald-400 hover:text-emerald-300 underline" target="_blank" rel="noopener">
              Terms
            </a>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => choose('essential')}
            className="flex-1 sm:flex-initial text-xs font-semibold text-slate-300 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg px-4 py-2 transition-colors"
          >
            Essential only
          </button>
          <button
            onClick={() => choose('all')}
            className="flex-1 sm:flex-initial text-xs font-semibold text-emerald-50 bg-emerald-500 hover:bg-emerald-400 rounded-lg px-4 py-2 transition-colors shadow-lg shadow-emerald-500/20"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
