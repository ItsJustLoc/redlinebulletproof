let immediateScroller: ((top: number) => void) | undefined;

export function registerImmediateScroller(scroll: (top: number) => void) {
  immediateScroller = scroll;
  return () => {
    if (immediateScroller === scroll) immediateScroller = undefined;
  };
}

export function scrollImmediately(top: number) {
  if (immediateScroller) immediateScroller(top);
  else window.scrollTo({ top, behavior: "instant" });
}
