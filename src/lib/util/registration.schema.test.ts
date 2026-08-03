import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import {
  registration2026Schema,
  registration2026SubmissionSchema,
  registrationFormSchema,
} from './registration.schema';

const VALID_FORM = {
  email: ' Visitor@Example.com ',
  full_name: ' Example Visitor ',
  contact_number: '91234567',
  graduating_year: '2021',
  visiting_teachers: 'Mdm Chan, Mr Lim\nMrs Thomas',
  teacher1_name: ' Mr Lim ',
  teacher1_message: ' Thank you! ',
  teacher2_name: '',
  teacher2_message: '',
};

const SUBMISSION_KEYS = [
  'full_name',
  'contact_number',
  'graduating_year',
  'visiting_teachers',
  'written_messages',
].sort();

describe('registrationFormSchema', () => {
  it('transforms form fields into the exact callable submission model', () => {
    const result = registrationFormSchema.safeParse(VALID_FORM);

    expect(result.success).toBe(true);
    if (!result.success) throw new Error('Expected registration form to pass');

    expect(Object.keys(result.data).sort()).toEqual(SUBMISSION_KEYS);
    expect(result.data).toEqual({
      full_name: 'EXAMPLE VISITOR',
      contact_number: '91234567',
      graduating_year: '2021',
      visiting_teachers: ['Mdm Chan', 'Mr Lim', 'Mrs Thomas'],
      written_messages: [{ teacher_name: 'Mr Lim', message: 'Thank you!' }],
    });
    expect(registration2026SubmissionSchema.safeParse(result.data).success).toBe(true);
  });

  it('reports incomplete written message pairs on their form fields', () => {
    const missingMessage = registrationFormSchema.safeParse({
      ...VALID_FORM,
      teacher1_message: '',
    });
    const missingTeacher = registrationFormSchema.safeParse({
      ...VALID_FORM,
      teacher1_name: '',
    });

    expect(missingMessage.success).toBe(false);
    expect(missingTeacher.success).toBe(false);
    if (missingMessage.success || missingTeacher.success) {
      throw new Error('Expected incomplete message pairs to fail');
    }
    expect(missingMessage.error.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['teacher1_message'] })]),
    );
    expect(missingTeacher.error.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['teacher1_name'] })]),
    );
  });

  it('rejects invalid contact numbers, graduating years, and duplicate teachers', () => {
    const invalidContact = registrationFormSchema.safeParse({
      ...VALID_FORM,
      contact_number: '9abc1234567',
    });
    const invalidYear = registrationFormSchema.safeParse({
      ...VALID_FORM,
      graduating_year: '2027',
    });
    const duplicateTeachers = registrationFormSchema.safeParse({
      ...VALID_FORM,
      visiting_teachers: 'Mr Lim, Mr Lim',
    });

    expect(invalidContact.success).toBe(false);
    expect(invalidYear.success).toBe(false);
    expect(duplicateTeachers.success).toBe(false);
  });

  it('keeps the full persisted model strict', () => {
    const submission = registrationFormSchema.parse(VALID_FORM);
    const now = Timestamp.now();
    const registrationResult = registration2026Schema.safeParse({
      event_id: '2026',
      registration_id: 'ABCDEF',
      email: 'visitor@example.com',
      status: 'REGISTERED',
      comments: '',
      created_at: now,
      updated_at: now,
      arrived_at: null,
      ...submission,
    });
    const extraSubmissionField = registration2026SubmissionSchema.safeParse({
      ...submission,
      email: 'spoofed@example.com',
    });

    expect(registrationResult.success).toBe(true);
    expect(extraSubmissionField.success).toBe(false);
  });
});
