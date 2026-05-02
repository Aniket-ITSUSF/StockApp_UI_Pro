import { useEffect, useMemo, useState } from 'react';
import { useAdsEnabled } from '../../hooks/useAdsEnabled';
import { ADSENSE_SCRIPT_SRC } from '../../utils/adsense';
import { readConsent, consentGivenForPersonalized } from '../../utils/consent';
import { AdContext } from './adContext';

export function AdProvider({ children }) {
  const adsEnabled = useAdsEnabled();
  const [consentChoice, setConsentChoice] = useState(() => readConsent());
  const consentChosen = consentChoice !== null;
  const personalized  = consentChoice ? consentGivenForPersonalized(consentChoice) : false;

  useEffect(() => {
    if (!adsEnabled || !consentChosen || import.meta.env.DEV) return;
    if (document.querySelector(`script[src="${ADSENSE_SCRIPT_SRC}"]`)) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = ADSENSE_SCRIPT_SRC;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }, [adsEnabled, consentChosen]);

  const value = useMemo(
    () => ({ adsEnabled, personalized, consentChosen, consentChoice, setConsentChoice }),
    [adsEnabled, personalized, consentChosen, consentChoice]
  );
  return <AdContext.Provider value={value}>{children}</AdContext.Provider>;
}
