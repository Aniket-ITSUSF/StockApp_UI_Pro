/**
 * Tooltip — renders via position:fixed so it escapes all overflow:hidden parents.
 *
 * Props:
 *   content  — string or JSX
 *   position — 'top' (default) | 'bottom'
 *   width    — pixel width of the bubble (default 208 ≈ w-52)
 *   align    — 'center' (default) | 'left' | 'right'
 */
import { useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

const GAP = 8;

export default function Tooltip({
  content,
  children,
  position = 'top',
  width = 208,
  align = 'center',
}) {
  const triggerRef  = useRef(null);
  const [pos, setPos] = useState(null);

  const show = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ rect: r });
  }, []);

  const hide = useCallback(() => setPos(null), []);

  let bubbleStyle = { width };
  if (pos) {
    const { rect } = pos;
    const isTop = position !== 'bottom';

    if (isTop) {
      bubbleStyle.bottom = window.innerHeight - rect.top + GAP;
    } else {
      bubbleStyle.top = rect.bottom + GAP;
    }

    if (align === 'right') {
      bubbleStyle.right = window.innerWidth - rect.right;
    } else if (align === 'left') {
      bubbleStyle.left = rect.left;
    } else {
      const centerX = rect.left + rect.width / 2;
      bubbleStyle.left = Math.max(8, Math.min(centerX - width / 2, window.innerWidth - width - 8));
    }
  }

  const isTop = position !== 'bottom';

  const arrowOffset =
    align === 'right'  ? 'right-3' :
    align === 'left'   ? 'left-3'  :
    'left-1/2 -translate-x-1/2';

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-flex"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </div>

      {pos && createPortal(
        <div
          className="pointer-events-none fixed z-[99999]
            bg-slate-800 border border-slate-700
            text-slate-200 text-xs leading-relaxed
            rounded-lg px-3 py-2 shadow-xl
            whitespace-normal text-left"
          style={bubbleStyle}
        >
          {content}
          <span
            className={`
              absolute ${arrowOffset} border-4 border-transparent
              ${isTop ? 'top-full border-t-slate-700' : 'bottom-full border-b-slate-700'}
            `}
          />
        </div>,
        document.body,
      )}
    </>
  );
}
