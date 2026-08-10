import { useEffect, useRef, useState } from 'react';

/**
 * Lightweight React hook using IntersectionObserver to handle scroll reveal animations.
 *
 * @param options - Custom IntersectionObserver configuration options
 * @returns { ref, isVisible } - Ref to attach to DOM element and visibility boolean flag
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit
) {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || isVisible) return;

    const threshold = options?.threshold ?? 0.1;
    const rootMargin = options?.rootMargin ?? '0px 0px -50px 0px';
    const root = options?.root ?? null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin, root }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [options?.threshold, options?.rootMargin, options?.root, isVisible]);

  return { ref, isVisible };
}

export default useScrollReveal;
