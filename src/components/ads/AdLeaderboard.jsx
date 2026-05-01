import AdUnit from './AdUnit';
import { SLOTS } from '../../utils/adsense';

export default function AdLeaderboard({ className = '' }) {
  return (
    <div className={`w-full flex justify-center ${className}`}>
      <AdUnit
        slot={SLOTS.leaderboard}
        format="horizontal"
        minHeight={90}
        style={{ maxWidth: 728 }}
      />
    </div>
  );
}
