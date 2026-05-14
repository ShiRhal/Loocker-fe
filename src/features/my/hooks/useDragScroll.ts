import { useRef } from "react";

export default function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const scrollTopRef = useRef(0);

  const onPointerDown = (event: React.PointerEvent<T>) => {
    if (!ref.current) return;

    isDraggingRef.current = true;
    startYRef.current = event.clientY;
    scrollTopRef.current = ref.current.scrollTop;

    ref.current.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: React.PointerEvent<T>) => {
    if (!ref.current || !isDraggingRef.current) return;

    const diffY = event.clientY - startYRef.current;
    ref.current.scrollTop = scrollTopRef.current - diffY;
  };

  const onPointerUp = (event: React.PointerEvent<T>) => {
    if (!ref.current) return;

    isDraggingRef.current = false;
    ref.current.releasePointerCapture(event.pointerId);
  };

  const onPointerLeave = () => {
    isDraggingRef.current = false;
  };

  return {
    ref,
    dragHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerLeave,
    },
  };
}
