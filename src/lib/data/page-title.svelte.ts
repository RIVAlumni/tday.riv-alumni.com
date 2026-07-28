let current = $state<string | null>(null);

export function setPageTitle(title: string | null) {
  current = title;
}

export function getPageTitle(): string | null {
  return current;
}
