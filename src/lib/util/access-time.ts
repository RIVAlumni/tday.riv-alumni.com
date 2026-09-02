import type { User } from '$lib/models/user';

import { Timestamp } from 'firebase/firestore';

import { AccessLevel } from '$lib/models/user';

const SINGAPORE_OFFSET_MILLISECONDS = 8 * 60 * 60 * 1000;
const REVOCATION_OFFSET_MILLISECONDS = 60 * 1000;

export type AccessStatus = 'Active' | 'Expired' | 'No access';

export function accessStatusFor(
  user: Pick<User, 'access_level' | 'access_expires'>,
  now = Date.now(),
): AccessStatus {
  if (user.access_level === AccessLevel.None) return 'No access';
  return user.access_expires.toMillis() > now ? 'Active' : 'Expired';
}

export function hasRelevantAccess(
  user: Pick<User, 'access_level' | 'access_expires'>,
  now = Date.now(),
): boolean {
  return user.access_level !== AccessLevel.None || user.access_expires.toMillis() > now;
}

export function immediateRevocationExpiry(now = Date.now()): Timestamp {
  return Timestamp.fromMillis(now - REVOCATION_OFFSET_MILLISECONDS);
}

// 'YYYY-MM-DD' of the timestamp in Singapore time, for date inputs.
export function singaporeDate(timestamp: Timestamp): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(timestamp.toDate());
  const part = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((value) => value.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

// End of the given Singapore day (23:59:59.999), used for access expiry.
export function singaporeEndOfDay(date: string): Timestamp {
  const [year, month, day] = date.split('-').map(Number);
  return Timestamp.fromMillis(
    Date.UTC(year, month - 1, day + 1) - SINGAPORE_OFFSET_MILLISECONDS - 1,
  );
}

// e.g. "3 September 2026, 11:59 PM" in Singapore time.
export function formatAccessExpiry(timestamp: Timestamp): string {
  return new Intl.DateTimeFormat('en-SG', {
    timeZone: 'Asia/Singapore',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
    .format(timestamp.toDate())
    .replace(' am', ' AM')
    .replace(' pm', ' PM');
}
