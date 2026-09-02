import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import { AccessLevel } from '$lib/models/user';

import { accessStatusFor, hasRelevantAccess, immediateRevocationExpiry } from './access-time';

const NOW = Date.UTC(2026, 7, 27, 12);

describe('user access state', () => {
  it('marks unexpired authorized access as active', () => {
    const user = {
      access_level: AccessLevel.Operator,
      access_expires: Timestamp.fromMillis(NOW + 1),
    };

    expect(accessStatusFor(user, NOW)).toBe('Active');
    expect(hasRelevantAccess(user, NOW)).toBe(true);
  });

  it('marks lapsed authorized access as expired and keeps it visible', () => {
    const user = {
      access_level: AccessLevel.Mediator,
      access_expires: Timestamp.fromMillis(NOW),
    };

    expect(accessStatusFor(user, NOW)).toBe('Expired');
    expect(hasRelevantAccess(user, NOW)).toBe(true);
  });

  it('marks level zero access as no access while its expiry is in the future', () => {
    const user = {
      access_level: AccessLevel.None,
      access_expires: Timestamp.fromMillis(NOW + 1),
    };

    expect(accessStatusFor(user, NOW)).toBe('No access');
    expect(hasRelevantAccess(user, NOW)).toBe(true);
  });

  it('filters access that is both level zero and lapsed', () => {
    const user = {
      access_level: AccessLevel.None,
      access_expires: Timestamp.fromMillis(NOW),
    };

    expect(accessStatusFor(user, NOW)).toBe('No access');
    expect(hasRelevantAccess(user, NOW)).toBe(false);
  });

  it('sets immediate revocation expiry one minute in the past', () => {
    expect(immediateRevocationExpiry(NOW).toMillis()).toBe(NOW - 60_000);
  });
});
