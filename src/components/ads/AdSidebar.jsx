import AdUnit from './AdUnit';
import { SLOTS } from '../../utils/adsense';

// `compact` = narrow rail (used inside Sidebar.jsx, ~200px wide)
// default  = standard rectangle (used in main content right column)
export default function AdSidebar({ compact = false, className = '' }) {
  return (
    <AdUnit
      slot={SLOTS.sidebar}
      format={compact ? 'auto' : 'rectangle'}
      minHeight={compact ? 200 : 250}
      className={className}
    />
  );
}
