import type { IconComponent } from '$lib/icons';
import {
  DashboardSquare01Icon,
  Database01Icon,
  FaceIdIcon,
  HelpCircleIcon,
  LayoutGridIcon,
  CheckmarkCircle01Icon,
  Note01Icon,
  Settings01Icon,
} from '$lib/icons';

export interface NavItem {
  title: string;
  url: string;
  icon: IconComponent;
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

// prettier-ignore
export const navMain: NavItem[] = [
  { title: 'Dashboard',            url: '/workflow/home',      icon: DashboardSquare01Icon   },
  { title: 'Reception (Check-in)', url: '/workflow/reception', icon: CheckmarkCircle01Icon   },
  { title: 'Conflict Resolution',  url: '/workflow/resolve',   icon: FaceIdIcon },
];

// prettier-ignore
export const records: NavItem[] = [
  { title: 'Registrations',   url: '/workflow/records',  icon: Database01Icon },
  { title: 'Generate Report', url: '/workflow/generate', icon: Note01Icon   },
  { title: 'Audit Logs',      url: '/workflow/logs',     icon: Note01Icon   },
];

// prettier-ignore
export const navSecondary: NavItem[] = [
  { title: 'Settings',        url: '/workflow/settings',   icon: Settings01Icon },
  { title: 'Getting Started', url: '/workflow/onboarding', icon: HelpCircleIcon     },
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
