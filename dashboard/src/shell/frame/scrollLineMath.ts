// The sums behind the thin scroll line (ScrollLine.tsx). Plain numbers in, plain numbers out, so they can be tested.

const MIN_THUMB = 48;

export type Thumb = { scrollable: boolean; height: number; offset: number };

// How tall the thumb is and how far down it sits, for a page that is `scrollHeight` tall inside a window `clientHeight` tall,
// scrolled down by `scrollTop`, drawn in a track `trackHeight` tall. Not scrollable means: draw nothing.
export function thumbOf(
  scrollTop: number,
  scrollHeight: number,
  clientHeight: number,
  trackHeight: number,
): Thumb {
  const max = scrollHeight - clientHeight;
  if (!(max > 1) || !(trackHeight > 0) || !(clientHeight > 0))
    return { scrollable: false, height: 0, offset: 0 };
  const height = Math.min(
    trackHeight,
    Math.max(MIN_THUMB, (clientHeight / scrollHeight) * trackHeight),
  );
  const room = trackHeight - height;
  const progress = Math.min(1, Math.max(0, scrollTop / max));
  return { scrollable: true, height, offset: progress * room };
}

// Where the page should be scrolled to when the thumb has been dragged `dragged` pixels from where it was picked up
// (when the page was at `startScroll`). Never outside the page.
export function scrollFromDrag(
  startScroll: number,
  dragged: number,
  scrollHeight: number,
  clientHeight: number,
  trackHeight: number,
  thumbHeight: number,
): number {
  const max = Math.max(0, scrollHeight - clientHeight);
  const room = trackHeight - thumbHeight;
  if (max === 0 || room <= 0) return startScroll;
  return Math.min(max, Math.max(0, startScroll + (dragged / room) * max));
}
