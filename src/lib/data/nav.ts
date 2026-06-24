import type { Icon } from '@tabler/icons-svelte';
import {
  DashboardIcon,
  DatabaseIcon,
  FaceIdErrorIcon,
  HelpIcon,
  LayoutGridIcon,
  MoodCheckIcon,
  ReportIcon,
  SettingsIcon,
} from '$lib/icons';

export interface NavItem {
  title: string;
  url: string;
  icon: Icon;
}

export interface DocumentItem {
  name: string;
  url: string;
  icon: Icon;
}

export interface SidebarUser {
  name: string;
  email: string;
  avatar: string;
}

// TODO: Replace with Firebase Auth user data
export const user: SidebarUser = {
  name: 'RIVAlumni Operator',
  email: 'operator@riv-alumni.com',
  avatar: '/avatars/shadcn.jpg',
};

export const navMain: NavItem[] = [
  { title: 'Dashboard', url: '/workflow/home', icon: DashboardIcon },
  { title: 'Reception (Check-in)', url: '/workflow/reception', icon: MoodCheckIcon },
  { title: 'Reception 2 · Dashboard', url: '/workflow/reception2', icon: LayoutGridIcon },
  { title: 'Conflict Resolution', url: '/workflow/resolve', icon: FaceIdErrorIcon },
];

export const records: DocumentItem[] = [
  { name: 'Registrations', url: '/workflow/records', icon: DatabaseIcon },
  { name: 'Generate Report', url: '/workflow/generate', icon: ReportIcon },
];

export const navSecondary: NavItem[] = [
  { title: 'Settings', url: '/workflow/settings', icon: SettingsIcon },
  { title: 'Get Help', url: '/workflow/help', icon: HelpIcon },
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
