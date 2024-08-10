import { FieldValue } from 'firebase-admin/firestore';
import { FSMetadata } from '.';

enum FSUserAccessLevel {
  None = 0,
  Operator = 1,
  Mediator = 2,
}

interface FSUser extends FSMetadata {
  readonly uid: string;
  readonly email: string | null;
  readonly display_name: string | null;
  readonly access_level: FSUserAccessLevel;
  readonly access_expires: FieldValue;
}

export type { FSUser };
export { FSUserAccessLevel };
