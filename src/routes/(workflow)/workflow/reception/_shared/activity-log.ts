/**
 * Cross-page activity / audit-log helpers shared by the Audit Log timeline
 * (`/workflow/logs`) and the per-visitor profile (`/workflow/profile/[id]`).
 *
 * The live operator action trail lives in the reception store
 * (`reception.activity`) — in-memory, capped, and reset on reload. Because that
 * trail is empty until an operator acts, `historicalActivity()` synthesises a
 * realistic prior audit trail anchored to the real "now" so the timeline is
 * populated on first visit and every timestamp is unambiguously in the past.
 *
 * TODO(firebase): swap `historicalActivity()` for a Firestore audit-log query
 * (e.g. `audit_events` collection ordered by `at desc`). `buildTimeline()` and
 * the grouping helpers stay unchanged — only the data source moves.
 */

import type { ActivityEntry } from './store.svelte.js';
import type { ActionType, Registration } from './models.js';

export interface TimelineEntry {
  event_id: string;
  registration_id: string;
  full_name: string;
  nric: string;
  action: ActionType;
  /** Free-text reason, present on conflict handovers. */
  reason?: string;
  /** Operator who performed the action. TODO(firebase): real authStore user. */
  operator: string;
  at: Date;
  /** Originated from the in-memory session store (vs the seeded trail). */
  live: boolean;
}

/** Plausible operator roster for the seeded trail. */
type Operator = 'Nurul A.' | 'Daniel C.' | 'Priya R.' | 'Marcus T.';

interface HistoricalTemplate {
  /** Globally-unique registration id, so each entry can deep-link to a profile. */
  reg: string;
  action: ActionType;
  /** Minutes before "now". */
  agoMin: number;
  operator: Operator;
  reason?: string;
}

// A coherent recent audit trail across the active event plus a couple of
// archived-event entries, so the event filter and day grouping are meaningful.
const HISTORICAL_TEMPLATE: HistoricalTemplate[] = [
  { reg: 'TDY26-0002', action: 'CHECKED_IN', agoMin: 4, operator: 'Nurul A.' },
  {
    reg: 'TDY26-0005',
    action: 'CONFLICT',
    agoMin: 12,
    operator: 'Nurul A.',
    reason: 'NRIC on record (T9000111E) does not match the physical card presented at the door.',
  },
  { reg: 'TDY26-0001', action: 'CHECKED_IN', agoMin: 21, operator: 'Daniel C.' },
  {
    reg: 'TDY26-0004',
    action: 'CONFLICT',
    agoMin: 34,
    operator: 'Daniel C.',
    reason: 'Wheelchair user — confirm ground-floor access and teacher escort before admitting.',
  },
  { reg: 'TDY26-0006', action: 'CHECKED_IN', agoMin: 47, operator: 'Priya R.' },
  { reg: 'TDY26-0003', action: 'CHECKED_IN', agoMin: 63, operator: 'Priya R.' },
  { reg: 'TDY25-0102', action: 'CHECKED_IN', agoMin: 1500, operator: 'Marcus T.' },
  { reg: 'TDY25-0104', action: 'REFUSED', agoMin: 1512, operator: 'Marcus T.' },
];

/** Build the seeded historical trail relative to `now` (always in the past). */
export function historicalActivity(
  registrations: Registration[],
  now: Date = new Date(),
): TimelineEntry[] {
  const byId = new Map(registrations.map((r) => [r.registration_id, r]));
  return HISTORICAL_TEMPLATE.map((t) => {
    const r = byId.get(t.reg);
    const entry: TimelineEntry = {
      event_id: r?.event_id ?? 'tdy-2026',
      registration_id: t.reg,
      full_name: r?.full_name ?? 'Unknown visitor',
      nric: r?.nric ?? '—',
      action: t.action,
      operator: t.operator,
      at: new Date(now.getTime() - t.agoMin * 60_000),
      live: false,
    };
    if (t.reason) entry.reason = t.reason;
    return entry;
  });
}

/**
 * Merge live session activity with the historical trail, newest first.
 *
 * Live entries are enriched with the visitor's NRIC and attributed to the
 * signed-in operator (the store does not yet record who acted).
 */
export function buildTimeline(
  live: ActivityEntry[],
  registrations: Registration[],
  historical: TimelineEntry[],
  liveOperator = 'RIVAlumni Operator',
): TimelineEntry[] {
  const byId = new Map(registrations.map((r) => [r.registration_id, r]));
  const liveEntries: TimelineEntry[] = live.map((e) => {
    const entry: TimelineEntry = {
      event_id: e.event_id,
      registration_id: e.registration_id,
      full_name: e.full_name,
      nric: byId.get(e.registration_id)?.nric ?? '—',
      action: e.action,
      operator: liveOperator,
      at: e.at,
      live: true,
    };
    if (e.reason) entry.reason = e.reason;
    return entry;
  });
  return [...liveEntries, ...historical].sort((a, b) => b.at.getTime() - a.at.getTime());
}

// --- Day grouping (for the historical timeline headers) -------------------
function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function dayKey(d: Date): string {
  return startOfDay(d).toISOString();
}

/** "Today" / "Yesterday" / "Fri, 5 Sep 2025"-style label. */
export function dayLabel(d: Date, now: Date = new Date()): string {
  const today = startOfDay(now).getTime();
  const target = startOfDay(d).getTime();
  const dayMs = 86_400_000;
  if (target === today) return 'Today';
  if (target === today - dayMs) return 'Yesterday';
  return d.toLocaleDateString('en-SG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export interface DayGroup {
  key: string;
  label: string;
  entries: TimelineEntry[];
}

/** Group already-sorted entries into days, newest day first. */
export function groupByDay(entries: TimelineEntry[], now: Date = new Date()): DayGroup[] {
  const map = new Map<string, TimelineEntry[]>();
  for (const e of entries) {
    const k = dayKey(e.at);
    const arr = map.get(k);
    if (arr) arr.push(e);
    else map.set(k, [e]);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, es]) => ({ key, label: dayLabel(es[0].at, now), entries: es }));
}
