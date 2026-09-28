/**
 * Standard distances — offered as a quick-pick in the log form (fills
 * the free distanceKm field, doesn't replace it) and used to group
 * logged runs for the pace-progression charts in Statistics. A run
 * counts toward one of these if it's close enough (see
 * matchStandardDistance), whether it was quick-picked or typed by hand.
 */
export const STANDARD_DISTANCES = [
  { value: "5k", label: "5K", km: 5 },
  { value: "10k", label: "10K", km: 10 },
  { value: "15k", label: "15K", km: 15 },
  { value: "20k", label: "20K", km: 20 },
  { value: "half_marathon", label: "Half Marathon", km: 21 },
  { value: "marathon", label: "Marathon", km: 42 },
] as const;

export type StandardDistance = (typeof STANDARD_DISTANCES)[number];
