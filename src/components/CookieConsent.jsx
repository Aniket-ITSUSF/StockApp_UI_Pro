import { Cookie, ShieldCheck } from 'lucide-react';
import { readConsent, writeConsent } from '../utils/consent';
import { useAdContext } from './ads/adContext';

export default function CookieConsent() {
  const { consentChoice, setConsentChoice } = useAdContext();
  const visible = consentChoice === null && readConsent() === null;

  const choose = (choice) => {
    writeConsent(choice);
    setConsentChoice(choice);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cookie consent"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-2">
            <Cookie size={20} className="text-amber-300" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-100">Choose your cookie settings</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              We use essential storage to keep the app working. With your permission, we also use
              ad cookies for personalized ads and measurement. We will not load ad scripts or ad
              units until you choose an option.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-3">
          <div className="flex items-start gap-2">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-400" />
            <p className="text-xs leading-relaxed text-slate-400">
              Your choice is saved in this browser using local storage, so we do not ask again on
              every visit. You can clear site data if you want to reset it.
            </p>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Read our{' '}
            <a href="/privacy.html" className="text-emerald-400 hover:text-emerald-300 underline" target="_blank" rel="noopener">
              Privacy Policy
            </a>
            {' '}and{' '}
            <a href="/terms.html" className="text-emerald-400 hover:text-emerald-300 underline" target="_blank" rel="noopener">
              Terms
            </a>
            .
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            onClick={() => choose('essential')}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-700"
          >
            Essential only
          </button>
          <button
            onClick={() => choose('all')}
            className="rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-emerald-950 shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-400"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
