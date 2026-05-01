// Returns true when the current viewer should see ads.
//
// Main branch has no auth/tier system, so everyone sees ads.
// When prod_version (with AuthContext + tiers) merges, replace the body with:
//
//   const { profile, catalogue, tierLoading } = useAuth();
//   if (tierLoading) return false;
//   const tier = profile?.effective_tier ?? catalogue?.tier ?? 'free';
//   return tier === 'free';
export function useAdsEnabled() {
  return true;
}
