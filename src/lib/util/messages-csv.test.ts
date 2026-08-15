import { Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';
import { buildMessagesCsv, csvEscape } from './messages-csv';

const WRITTEN_AT = Timestamp.fromDate(new Date('2026-08-15T07:00:00.000Z'));

describe('csvEscape', () => {
  it('wraps plain values in quotes', () => {
    expect(csvEscape('hello')).toBe('"hello"');
  });
  it('doubles internal quotes', () => {
    expect(csvEscape('a"b')).toBe('"a""b"');
  });
  it('preserves commas and newlines inside quotes', () => {
    expect(csvEscape('a,b\nc')).toBe('"a,b\nc"');
  });
});

describe('buildMessagesCsv', () => {
  it('emits header only when empty', () => {
    expect(buildMessagesCsv([])).toBe(
      '\uFEFF"student_name","teacher_name","written_message","written_at"',
    );
  });
  it('emits one row per message with CRLF separators and escapes content', () => {
    expect(
      buildMessagesCsv([
        { student_name: 'STUDENT A', teacher_name: 'MR LIM ZE WEI', message: 'Thank you!', written_at: WRITTEN_AT },
        { student_name: 'STUDENT B', teacher_name: 'MDM NG HWEE KOON', message: 'Hello,\n"world"', written_at: WRITTEN_AT },
      ]),
    ).toBe(
      '\uFEFF"student_name","teacher_name","written_message","written_at"\r\n' +
        '"STUDENT A","MR LIM ZE WEI","Thank you!","2026-08-15T07:00:00.000Z"\r\n' +
        '"STUDENT B","MDM NG HWEE KOON","Hello,\n""world""","2026-08-15T07:00:00.000Z"',
    );
  });
});
