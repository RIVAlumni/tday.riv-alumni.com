import type {
  Registration2026,
  Registration2026Submission,
  WrittenMessage,
} from '$lib/models/registration';

import { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

const MAX_MESSAGE_CHARACTERS = 10_000;
const MAX_MESSAGE_WORDS = 150;

function hasAtMostMessageWords(message: string): boolean {
  return message.trim().split(/\s+/).filter(Boolean).length <= MAX_MESSAGE_WORDS;
}

export const writtenMessageSchema = z
  .object({
    teacher_name: z.string().min(1, 'Teacher name is required').max(120),
    message: z
      .string()
      .trim()
      .min(1, 'Message is required')
      .max(MAX_MESSAGE_CHARACTERS)
      .refine(hasAtMostMessageWords, `Message must be ${MAX_MESSAGE_WORDS} words or fewer`),
  })
  .strict() satisfies z.ZodType<WrittenMessage>;

export const registration2026Schema = z
  .object({
    event_id: z.literal('2026'),
    registration_id: z.string().regex(/^[A-HJ-NP-Z]{6}$/),
    email: z.email().max(254),
    full_name: z.string().min(1).max(120),
    status: z.enum(['REGISTERED', 'CHECKED_IN', 'CONFLICT', 'REJECTED']),
    comments: z.string().max(10000),
    created_at: z.instanceof(Timestamp),
    updated_at: z.instanceof(Timestamp),
    contact_number: z.string().regex(/^[89][0-9]{7}$/),
    graduating_year: z.string().regex(/^(1999|20(0[0-9]|1[0-9]|2[0-6]))$/),
    visiting_teachers: z
      .array(z.string().min(1).max(120))
      .min(1)
      .max(20)
      .refine((teachers) => new Set(teachers).size === teachers.length),
    written_messages: z.array(writtenMessageSchema).max(2),
    arrived_at: z.instanceof(Timestamp).nullable(),
  })
  .strict() satisfies z.ZodType<Registration2026>;

export const registration2026SubmissionSchema = registration2026Schema.pick({
  full_name: true,
  contact_number: true,
  graduating_year: true,
  visiting_teachers: true,
  written_messages: true,
}) satisfies z.ZodType<Registration2026Submission>;

const optionalFormField = z.string().trim().optional().default('');
const optionalMessageFormField = z
  .string()
  .trim()
  .max(MAX_MESSAGE_CHARACTERS)
  .refine(hasAtMostMessageWords, `Message must be ${MAX_MESSAGE_WORDS} words or fewer`)
  .optional()
  .default('');

export function registrationFormFieldName(path: PropertyKey[]): string {
  return path
    .join('.')
    .replace(/^visiting_teachers\.\d+$/, 'visiting_teachers')
    .replace('written_messages.0.teacher_name', 'teacher1_name')
    .replace('written_messages.0.message', 'teacher1_message')
    .replace('written_messages.1.teacher_name', 'teacher2_name')
    .replace('written_messages.1.message', 'teacher2_message');
}

export const registrationFormSchema = z
  .object({
    email: z.string().trim().toLowerCase().pipe(z.email('A verified email is required').max(254)),
    full_name: z.string().trim().min(1, 'Full name is required').max(120).toUpperCase(),
    contact_number: z
      .string()
      .trim()
      .regex(/^[89][0-9]{7}$/, 'Contact number must be 8 digits and start with 8 or 9'),
    graduating_year: z
      .string()
      .trim()
      .regex(/^(1999|20(0[0-9]|1[0-9]|2[0-6]))$/, 'Select a valid graduating year'),
    visiting_teachers: z
      .string()
      .trim()
      .min(1, 'At least one teacher is required')
      .max(1000)
      .transform((value) =>
        value
          .split(/[\n,]+/)
          .map((teacher) => teacher.trim())
          .filter(Boolean),
      )
      .pipe(
        z
          .array(z.string().min(1).max(120))
          .min(1, 'At least one teacher is required')
          .max(20, 'Maximum 20 teachers')
          .refine(
            (teachers) => new Set(teachers).size === teachers.length,
            'Duplicate teacher names found',
          ),
      ),
    teacher1_name: optionalFormField,
    teacher1_message: optionalMessageFormField,
    teacher2_name: optionalFormField,
    teacher2_message: optionalMessageFormField,
  })
  .strict()
  .superRefine((data, context) => {
    for (const pair of [
      {
        name: data.teacher1_name,
        message: data.teacher1_message,
        namePath: 'teacher1_name',
        messagePath: 'teacher1_message',
      },
      {
        name: data.teacher2_name,
        message: data.teacher2_message,
        namePath: 'teacher2_name',
        messagePath: 'teacher2_message',
      },
    ]) {
      if (pair.name && !pair.message) {
        context.addIssue({
          code: 'custom',
          message: 'Message is required',
          path: [pair.messagePath],
        });
      }
      if (!pair.name && pair.message) {
        context.addIssue({
          code: 'custom',
          message: 'Teacher name is required',
          path: [pair.namePath],
        });
      }
    }
  })
  .transform((data): Registration2026Submission => {
    const writtenMessages: WrittenMessage[] = [];
    if (data.teacher1_name && data.teacher1_message) {
      writtenMessages.push({ teacher_name: data.teacher1_name, message: data.teacher1_message });
    }
    if (data.teacher2_name && data.teacher2_message) {
      writtenMessages.push({ teacher_name: data.teacher2_name, message: data.teacher2_message });
    }

    return {
      full_name: data.full_name,
      contact_number: data.contact_number,
      graduating_year: data.graduating_year,
      visiting_teachers: data.visiting_teachers,
      written_messages: writtenMessages,
    } satisfies Registration2026Submission;
  })
  .pipe(registration2026SubmissionSchema);

export type RegistrationFormInput = z.input<typeof registrationFormSchema>;
export type RegistrationFormOutput = z.output<typeof registrationFormSchema>;
