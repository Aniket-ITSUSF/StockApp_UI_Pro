const STORAGE_KEY = 'analyze_screen_tour_v1_1';

export function shouldShowAnalyzeScreenTour() {
  try { return window.localStorage.getItem(STORAGE_KEY) !== 'true'; } catch { return false; }
}

export function markAnalyzeScreenTourDone() {
  try { window.localStorage.setItem(STORAGE_KEY, 'true'); } catch { /* ignore */ }
}
