import type { IconComponent } from '$lib/icons';

import {
  DashboardSquare01Icon,
  Database01Icon,
  CheckmarkCircle01Icon,
  NoteIcon,
  Presentation07Icon,
  Settings01Icon,
  UserMultipleIcon,
} from '$lib/icons';
import { AccessLevel } from '$lib/models/user';

export interface NavItem {
  title: string;
  url: string;
  icon: IconComponent;
  minimumAccessLevel: AccessLevel;
}

// prettier-ignore
export const navMain: NavItem[] = [
  { title: 'Dashboard',            url: '/workflow/home',      icon: DashboardSquare01Icon,   minimumAccessLevel: AccessLevel.Mediator },
  { title: 'Reception (Check-in)', url: '/workflow/reception', icon: CheckmarkCircle01Icon,   minimumAccessLevel: AccessLevel.Operator },
];

// prettier-ignore
export const records: NavItem[] = [
  { title: 'Registrations', url: '/workflow/records',  icon: Database01Icon,     minimumAccessLevel: AccessLevel.Mediator },
  { title: 'Messages',      url: '/workflow/messages', icon: NoteIcon,           minimumAccessLevel: AccessLevel.Mediator },
  { title: 'Teachers',      url: '/workflow/teachers', icon: Presentation07Icon, minimumAccessLevel: AccessLevel.Mediator },
];

// prettier-ignore
export const system: NavItem[] = [
  { title: 'Operators', url: '/workflow/operators', icon: UserMultipleIcon, minimumAccessLevel: AccessLevel.Administrator },
];

// prettier-ignore
export const navSecondary: NavItem[] = [
  { title: 'Settings', url: '/workflow/settings', icon: Settings01Icon, minimumAccessLevel: AccessLevel.Operator },
];

/**
 * Whether a sidebar link should be highlighted as active for the current
 * path. Placeholder urls (`'#'`) are never active. Matches the item url
 * exactly or as a path prefix so nested routes (e.g. `/workflow/home/sub`)
 * also highlight their parent (`/workflow/home`).
 */
export function isPathActive(pathname: string, itemUrl: string): boolean {
  if (itemUrl === '#') return false;
  if (pathname === itemUrl) return true;
  return pathname.startsWith(itemUrl + '/');
}

/**
 * Derive a page title for a route from `navMain`. Entries with a placeholder
 * url (`'#'`) are skipped. Falls back to a title-cased last path segment so
 * future routes render sensibly without an explicit entry.
 */
const routeTitles = new Map(
  navMain.filter((item) => item.url !== '#').map((item) => [item.url, item.title] as const),
);

export function pageTitleForPath(pathname: string): string {
  const explicit = routeTitles.get(pathname);
  if (explicit) return explicit;

  const last = pathname.split('/').filter(Boolean).pop() ?? '';
  const titleCased = last
    .split('-')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
    .join(' ');
  return titleCased || 'Dashboard';
}
