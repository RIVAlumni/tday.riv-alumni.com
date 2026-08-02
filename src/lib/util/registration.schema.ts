import { z } from 'zod';

// ---- Written message pair ------------------------------------------------

export const writtenMessageSchema = z.object({
  teacher_name: z.string().min(1, 'Teacher name is required').max(120),
  message: z.string().min(1, 'Message is required').max(2000),
});

// ---- Raw form fields (before transform) ----------------------------------

export const registrationFormSchema = z
  .object({
    email: z.string().email('A verified email is required'),
    full_name: z.string().min(1, 'Full name is required').max(120),
    contact_number: z
      .string()
      .transform((v) => v.replace(/\D/g, ''))
      .pipe(
        z
          .string()
          .length(8, 'Contact number must be exactly 8 digits')
          .regex(/^[89]/, 'Contact number must start with 8 or 9'),
      ),
    graduating_year: z.string().min(1, 'Graduating year is required'),
    visiting_teachers: z
      .string()
      .min(1, 'At least one teacher is required')
      .max(1000)
      .transform((val) =>
        val
          .split(/[\n,]+/)
          .map((t) => t.trim())
          .filter(Boolean),
      )
      .pipe(
        z
          .array(z.string().max(120))
          .min(1, 'At least one teacher is required')
          .max(20, 'Maximum 20 teachers'),
      )
      .refine((arr) => new Set(arr).size === arr.length, 'Duplicate teacher names found'),
    teacher1_name: z.string().max(120).optional().default(''),
    teacher1_message: z.string().max(2000).optional().default(''),
    teacher2_name: z.string().max(120).optional().default(''),
    teacher2_message: z.string().max(2000).optional().default(''),
  })
  .transform((data) => {
    const written_messages: { teacher_name: string; message: string }[] = [];

    const pair1Name = (data.teacher1_name ?? '').trim();
    const pair1Msg = (data.teacher1_message ?? '').trim();
    if (pair1Name || pair1Msg) {
      written_messages.push({ teacher_name: pair1Name, message: pair1Msg });
    }

    const pair2Name = (data.teacher2_name ?? '').trim();
    const pair2Msg = (data.teacher2_message ?? '').trim();
    if (pair2Name || pair2Msg) {
      written_messages.push({ teacher_name: pair2Name, message: pair2Msg });
    }

    return {
      email: data.email,
      full_name: data.full_name,
      contact_number: data.contact_number,
      graduating_year: data.graduating_year,
      visiting_teachers: data.visiting_teachers,
      written_messages,
    };
  })
  .pipe(
    z.object({
      email: z.string().email(),
      full_name: z.string().min(1).max(120),
      contact_number: z.string().length(8),
      graduating_year: z.string().min(1),
      visiting_teachers: z.array(z.string()).min(1).max(20),
      written_messages: z
        .array(writtenMessageSchema)
        .max(2),
    }),
  );

export type RegistrationFormInput = z.output<typeof registrationFormSchema>;
