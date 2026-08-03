import type { Timestamp } from 'firebase/firestore';

export enum AccessLevel {
  None = 0,
  Operator = 1,
  Mediator = 2,
  Administrator = 3,
}

export interface User {
  uid: string;
  email: string;
  display_name: string;
  access_level: AccessLevel;
  access_expires: Timestamp;
  updated_at: Timestamp;
  created_at: Timestamp;
}
