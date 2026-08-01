/**
 * Reactive, event-scoped reception store shared by every reception design.
 *
 * The active event is an explicit operator choice persisted to `localStorage`
 * — never derived from the system clock (the bug in the legacy `../master`
 * build). Each design page hydrates the persisted choice once mounted so SSR
 * markup stays stable.
 */

import {
  defaultEventId,
  events,
  type ActionType,
  type ReceptionEvent,
} from './models';
import {
  type Registration,
  type RegistrationStatus,
} from '$lib/models/registration';
import {
  getRegistration,
  searchRegistrations,
  statsFor,
  type EventStats,
} from '$lib/util/registration';
import { seedRegistrations } from '$lib/data/registration';
import { Timestamp } from 'firebase/firestore';

const STORAGE_KEY = 'reception:active-event';

/**
 * Operator access levels, mirroring the legacy `FSUserAccessLevel` enum from
 * `../master` (None = 0, Operator = 1, Mediator = 2). The decision on which
 * level sees event statistics is deferred — gate UI via `canViewStats`.
 */
export const AccessLevel = {
  None: 0,
  Operator: 1,
  Mediator: 2,
} as const;
export type AccessLevel = (typeof AccessLevel)[keyof typeof AccessLevel];

// SSR-safe browser detection. SvelteKit 3 no longer exposes `$app/environment`,
// so we detect the runtime directly. The module is bundled separately for
// server and client, so a one-shot check at import time is correct.
const isBrowser = typeof window !== 'undefined';

export interface ActivityEntry {
  event_id: string;
  registration_id: string;
  full_name: string;
  action: ActionType;
  /** Free-text reason, required when flagging for conflict resolution. */
  reason?: string;
  at: Date;
}

export interface ReceptionMetrics {
  total: number;
  checkedIn: number;
  awaiting: number;
  flagged: number;
  refused: number;
  progress: number;
  /** Check-ins completed in the trailing 60 seconds. */
  rateLastMinute: number;
  /** Check-ins / minute since the first check-in of the session. */
  rateOverall: number;
  /** Minutes since the first check-in (0 before the first one). */
  sessionMinutes: number;
  /** Estimated minutes to clear the queue at the overall rate (null if unknown). */
  etaMinutes: number | null;
}

class ReceptionStore {
  /** Explicitly selected event — the single source of truth. */
  activeEventId = $state<string>(defaultEventId);
  /** All registrations, across events. Mutated in place for reactivity. */
  registrations = $state<Registration[]>(structuredClone(seedRegistrations));
  activity = $state<ActivityEntry[]>([]);

  /**
   * The signed-in operator's access level. TODO(firebase): drive from the
   * real FSUser / authStore. Defaults to Mediator so statistics render while
   * the auth layer is still being built; set to Operator to preview the
   * gated (Level 1) experience.
   */
  accessLevel = $state<AccessLevel>(AccessLevel.Mediator);

  /** Whether the current operator may see event statistics. */
  get canViewStats(): boolean {
    return this.accessLevel >= AccessLevel.Mediator;
  }

  private hydrated = false;

