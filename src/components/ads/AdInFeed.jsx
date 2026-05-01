import AdUnit from './AdUnit';
import { SLOTS } from '../../utils/adsense';

export default function AdInFeed({ className = '', minHeight = 150 }) {
  return (
    <AdUnit
      slot={SLOTS.inFeed}
      format="fluid"
      layout="in-article"
      minHeight={minHeight}
      className={className}
    />
  );
}
