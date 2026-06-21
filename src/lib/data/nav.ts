import type { Icon } from '@tabler/icons-svelte';
import DashboardIcon from '@tabler/icons-svelte/icons/dashboard';
import DatabaseIcon from '@tabler/icons-svelte/icons/database';
import FaceIdErrorIcon from '@tabler/icons-svelte/icons/face-id-error';
import FileWordIcon from '@tabler/icons-svelte/icons/file-word';
import HelpIcon from '@tabler/icons-svelte/icons/help';
import MoodCheckIcon from '@tabler/icons-svelte/icons/mood-check';
import ReportIcon from '@tabler/icons-svelte/icons/report';
import SearchIcon from '@tabler/icons-svelte/icons/search';
import SettingsIcon from '@tabler/icons-svelte/icons/settings';

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
  { title: 'Check-In', url: '/workflow/check-in', icon: MoodCheckIcon },
  { title: 'Conflict Resolution', url: '#', icon: FaceIdErrorIcon },
];

export const navSecondary: NavItem[] = [
  { title: 'Settings', url: '#', icon: SettingsIcon },
  { title: 'Get Help', url: '#', icon: HelpIcon },
  { title: 'Search', url: '#', icon: SearchIcon },
];

export const documents: DocumentItem[] = [
  { name: 'Data Library', url: '#', icon: DatabaseIcon },
  { name: 'Reports', url: '#', icon: ReportIcon },
  { name: 'Word Assistant', url: '#', icon: FileWordIcon },
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
  navMain
    .filter((item) => item.url !== '#')
    .map((item) => [item.url, item.title] as const),
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
