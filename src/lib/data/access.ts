import { AccessLevel } from '$lib/models/user';

export interface AccessPermission {
  label: string;
  minimumLevel: AccessLevel;
}

export const ACCESS_LEVEL_NAMES: Record<AccessLevel, string> = {
  [AccessLevel.None]: 'None',
  [AccessLevel.Operator]: 'Operator',
  [AccessLevel.Mediator]: 'Mediator',
  [AccessLevel.Administrator]: 'Administrator',
};

// Mirrors firestore.rules thresholds: a higher level inherits every lower
// permission (access_level is compared with >=). "Send event tickets" maps to
// resendRegistrationEmail, which is only surfaced in the mediator records UI.
export const ACCESS_PERMISSIONS: AccessPermission[] = [
  { label: 'Check-in registrants', minimumLevel: AccessLevel.Operator },
  { label: 'List registration records', minimumLevel: AccessLevel.Mediator },
  { label: 'Send event tickets via email', minimumLevel: AccessLevel.Mediator },
  { label: 'Delete registration records', minimumLevel: AccessLevel.Administrator },
];

export function permissionsFor(level: AccessLevel): AccessPermission[] {
  return ACCESS_PERMISSIONS.filter((permission) => level >= permission.minimumLevel);
}
