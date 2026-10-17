'use client';

import { useCallback, useState } from 'react';

/**
 * Tracks the rendered height of an element with a ResizeObserver.
 * Returns a callback ref to attach to the element and its current height (px).
 */
export function useElementHeight<T extends HTMLElement>(): [(node: T | null) => void, number] {
  const [height, setHeight] = useState(0);

  const ref = useCallback((node: T | null) => {
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setHeight(Math.floor(entry.contentRect.height));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, height];
}
