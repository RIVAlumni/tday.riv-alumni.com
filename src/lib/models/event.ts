import type { Timestamp } from 'firebase/firestore';

export interface Event {
  event_id: number;
  event_name: string;
  event_start: Timestamp;
  event_end: Timestamp;
  // teacher email -> teacher name; not yet populated
  teachers: Record<string, string>;
}
