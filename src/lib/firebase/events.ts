import { doc, getDoc } from 'firebase/firestore';

import type { Event } from '$lib/models/event';

import { getInternalFirestore } from './firestore';

export async function getEvent(eventId: string): Promise<Event | null> {
  const snapshot = await getDoc(doc(getInternalFirestore(), 'events', eventId));
  return snapshot.exists() ? (snapshot.data() as Event) : null;
}
