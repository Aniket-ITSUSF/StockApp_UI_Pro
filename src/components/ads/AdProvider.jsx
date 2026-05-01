import { createContext, useContext, useMemo } from 'react';
import { useAdsEnabled } from '../../hooks/useAdsEnabled';
import { readConsent, consentGivenForPersonalized } from '../../utils/consent';

// AdSense loader script is in index.html so AdSense's crawler can verify the site
// on first load. AdUnit gates whether to call adsbygoogle.push({}) based on consent.
const AdContext = createContext({ adsEnabled: false, personalized: false, consentChosen: false });

export function AdProvider({ children }) {
  const adsEnabled = useAdsEnabled();
  // Read once at mount — CookieConsent reloads the page on choice, so this stays in sync.
  const consentChoice = readConsent();
  const consentChosen = consentChoice !== null;
  const personalized  = consentGivenForPersonalized();

  const value = useMemo(
    () => ({ adsEnabled, personalized, consentChosen }),
    [adsEnabled, personalized, consentChosen]
  );
  return <AdContext.Provider value={value}>{children}</AdContext.Provider>;
}

export function useAdContext() {
  return useContext(AdContext);
}
