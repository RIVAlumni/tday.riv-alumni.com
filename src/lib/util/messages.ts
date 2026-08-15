import type { Registration, WrittenMessage } from '$lib/models/registration';
import { is2026 } from '$lib/models/registration';
import type { Timestamp } from 'firebase/firestore';

export type MessageRow = WrittenMessage & { student_name: string; written_at: Timestamp };

export function flattenMessages(registrations: Registration[]): MessageRow[] {
  return registrations
    .filter(is2026)
    .flatMap((registration) =>
      (registration.written_messages ?? [])
        .filter(
          (message) =>
            typeof message.teacher_name === 'string' && typeof message.message === 'string',
        )
        .map((message) => ({
          student_name: registration.full_name,
          written_at: registration.created_at,
          ...message,
        })),
    )
    .sort((left, right) =>
      left.teacher_name.localeCompare(right.teacher_name, 'en-SG', { sensitivity: 'base' }),
    );
}
