import type { User, AccessLevel } from '$lib/models/user';

export function isAuthorized(user: User, minimumAccessLevel: AccessLevel): boolean {
  return user.access_level >= minimumAccessLevel && user.access_expires.toMillis() >= Date.now();
}