  /** Apply a persisted event choice after mount (keeps SSR output stable). */
  hydrate(): void {
    if (this.hydrated || !isBrowser) return;
    this.hydrated = true;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && events.some((e) => e.id === stored)) this.activeEventId = stored;
  }

  get activeEvent(): ReceptionEvent {
    return events.find((e) => e.id === this.activeEventId) ?? events[0];
  }

  setActiveEvent(id: string): void {
    this.activeEventId = id;
    if (isBrowser) localStorage.setItem(STORAGE_KEY, id);
  }

  forEvent(eventId: string = this.activeEventId): Registration[] {
    return this.registrations.filter((r) => r.event_id === eventId);
  }

  search(needle: string, eventId: string = this.activeEventId): Registration[] {
    return searchRegistrations(eventId, needle, this.registrations);
  }

  get(registrationId: string, eventId: string = this.activeEventId): Registration | undefined {
    return getRegistration(eventId, registrationId, this.registrations);
  }

  stats(eventId: string = this.activeEventId): EventStats {
    return statsFor(eventId, this.registrations);
  }

  activityFor(eventId: string = this.activeEventId): ActivityEntry[] {
    return this.activity.filter((a) => a.event_id === eventId);
  }

  /** Commit an action against the active event. Returns the previous status. */
  applyAction(
    registrationId: string,
    action: ActionType,
    reason?: string,
  ): RegistrationStatus | null {
    const target = this.registrations.find(
      (r) => r.event_id === this.activeEventId && r.registration_id === registrationId,
    );
    if (!target) return null;

    const previous = target.status;
    target.status = action;
    target.updated_at = Timestamp.now();
    if (action === 'CHECKED_IN') target.arrived_at = Timestamp.now();

    // Conflict handovers append the operator's reason to the record's notes,
    // mirroring the legacy `actionSetConflict` comment trail in `../master`.
    const trimmedReason = reason?.trim();
    if (action === 'CONFLICT' && trimmedReason) {
      const stamp = new Date().toLocaleString('en-SG');
      target.comments = `${target.comments ? target.comments + '\n\n' : ''}[FLAGGED ${stamp}] ${trimmedReason}`;
    }

    this.activity = [
      {
        event_id: this.activeEventId,
        registration_id: registrationId,
        full_name: target.full_name,
        action,
        ...(action === 'CONFLICT' && trimmedReason ? { reason: trimmedReason } : {}),
        at: new Date(),
      },
      ...this.activity,
    ].slice(0, 24);

    console.info(`[${this.activeEventId}] ${registrationId} ${previous} → ${action}`);
    return previous;
  }

  /**
   * Level 2 (Mediator) only: patch editable fields on a registration. Level 1
   * operators are read-only and must flag for resolution instead.
   *
   * Accepts shared fields plus any year-specific extra that the caller has
   * validated against the active event type.
   */
  updateRegistration(
    registrationId: string,
    patch: Partial<Pick<Registration, 'full_name' | 'contact_number' | 'graduating_year' | 'visiting_teachers' | 'comments'>> &
      Partial<Record<string, unknown>>,
  ): boolean {
    if (!this.canEditRegistrations) return false;
    const target = this.registrations.find(
      (r) => r.event_id === this.activeEventId && r.registration_id === registrationId,
    );
    if (!target) return false;
    Object.assign(target, patch);
    target.updated_at = Timestamp.now();
    return true;
  }

  /** Whether the current operator may edit registrations (Level 2+). */
  get canEditRegistrations(): boolean {
    return this.accessLevel >= AccessLevel.Mediator;
  }

  /** Live throughput + queue metrics for the active event. */
  get metrics(): ReceptionMetrics {
    const s = this.stats();
    const now = Date.now();
    const checkIns = this.activityFor().filter((a) => a.action === 'CHECKED_IN');
    const firstAt = checkIns.length > 0 ? checkIns.at(-1)!.at.getTime() : null;
    const sessionMinutes = firstAt === null ? 0 : Math.max(0.05, (now - firstAt) / 60000);
    const rateLastMinute = checkIns.filter((a) => now - a.at.getTime() <= 60_000).length;
    const rateOverall = checkIns.length / sessionMinutes;
    const etaMinutes = rateOverall > 0 ? Math.ceil(s.awaiting / rateOverall) : null;
    return {
      total: s.total,
      checkedIn: s.checkedIn,
      awaiting: s.awaiting,
      flagged: s.conflict,
      refused: s.refused,
      progress: s.progress,
      rateLastMinute,
      rateOverall,
      sessionMinutes,
      etaMinutes,
    };
  }

  resetEvent(eventId: string = this.activeEventId): void {
    for (const original of seedRegistrations.filter((r) => r.event_id === eventId)) {
      const target = this.registrations.find(
        (r) => r.event_id === eventId && r.registration_id === original.registration_id,
      );
      if (target) {
        target.status = original.status;
        target.arrived_at = original.arrived_at;
      }
    }
    this.activity = this.activity.filter((a) => a.event_id !== eventId);
  }
}

export const reception = new ReceptionStore();
