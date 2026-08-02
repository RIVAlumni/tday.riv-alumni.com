import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getInternalFirestore } from './firestore';
import { createRegistration } from '$lib/util/registration';
import type { RegistrationFormInput } from '$lib/util/registration.schema';

const MAX_COLLISION_RETRIES = 3;

export class RegistrationWriteError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'RegistrationWriteError';
  }
}

/**
 * Write a validated registration to Firestore.
 *
 * Collection path: `/events/{eventId}/registrations/{registrationId}`
 *
 * A fresh random 6-letter ID is generated per attempt. With a 191M id
 * space and ~300 records per event, collisions are astronomically
 * unlikely — a `permission-denied` on the first attempt is almost
 * certainly a rule validation failure, not an ID clash.
 *
 * Targets the **visitor** Firebase project.
 */
export async function createRegistrationRecord(
  eventId: string,
  input: RegistrationFormInput,
): Promise<string> {
  const firestore = getInternalFirestore();

  for (let attempt = 0; attempt < MAX_COLLISION_RETRIES; attempt++) {
    const registration = createRegistration(input, eventId);
    const ref = doc(firestore, 'events', eventId, 'registrations', String(registration.registration_id));

    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { created_at: _cat, updated_at: _uat, ...rest } = registration as unknown as Record<string, unknown>;
      const record = {
        ...rest,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };
      console.debug('[registrations] record keys', Object.keys(record).sort());
      console.debug('[registrations] record', JSON.parse(JSON.stringify(rest)));
      await setDoc(ref, record);
      return String(registration.registration_id);
    } catch (err: unknown) {
      const fe = err as { code?: string; message?: string };
      const code = fe.code ?? 'unknown';

      console.error('[registrations] Firestore error', { code, message: fe.message, attempt });

      if (code === 'unavailable' || code === 'deadline-exceeded') continue;

      throw new RegistrationWriteError(
        code === 'permission-denied'
          ? `This registration could not be accepted. The data may not meet the requirements, or a registration for this event already exists.\n\nDetails: ${fe.message ?? code}`
          : (err as Error).message ?? 'Unexpected Firestore error',
        code,
      );
    }
  }

  throw new RegistrationWriteError(
    'Registration failed after multiple network attempts.',
    'network-exhausted',
  );
}
