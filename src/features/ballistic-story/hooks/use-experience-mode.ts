"use client";
import { useSyncExternalStore } from "react";
const query =
  "(min-width: 60rem) and (min-height: 40rem) and (prefers-reduced-motion: no-preference) and (pointer: fine)";
function subscribe(callback: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
export function useCinematicMode() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
