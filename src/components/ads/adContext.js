import { createContext, useContext } from 'react';

export const AdContext = createContext({
  adsEnabled: false,
  personalized: false,
  consentChosen: false,
  consentChoice: null,
  setConsentChoice: () => {},
});

export function useAdContext() {
  return useContext(AdContext);
}
