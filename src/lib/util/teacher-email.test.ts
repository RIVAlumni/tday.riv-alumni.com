import { describe, expect, it } from 'vitest';
import {
  buildTeacherEmailBody,
  buildTeacherEmailBodyHtml,
  teacherMailtoHref,
} from './teacher-email';

const students = [
  { full_name: 'ALICE TAN', graduating_year: '2011' },
  { full_name: 'BOB LIM', graduating_year: '2015' },
];

const template = { date: '3 September 2026', startTime: '9:00 am', endTime: '1:00 pm' };

describe('buildTeacherEmailBody', () => {
  it('renders greeting, count, numbered list, time window and signoff', () => {
    const body = buildTeacherEmailBody('MDM NG HWEE KOON', students, template);
    expect(body).toContain('Dear MDM NG HWEE KOON,');
    expect(body).toContain('A total of 2 student(s) have expressed interest');
    expect(body).toContain('1. ALICE TAN (Graduate of 2011)');
    expect(body).toContain('2. BOB LIM (Graduate of 2015)');
    expect(body).not.toContain('|');
    expect(body).toContain('between 9:00 am and 1:00 pm on 3 September 2026.');
    expect(body).toContain("RIVA Teachers' Day Organising Committee (TDOC)");
    expect(body).not.toContain(undefined);
  });

  it('uses CRLF line separators', () => {
    const body = buildTeacherEmailBody('MDM NG HWEE KOON', [], template);
    expect(body.split('\r\n').length).toBeGreaterThan(1);
  });
});

describe('buildTeacherEmailBodyHtml', () => {
  it('renders the body with an HTML table for the students', () => {
    const html = buildTeacherEmailBodyHtml('MDM NG HWEE KOON', students, template);
    expect(html).toContain('<p>Dear MDM NG HWEE KOON,</p>');
    expect(html).toContain('A total of 2 student(s) have expressed interest');
    expect(html).toContain('<tr><th>Name</th><th>Graduation Year</th></tr>');
    expect(html).toContain('<tr><td>ALICE TAN</td><td>2011</td></tr>');
    expect(html).toContain('<tr><td>BOB LIM</td><td>2015</td></tr>');
    expect(html).not.toContain('Contact Number');
    expect(html).toContain('between 9:00 am and 1:00 pm on 3 September 2026.</p>');
    expect(html).toContain("Yours sincerely,<br>RIVA Teachers' Day Organising Committee (TDOC)");
    expect(html).toContain('<table ');
    expect(html).toContain('</table>');
  });

  it('escapes HTML in student names', () => {
    const html = buildTeacherEmailBodyHtml(
      'MDM NG HWEE KOON',
      [{ full_name: 'A & B <SCRIPT>', graduating_year: '2011' }],
      template,
    );
    expect(html).toContain('A &amp; B &lt;SCRIPT&gt;');
    expect(html).not.toContain('A & B <SCRIPT>');
  });
});

describe('teacherMailtoHref', () => {
  it('builds a mailto: with an empty recipient for an unmapped teacher', () => {
    const href = teacherMailtoHref('__UNMAPPED_TEACHER__', students, template);
    expect(href.startsWith('mailto:?subject=')).toBe(true);
    expect(href).toContain(
      'subject=' +
        encodeURIComponent("[RIVA Teachers' Day] Students Visiting You on Teachers' Day"),
    );
    expect(href).toContain('body=' + encodeURIComponent('Dear __UNMAPPED_TEACHER__'));
  });
});
