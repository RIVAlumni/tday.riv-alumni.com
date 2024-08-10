import type { FieldValue } from 'firebase-admin/firestore';

interface FSMetadata {
  readonly updated_at: FieldValue;
  readonly created_at: FieldValue;
}

export type { FSMetadata };
