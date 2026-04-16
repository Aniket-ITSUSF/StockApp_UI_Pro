import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function HorizontalCarousel({ items = [], renderItem, emptyNode = null }) {
  const trackRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const t = trackRef.current;
    if (!t) return;
    setCanPrev(t.scrollLeft > 4);
    setCanNext(t.scrollLeft < t.scrollWidth - t.clientWidth - 4);
  }, []);

  const scrollCards = useCallback((dir) => {
    const t = trackRef.current;
    if (!t) return;
    const child = t.firstElementChild;
    const cardW = child ? child.offsetWidth + 16 : 340;
    t.scrollBy({ left: dir * cardW, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    updateArrows();
  }, [items.length, updateArrows]);

  if (!items.length) return emptyNode;

  return (
    <div className="relative">
      {/* Prev arrow */}
      <button
        onClick={() => scrollCards(-1)}
        aria-label="Previous"
        className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-700 shadow-lg transition-all duration-150 ${
          canPrev ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <ChevronLeft size={14} />
      </button>

      {/* Scrollable track */}
      <div
        ref={trackRef}
        onScroll={updateArrows}
        className="flex gap-4 overflow-x-auto pb-1"
        style={{
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            className="shrink-0 w-full sm:w-[calc(50%-8px)] xl:w-[calc(33.333%-11px)]"
            style={{ scrollSnapAlign: 'start' }}
          >
            {renderItem(item, i)}
          </div>
        ))}
      </div>

      {/* Next arrow */}
      <button
        onClick={() => scrollCards(1)}
        aria-label="Next"
        className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-700 shadow-lg transition-all duration-150 ${
          canNext ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
