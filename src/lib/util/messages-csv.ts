import type { MessageRow } from '$lib/util/messages';

export function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function buildMessagesCsv(messages: MessageRow[]): string {
  const header = [
    csvEscape('student_name'),
    csvEscape('graduating_year'),
    csvEscape('teacher_name'),
    csvEscape('written_message'),
    csvEscape('written_at'),
  ].join(',');
  const rows = messages.map(
    ({ student_name, graduating_year, teacher_name, message, written_at }) =>
      [
        csvEscape(student_name),
        csvEscape(graduating_year),
        csvEscape(teacher_name),
        csvEscape(message),
        csvEscape(written_at.toDate().toISOString()),
      ].join(','),
  );
  return '\uFEFF' + [header, ...rows].join('\r\n');
}
