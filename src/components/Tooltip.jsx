/**
 * CSS-only tooltip using Tailwind group-hover.
 * No state, no portal — works inside overflow-hidden containers
 * as long as the nearest positioned ancestor has enough room.
 *
 * Usage:
 *   <Tooltip content="This is the explanation">
 *     <SomeTriggerElement />
 *   </Tooltip>
 *
 * Props:
 *   content  — string or JSX shown inside the tooltip bubble
 *   position — 'top' (default) | 'bottom'
 *   width    — tailwind width class, e.g. 'w-52' (default)
 */
export default function Tooltip({ content, children, position = 'top', width = 'w-52' }) {
  const isTop = position !== 'bottom';

  return (
    <div className="relative group inline-flex">
      {children}

      {/* Bubble */}
      <div
        className={`
          pointer-events-none absolute z-50
          ${width} ${isTop ? 'bottom-full mb-2' : 'top-full mt-2'}
          left-1/2 -translate-x-1/2
          opacity-0 group-hover:opacity-100
          transition-opacity duration-150
          bg-slate-800 border border-slate-700
          text-slate-200 text-xs leading-relaxed
          rounded-lg px-3 py-2 shadow-xl
          whitespace-normal text-left
        `}
      >
        {content}

        {/* Arrow */}
        <span
          className={`
            absolute left-1/2 -translate-x-1/2
            border-4 border-transparent
            ${isTop
              ? 'top-full border-t-slate-700'
              : 'bottom-full border-b-slate-700'}
          `}
        />
      </div>
    </div>
  );
}
