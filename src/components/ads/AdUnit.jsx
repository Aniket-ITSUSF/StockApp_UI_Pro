import { useEffect, useRef, useState } from 'react';
import { PUBLISHER_ID } from '../../utils/adsense';
import { useAdContext } from './adContext';

export default function AdUnit({
  slot,
  format = 'auto',
  layout,
  layoutKey,
  responsive = true,
  minHeight = 90,
  style,
  className = '',
  label = 'Advertisement',
}) {
  const { adsEnabled, personalized, consentChosen } = useAdContext();
  const ref = useRef(null);
  const pushedRef = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!adsEnabled || !ref.current) return;
    const node = ref.current;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [adsEnabled]);

  useEffect(() => {
    if (!visible || pushedRef.current) return;
    if (!consentChosen) return; // wait for cookie choice before pushing any ad
    if (import.meta.env.DEV) return;
    if (!slot) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushedRef.current = true;
    } catch {
      // AdSense push errors are non-fatal — slot stays empty
    }
  }, [visible, slot, consentChosen]);

  if (!adsEnabled || !consentChosen) return null;
  // In production, a missing slot ID means the slot hasn't been created in AdSense yet — render nothing.
  if (!import.meta.env.DEV && !slot) return null;

  const wrapStyle = { minHeight, width: '100%', ...style };

  if (import.meta.env.DEV) {
    return (
      <div
        ref={ref}
        style={wrapStyle}
        className={`flex items-center justify-center border-2 border-dashed border-zinc-700 text-xs text-zinc-500 rounded ${className}`}
      >
        AD · {format}
        {slot ? ` · ${slot}` : ' · no slot'}
      </div>
    );
  }

  return (
    <div ref={ref} style={wrapStyle} className={`ad-slot ${className}`} aria-label={label}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', height: '100%' }}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        {...(layout ? { 'data-ad-layout': layout } : {})}
        {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
        {...(responsive ? { 'data-full-width-responsive': 'true' } : {})}
        {...(!personalized ? { 'data-npa': '1' } : {})}
      />
    </div>
  );
}
