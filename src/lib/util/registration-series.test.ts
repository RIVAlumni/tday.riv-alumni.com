import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import { seriesFromCounts, sgtDayRanges } from './registration-series';

describe('sgtDayRanges', () => {
  it('returns SGT midnight boundaries for the last days, oldest first', () => {
    // 2026-08-15 10:00 SGT = 2026-08-15 02:00 UTC
    const now = new Date('2026-08-15T02:00:00.000Z');
    const ranges = sgtDayRanges(3, now);
    expect(ranges).toEqual([
      {
        start: Timestamp.fromDate(new Date('2026-08-12T16:00:00.000Z')),
        end: Timestamp.fromDate(new Date('2026-08-13T16:00:00.000Z')),
      },
      {
        start: Timestamp.fromDate(new Date('2026-08-13T16:00:00.000Z')),
        end: Timestamp.fromDate(new Date('2026-08-14T16:00:00.000Z')),
      },
      {
        start: Timestamp.fromDate(new Date('2026-08-14T16:00:00.000Z')),
        end: Timestamp.fromDate(new Date('2026-08-15T16:00:00.000Z')),
      },
    ]);
  });
});

describe('seriesFromCounts', () => {
  it('pairs counts with range start dates', () => {
    const ranges = sgtDayRanges(3, new Date('2026-08-15T02:00:00.000Z'));
    expect(seriesFromCounts(ranges, [1, 0, 4])).toEqual([
      { date: new Date('2026-08-12T16:00:00.000Z'), registrations: 1 },
      { date: new Date('2026-08-13T16:00:00.000Z'), registrations: 0 },
      { date: new Date('2026-08-14T16:00:00.000Z'), registrations: 4 },
    ]);
  });
});
