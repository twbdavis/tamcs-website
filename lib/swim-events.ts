// Canonical event ordering used by team records (see seed in 0002) and now
// the meet results page so events line up between the two views.
//
// Anything not in this list sorts after the listed events, alphabetically.

export const SWIM_EVENT_ORDER: readonly string[] = [
  "50 Free",
  "100 Free",
  "200 Free",
  "500 Free",
  "1000 Free",
  "1650 Free",
  "50 Back",
  "100 Back",
  "200 Back",
  "50 Breast",
  "100 Breast",
  "200 Breast",
  "50 Fly",
  "100 Fly",
  "200 Fly",
  "100 IM",
  "200 IM",
  "400 IM",
  "200 Free Relay",
  "400 Free Relay",
  "800 Free Relay",
  "200 Medley Relay",
  "400 Medley Relay",
];

const normalizedOrder = SWIM_EVENT_ORDER.map((e) => e.toLowerCase().trim());

function indexOfEvent(event: string): number {
  const i = normalizedOrder.indexOf(event.toLowerCase().trim());
  return i === -1 ? Number.MAX_SAFE_INTEGER : i;
}

/** Sort comparator for event names. Known events follow SWIM_EVENT_ORDER;
 *  anything else lands at the end in alpha order. */
export function compareEvents(a: string, b: string): number {
  const ai = indexOfEvent(a);
  const bi = indexOfEvent(b);
  if (ai !== bi) return ai - bi;
  return a.localeCompare(b);
}
