import * as React from "react";

const QUERY = "(min-width: 1024px)";
const subscribe = (cb: () => void) => { const m = window.matchMedia(QUERY); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); };

/** True at the lg breakpoint and up; false during server render. */
export function useIsLg() {
  return React.useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
