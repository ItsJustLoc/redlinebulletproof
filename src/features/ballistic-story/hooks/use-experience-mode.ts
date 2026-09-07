"use client";
import { useSyncExternalStore } from "react";
const inspectionQuery =
  "(min-width: 60rem) and (min-height: 40rem) and (prefers-reduced-motion: no-preference) and (pointer: fine)";
const query = "(prefers-reduced-motion: no-preference)";
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
function subscribeInspection(callback: () => void) {
  const media = window.matchMedia(inspectionQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
export function useProductInspectionMode() {
  return useSyncExternalStore(
    subscribeInspection,
    () => window.matchMedia(inspectionQuery).matches,
    () => false,
  );
}
