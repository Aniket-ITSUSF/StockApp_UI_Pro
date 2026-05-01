export const PUBLISHER_ID = 'ca-pub-8876981432389412';

export const ADSENSE_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUBLISHER_ID}`;

// Slot IDs come from AdSense dashboard → Ads → By ad unit → create unit → copy data-ad-slot.
// Leave as null until created; AdUnit will render dev placeholder when slot is missing in prod too.
export const SLOTS = {
  leaderboard: null,
  sidebar:     null,
  inFeed:      null,
  anchor:      null,
  rewarded:    null,
};
