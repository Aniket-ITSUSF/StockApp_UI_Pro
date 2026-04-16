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
 *   align    — 'center' (default) | 'left' | 'right'
 *              'right' anchors the bubble to the right edge of the trigger (extends leftward)
 *              'left'  anchors the bubble to the left edge of the trigger (extends rightward)
 */
export default function Tooltip({ content, children, position = 'top', width = 'w-52', align = 'center' }) {
  const isTop = position !== 'bottom';

  const horizClass =
    align === 'right'  ? 'right-0' :
    align === 'left'   ? 'left-0'  :
    'left-1/2 -translate-x-1/2';

  const arrowClass =
    align === 'right'  ? 'right-3' :
    align === 'left'   ? 'left-3'  :
    'left-1/2 -translate-x-1/2';

  return (
    <div className="relative group inline-flex">
      {children}

      {/* Bubble */}
      <div
        className={`
          pointer-events-none absolute z-[9999]
          ${width} ${isTop ? 'bottom-full mb-2' : 'top-full mt-2'}
          ${horizClass}
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
            absolute ${arrowClass}
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
