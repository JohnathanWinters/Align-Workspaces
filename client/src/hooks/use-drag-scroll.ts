import { useRef, useCallback } from "react";

export function useDragScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const state = useRef({ isDown: false, startX: 0, scrollLeft: 0, moved: false });

  const onDragStart = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    state.current = { isDown: true, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft, moved: false };
    el.style.cursor = "grabbing";
    el.style.scrollSnapType = "none";
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!state.current.isDown) return;
    e.preventDefault();
    const el = ref.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - state.current.startX) * 1.5;
    if (Math.abs(walk) > 5) state.current.moved = true;
    el.scrollLeft = state.current.scrollLeft - walk;
  }, []);

  const onMouseUp = useCallback(() => {
    state.current.isDown = false;
    const el = ref.current;
    if (!el) return;
    el.style.cursor = "";
    el.style.scrollSnapType = "";
  }, []);

  const onMouseLeave = useCallback(() => {
    if (state.current.isDown) {
      state.current.isDown = false;
      const el = ref.current;
      if (!el) return;
      el.style.cursor = "";
      el.style.scrollSnapType = "";
    }
  }, []);

  const preventClickIfDragged = useCallback((e: React.MouseEvent) => {
    if (state.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      state.current.moved = false;
    }
  }, []);

  return { ref, onDragStart, onMouseDown, onMouseMove, onMouseUp, onMouseLeave, preventClickIfDragged };
}
