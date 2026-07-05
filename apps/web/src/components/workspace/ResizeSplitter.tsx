import { useCallback, useRef, type MouseEvent as ReactMouseEvent } from 'react';

type ResizeSplitterProps = {
  onResize: (ratio: number) => void;
  containerRef: React.RefObject<HTMLElement | null>;
  minRatio?: number;
  maxRatio?: number;
};

export function ResizeSplitter({
  onResize,
  containerRef,
  minRatio = 0.2,
  maxRatio = 0.75,
}: ResizeSplitterProps) {
  const draggingRef = useRef(false);

  const handleMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      draggingRef.current = true;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!draggingRef.current || !containerRef.current) {
          return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const ratio = (moveEvent.clientY - rect.top) / rect.height;
        onResize(Math.min(maxRatio, Math.max(minRatio, ratio)));
      };

      const handleMouseUp = () => {
        draggingRef.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [containerRef, maxRatio, minRatio, onResize],
  );

  return (
    <div
      className="resize-splitter"
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize editor and results"
      onMouseDown={handleMouseDown}
    />
  );
}
