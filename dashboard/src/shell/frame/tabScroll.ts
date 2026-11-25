// On a phone the page's tabs (Bookings: All bookings, Calendar, Customer view, Settings) are wider than the screen, so the row scrolls
// sideways. The tab you are on must never be left out of sight, so the row scrolls to put it in the middle when the page opens or the tab changes.
//
// Where the row should scroll to, so the chosen tab is centred. `rowWidth` is the visible width of the row, `contentWidth` how wide all the
// tabs are together, `tabLeft` and `tabWidth` where the chosen tab sits inside them. Never scrolls past either end, and a row that already
// fits does not scroll at all.
export function scrollToCentre(rowWidth: number, contentWidth: number, tabLeft: number, tabWidth: number): number {
  const most = Math.max(0, contentWidth - rowWidth);
  const centred = tabLeft - (rowWidth - tabWidth) / 2;
  return Math.min(most, Math.max(0, Math.round(centred)));
}
