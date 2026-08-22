import { TEACHER_EMAILS } from '$lib/data/teacher-emails';

export const TEACHER_EMAIL_SUBJECT = "[RIVA Teachers' Day] Students Visiting You on Teachers' Day";

export interface TeacherEmailStudent {
  full_name: string;
  graduating_year: string;
}

export interface TeacherEmailTemplate {
  date: string;
  startTime: string;
  endTime: string;
}

export function buildTeacherEmailBody(
  teacher: string,
  students: TeacherEmailStudent[],
  template: TeacherEmailTemplate,
): string {
  const items = students.map(
    (student, index) =>
      `${index + 1}. ${student.full_name} (Graduate of ${student.graduating_year})`,
  );

  return [
    `Dear ${teacher},`,
    '',
    "As Teachers' Day approaches, the Rivervale Primary School Alumni Association (RIVA) is coordinating with former students interested in visiting their teachers on " +
      template.date +
      '.',
    '',
    `A total of ${students.length} student(s) have expressed interest in dropping by to see you! You may refer to the list of students below:`,
    '',
    ...items,
    '',
    `In order to manage the total number of visiting students, we would greatly appreciate if you could let us know if you will be present on campus between ${template.startTime} and ${template.endTime} on ${template.date}.`,
    '',
    'Thank you!',
    '',
    'Yours sincerely,',
    "RIVA Teachers' Day Organising Committee (TDOC)",
  ].join('\r\n');
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

// Rich-text variant of the email body: the student list becomes an HTML
// table, so pasting into an email client renders it like a spreadsheet.
export function buildTeacherEmailBodyHtml(
  teacher: string,
  students: TeacherEmailStudent[],
  template: TeacherEmailTemplate,
): string {
  const rows = students.map(
    (student) =>
      `<tr><td>${escapeHtml(student.full_name)}</td><td>${escapeHtml(student.graduating_year)}</td></tr>`,
  );
  const table =
    '<table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;text-align:left">' +
    '<tr><th>Name</th><th>Graduation Year</th></tr>' +
    rows.join('') +
    '</table>';

  return [
    `<p>Dear ${escapeHtml(teacher)},</p>`,
    "<p>As Teachers' Day approaches, the Rivervale Primary School Alumni Association (RIVA) is coordinating with former students interested in visiting their teachers on " +
      escapeHtml(template.date) +
      '.</p>',
    `<p>A total of ${students.length} student(s) have expressed interest in dropping by to see you! You may refer to the list of students below:</p>`,
    table,
    `<p>In order to manage the total number of visiting students, we would greatly appreciate if you could let us know if you will be present on campus between ${escapeHtml(template.startTime)} and ${escapeHtml(template.endTime)} on ${escapeHtml(template.date)}.</p>`,
    '<p>Thank you!</p>',
    "<p>Yours sincerely,<br>RIVA Teachers' Day Organising Committee (TDOC)</p>",
  ].join('');
}

export function formatEventDate(value: Date | null | undefined): string {
  if (!value) return '-';
  return value.toLocaleDateString('en-SG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Singapore',
  });
}

export function formatEventTime(value: Date | null | undefined): string {
  if (!value) return '-';
  return value.toLocaleTimeString('en-SG', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Singapore',
  });
}

export function teacherMailtoHref(
  teacher: string,
  students: TeacherEmailStudent[],
  template: TeacherEmailTemplate,
): string {
  const email = TEACHER_EMAILS[teacher] ?? '';
  const body = buildTeacherEmailBody(teacher, students, template);
  return `mailto:${email}?subject=${encodeURIComponent(TEACHER_EMAIL_SUBJECT)}&body=${encodeURIComponent(body)}`;
}
