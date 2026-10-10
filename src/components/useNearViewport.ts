'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * True once the element has come close to the screen, and true from then on.
 *
 * WHAT IT IS FOR
 *
 * A Google Maps embed is about 1.4 MB over 22 requests, 733 KB of it
 * JavaScript — measured on this site by loading one on its own and reading its
 * resource timings. Mounting that in the markup makes every visitor download a
 * Maps application during page load, whether or not they ever reach the
 * section it sits in.
 *
 * The old answer was a button: nothing loaded until somebody asked. That keeps
 * the page fast and puts a door in front of a map, which is one interaction too
 * many for something people expect to simply be there.
 *
 * This is the third option. The map mounts by itself when the reader has
 * scrolled to it, so there is no button and nothing to press, and the cost is
 * still never paid during page load — which is the part that LCP measures and
 * the part a visitor who never scrolls that far should not be charged for.
 *
 * `rootMargin` starts the load a screen early, so by the time the section is
 * actually in view the iframe has usually drawn.
 *
 * WHY A CALLBACK REF AND NOT AN EFFECT
 *
 * The element being watched often is not in the tree on the first render — the
 * partner map only mounts its slot once the static image has failed. An effect
 * keyed on the usual dependencies runs while `ref.current` is still null, and
 * then never runs again, because nothing in its dependency list changed when
 * the node finally appeared. The observer attaches to nothing and the map
 * never loads. A callback ref fires exactly when the node attaches, whenever
 * that happens, and again with null when it goes away.
 *
 * WHEN THERE IS NO OBSERVER
 *
 * Returns true immediately. An old browser, or a rendering context without
 * IntersectionObserver, then behaves like a plain embed: slower, but the map
 * is there. Never showing it would be the worse failure.
 */
export function useNearViewport<T extends HTMLElement>(rootMargin = '600px') {
  const [near, setNear] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: T | null) => {
      observer.current?.disconnect();
      observer.current = null;

      if (!node || near) return;

      if (typeof IntersectionObserver === 'undefined') {
        setNear(true);
        return;
      }

      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            setNear(true);
            io.disconnect();
          }
        },
        { rootMargin },
      );

      io.observe(node);
      observer.current = io;
    },
    [near, rootMargin],
  );

  return { ref, near };
}
