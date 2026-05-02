import Tooltip from './Tooltip';
import { AGENTS, voteStyle } from './agentVoteMeta';

/**
 * 4-column grid of agent vote chips with hover tooltips.
 * Pass `evaluation` object with vote keys matching AGENTS[].key.
 */
export default function AgentVoteGrid({ evaluation: ev }) {
  return (
    <div className="grid grid-cols-2 min-[420px]:grid-cols-4 gap-1.5">
      {AGENTS.map(({ key, label, name, tip }) => {
        const vote = ev?.[key];
        return (
          <Tooltip key={key} content={<><strong>{name}</strong><br />{tip}</>} width={256}>
            <div
              className={`w-full flex flex-col items-center justify-center rounded-lg border py-1.5 cursor-default select-none ${voteStyle(vote)}`}
            >
              <span className="text-xs font-bold">{label}</span>
              <span className="text-xs opacity-70 mt-0.5 leading-none">
                {vote ? vote.substring(0, 4).toUpperCase() : 'N/A'}
              </span>
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}
