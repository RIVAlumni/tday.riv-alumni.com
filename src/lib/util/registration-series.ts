import { Timestamp } from 'firebase/firestore';

export interface RegistrationSeriesPoint {
  date: Date;
  registrations: number;
}

export interface SgtDayRange {
  start: Timestamp;
  end: Timestamp;
}

const SGT_OFFSET_MILLISECONDS = 8 * 60 * 60 * 1000;
const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

// SGT midnight boundaries for the last `days` days, oldest first, ending today
export function sgtDayRanges(days: number, now = new Date()): SgtDayRange[] {
  const todayStart =
    Math.floor((now.getTime() + SGT_OFFSET_MILLISECONDS) / DAY_MILLISECONDS) * DAY_MILLISECONDS -
    SGT_OFFSET_MILLISECONDS;

  return Array.from({ length: days }, (_, index) => {
    const start = todayStart - (days - 1 - index) * DAY_MILLISECONDS;
    return {
      start: Timestamp.fromMillis(start),
      end: Timestamp.fromMillis(start + DAY_MILLISECONDS),
    };
  });
}

export function seriesFromCounts(
  ranges: SgtDayRange[],
  counts: number[],
): RegistrationSeriesPoint[] {
  return ranges.map((range, index) => ({
    date: range.start.toDate(),
    registrations: counts[index] ?? 0,
  }));
}
