import { browser } from '$app/env';

import { defaultEventId, events, getEvent, type ReceptionEvent } from '$lib/data/reception';

const STORAGE_KEY = 'reception:active-event';

class EventStore {
  activeEventId = $state(defaultEventId);

  private hydrated = false;

  get activeEvent(): ReceptionEvent {
    return getEvent(this.activeEventId);
  }

  hydrate(): void {
    if (this.hydrated || !browser) return;
    this.hydrated = true;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && events.some((event) => event.id === stored)) {
      this.activeEventId = stored;
    }
  }

  setActiveEvent(id: string): void {
    if (!events.some((event) => event.id === id)) return;

    this.activeEventId = id;
    if (browser) localStorage.setItem(STORAGE_KEY, id);
  }
}

export const eventStore = new EventStore();
