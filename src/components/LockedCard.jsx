import { Lock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Pro-only feature placeholder. Used on the Analyze page (and anywhere else
 * we need to soft-block free users without hiding the feature entirely).
 *
 * Pass `preview` to render a blurred-but-visible teaser of the gated content
 * underneath the lock; pass nothing for a clean upgrade card.
 */
export default function LockedCard({
  title,
  description,
  ctaLabel = 'Upgrade to unlock',
  preview = null,
  className = '',
}) {
  const navigate = useNavigate();

  return (
    <div className={`relative overflow-hidden rounded-xl border border-amber-500/20 bg-gradient-to-br from-slate-900 to-slate-900/40 ${className}`}>

      {preview && (
        <div className="absolute inset-0 pointer-events-none select-none opacity-30 blur-[2px]">
          {preview}
        </div>
      )}

      <div className="relative z-10 p-5 flex flex-col gap-3 items-start">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-full px-2 py-0.5">
          <Lock size={10} />
          Pro feature
        </span>
        <h3 className="text-base font-bold text-slate-100">{title}</h3>
        {description && (
          <p className="text-sm text-slate-400 leading-relaxed max-w-md">{description}</p>
        )}
        <button
          type="button"
          onClick={() => navigate('/plans')}
          className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-sm font-bold shadow-md shadow-amber-500/20 hover:shadow-amber-500/40 transition-shadow"
        >
          <Sparkles size={14} />
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
