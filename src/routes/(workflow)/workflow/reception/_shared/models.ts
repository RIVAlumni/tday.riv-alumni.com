/**
 * Shared reception domain model - multi-event aware.
 *
 * Registration types live in `$lib/models/registration` so the whole app can
 * import them. This module re-exports everything from there and adds the
 * event catalogue, status/action presentation metadata, and formatting
 * helpers that are specific to the reception workflow.
 */

import type { EventId, RegistrationStatus } from '$lib/models/registration';
import { Timestamp } from 'firebase/firestore';

import {
	BanIcon,
	CheckmarkCircle01Icon,
	Door01Icon,
	HeartHandshakeIcon,
	IdentificationIcon,
	InformationCircleIcon,
} from '$lib/icons';

// --- Events ---------------------------------------------------------------
export type EventStatus = 'upcoming' | 'active' | 'completed';

export interface ReceptionEvent {
	id: EventId | string;
	year: string;
	title: string;
	/** ISO date the event takes place. */
	date: string;
	venue: string;
	status: EventStatus;
}

export const events: ReceptionEvent[] = [
	{
		id: '2024',
		year: '2024',
		title: "Teachers' Day 2024",
		date: '2024-09-06',
		venue: 'RIVA Heritage Hall',
		status: 'completed',
	},
	{
		id: '2025',
		year: '2025',
		title: "Teachers' Day 2025",
		date: '2025-09-05',
		venue: 'RIVA Heritage Hall',
		status: 'completed',
	},
	{
		id: '2026',
		year: '2026',
		title: "Teachers' Day 2026",
		date: '2026-09-03',
		venue: 'Rivervale Primary School',
		status: 'active',
	},
	{
		id: '2027',
		year: '2027',
		title: "Teachers' Day 2027",
		date: '2027-06-25',
		venue: 'To be confirmed',
		status: 'upcoming',
	},
];

/** The event to default to - never the clock, always an explicit choice. */
export const defaultEventId: string =
	events.find((e) => e.status === 'active')?.id ?? events.at(-1)!.id;

export function getEvent(id: string): ReceptionEvent {
	return events.find((e) => e.id === id) ?? events[0];
}

// --- Presentation metadata (shared so every design stays consistent) ------
type IconComponent = typeof IdentificationIcon;

export const statusMeta: Record<
	RegistrationStatus,
	{ label: string; icon: IconComponent; badge: string; dot: string; soft: string }
> = {
	REGISTERED: {
		label: 'Registered',
		icon: IdentificationIcon,
		badge: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 ring-1 ring-sky-500/25',
		dot: 'bg-sky-500',
		soft: 'bg-sky-500/10',
	},
	CHECKED_IN: {
		label: 'Checked in',
		icon: CheckmarkCircle01Icon,
		badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/25',
		dot: 'bg-emerald-500',
		soft: 'bg-emerald-500/10',
	},
	CONFLICT: {
		label: 'Needs resolution',
		icon: InformationCircleIcon,
		badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/25',
		dot: 'bg-amber-500',
		soft: 'bg-amber-500/10',
	},
	REJECTED: {
		label: 'Rejected',
		icon: BanIcon,
		badge: 'bg-red-500/15 text-red-600 dark:text-red-400 ring-1 ring-red-500/25',
		dot: 'bg-red-500',
		soft: 'bg-red-500/10',
	},
};

export type ActionType = 'CHECKED_IN' | 'REFUSED' | 'CONFLICT';

/** Persisted status for a reception action - REFUSED is recorded as REJECTED. */
export function statusForAction(action: ActionType): RegistrationStatus {
	return action === 'REFUSED' ? 'REJECTED' : action;
}

export const actionMeta: Record<
	ActionType,
	{
		label: string;
		icon: IconComponent;
		/** Tailwind classes for a solid primary action button. */
		button: string;
		/** Outline variant classes for a secondary placement. */
		outline: string;
		toastTitle: string;
		toastVerb: string;
	}
> = {
	CHECKED_IN: {
		label: 'Check In',
		icon: Door01Icon,
		button: 'bg-emerald-600 text-white hover:bg-emerald-600/90',
		outline:
			'border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400',
		toastTitle: 'Visitor checked in',
		toastVerb: 'check-in',
	},
	REFUSED: {
		label: 'Refuse Entry',
		icon: BanIcon,
		button: 'bg-red-600 text-white hover:bg-red-600/90',
		outline: 'border-red-500/40 text-red-600 hover:bg-red-500/10 dark:text-red-400',
		toastTitle: 'Entry refused',
		toastVerb: 'refuse-entry',
	},
	CONFLICT: {
		label: 'Conflict Resolution',
		icon: HeartHandshakeIcon,
		button: 'bg-amber-500 text-white hover:bg-amber-500/90',
		outline:
			'border-amber-500/40 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400',
		toastTitle: 'Handed to Conflict Resolution',
		toastVerb: 'handover',
	},
};

// --- Formatting -----------------------------------------------------------
export function formatTime(iso: Timestamp | string | null): string {
	if (!iso) return '-';
	const d = iso instanceof Timestamp ? iso.toDate() : new Date(iso);
	return d.toLocaleTimeString('en-SG', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: true,
	});
}

export function relativeTime(date: Date): string {
	const seconds = Math.round((Date.now() - date.getTime()) / 1000);
	if (seconds < 60) return `${seconds}s ago`;
	const minutes = Math.round(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.round(minutes / 60);
	return `${hours}h ago`;
}

export function initials(name: string): string {
	return name.charAt(0);
}
