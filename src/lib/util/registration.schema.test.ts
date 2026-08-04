import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import {
  registration2026Schema,
  registration2026SubmissionSchema,
  registrationFormFieldName,
  registrationFormSchema,
} from './registration.schema';

const VALID_FORM = {
  email: ' Visitor@Example.com ',
  full_name: ' Example Visitor ',
  contact_number: '91234567',
  graduating_year: '2021',
  visiting_teachers: ['MDM NG HWEE KOON', 'MR LIM ZE WEI', 'MDM CHAN PUI YONG'],
  teacher1_name: ' MR LIM ZE WEI ',
  teacher1_message: ' Thank you! ',
  teacher2_name: '',
  teacher2_message: '',
};

const LONG_TEACHER_TEXT =
  "') or ('1'='1-- Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
const MAX_WORD_MESSAGE = Array.from({ length: 150 }, (_, index) => `longteacherword${index}`).join(
  ' ',
);
const OVER_WORD_LIMIT_MESSAGE = `${MAX_WORD_MESSAGE} overflow`;

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
      visiting_teachers: ['MDM NG HWEE KOON', 'MR LIM ZE WEI', 'MDM CHAN PUI YONG'],
      written_messages: [{ teacher_name: 'MR LIM ZE WEI', message: 'Thank you!' }],
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
      visiting_teachers: ['MR LIM ZE WEI', 'MR LIM ZE WEI'],
    });

    expect(invalidContact.success).toBe(false);
    expect(invalidYear.success).toBe(false);
    expect(duplicateTeachers.success).toBe(false);
  });

  it('accepts 150 words and rejects longer teacher messages', () => {
    const maximumWords = registrationFormSchema.safeParse({
      ...VALID_FORM,
      teacher1_message: MAX_WORD_MESSAGE,
    });
    const teacher1OverLimit = registrationFormSchema.safeParse({
      ...VALID_FORM,
      teacher1_message: OVER_WORD_LIMIT_MESSAGE,
    });
    const teacher2OverLimit = registrationFormSchema.safeParse({
      ...VALID_FORM,
      teacher1_name: '',
      teacher1_message: '',
      teacher2_name: 'MR LIM ZE WEI',
      teacher2_message: OVER_WORD_LIMIT_MESSAGE,
    });

    expect(MAX_WORD_MESSAGE.length).toBeGreaterThan(2000);
    expect(maximumWords.success).toBe(true);
    expect(teacher1OverLimit.success).toBe(false);
    expect(teacher2OverLimit.success).toBe(false);
    if (teacher1OverLimit.success || teacher2OverLimit.success) {
      throw new Error('Expected messages over 150 words to fail');
    }
    expect(teacher1OverLimit.error.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['teacher1_message'] })]),
    );
    expect(teacher2OverLimit.error.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['teacher2_message'] })]),
    );
  });

  it('maps an oversized visiting teacher entry to the selector field', () => {
    const result = registrationFormSchema.safeParse({
      ...VALID_FORM,
      full_name: "') or ('1'='1--",
      contact_number: '80000000',
      graduating_year: '1999',
      visiting_teachers: [
        'MDM NG HWEE KOON',
        'MR LIM ZE WEI',
        'MDM CHAN PUI YONG',
        LONG_TEACHER_TEXT,
      ],
      teacher1_name: 'MR LIM ZE WEI',
      teacher1_message: LONG_TEACHER_TEXT,
      teacher2_name: '',
      teacher2_message: '',
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error('Expected an oversized teacher entry to fail');

    expect(result.error.issues).toEqual([
      expect.objectContaining({ path: ['visiting_teachers', 3] }),
    ]);
    expect(registrationFormFieldName(result.error.issues[0].path)).toBe('visiting_teachers');
  });

  it('rejects teachers that are not available in the selectors', () => {
    const invalidVisitingTeacher = registrationFormSchema.safeParse({
      ...VALID_FORM,
      visiting_teachers: ['MR LIM ZE WEI', 'MR UNKNOWN'],
    });
    const invalidMessageTeacher = registrationFormSchema.safeParse({
      ...VALID_FORM,
      teacher1_name: 'MR UNKNOWN',
    });

    expect(invalidVisitingTeacher.success).toBe(false);
    expect(invalidMessageTeacher.success).toBe(false);
    if (invalidVisitingTeacher.success || invalidMessageTeacher.success) {
      throw new Error('Expected unknown teachers to fail');
    }
    expect(invalidVisitingTeacher.error.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['visiting_teachers', 1] })]),
    );
    expect(invalidMessageTeacher.error.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['teacher1_name'] })]),
    );
  });

  it('keeps the full persisted model strict', () => {
    const submission = registrationFormSchema.parse(VALID_FORM);
    const now = Timestamp.now();
    const registrationResult = registration2026Schema.safeParse({
      event_id: '2026',
      registration_id: 'ABCDEF',
      email: 'visitor@example.com',
      photo_url: '',
      status: 'REGISTERED',
      comments: '',
      created_at: now,
      updated_at: now,
      search_ngrams: ['v', 'vi', 'vis'],
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
