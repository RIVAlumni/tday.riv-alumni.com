import type { Registration } from '$lib/models/registration';

const MAX_NGRAM_LENGTH = 3;

export function normalizeRegistrationSearchValue(value: unknown): string {
  return String(value ?? '')
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('en-SG');
}

export function splitRegistrationSearchTerms(value: string): string[] {
  return [...new Set(normalizeRegistrationSearchValue(value).split(/\s+/).filter(Boolean))];
}

export function buildRegistrationSearchNgrams(values: unknown[]): string[] {
  const ngrams = new Set<string>();

  for (const value of values) {
    const tokens = normalizeRegistrationSearchValue(value).split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      const characters = Array.from(token);
      for (let start = 0; start < characters.length; start++) {
        for (
          let length = 1;
          length <= MAX_NGRAM_LENGTH && start + length <= characters.length;
          length++
        ) {
          ngrams.add(characters.slice(start, start + length).join(''));
        }
      }
    }
  }

  return [...ngrams].sort();
}

export function searchNgramForTerm(term: string): string {
  return Array.from(normalizeRegistrationSearchValue(term)).slice(0, MAX_NGRAM_LENGTH).join('');
}

export function registrationVisitsAllTeachers(
  registration: Registration,
  visitingTeachers: string[],
): boolean {
  if (visitingTeachers.length === 0) return true;
  const registeredTeachers = registration.visiting_teachers;
  if (!Array.isArray(registeredTeachers)) return false;

  return visitingTeachers.every((teacher) => registeredTeachers.includes(teacher));
}

export function registrationMatchesSearch(registration: Registration, search: string): boolean {
  const email = 'email' in registration ? registration.email : '';
  const values = [
    registration.registration_id,
    registration.full_name,
    registration.contact_number,
    email,
  ].map(normalizeRegistrationSearchValue);

  return splitRegistrationSearchTerms(search).every((term) =>
    values.some((value) => value.includes(term)),
  );
}

export function legacyRegistrationMatchesPrefixSearch(
  registration: Registration,
  search: string,
): boolean {
  const values = [
    registration.registration_id,
    registration.full_name,
    registration.contact_number,
  ].map(normalizeRegistrationSearchValue);

  return splitRegistrationSearchTerms(search).every((term) =>
    values.some((value) => value.startsWith(term)),
  );
}

export function legacyContactNumberRange(term: string): [number, number] | null {
  if (!/^\d{1,8}$/.test(term)) return null;

  const magnitude = 10 ** (8 - term.length);
  const lowerBound = Number(term) * magnitude;
  return [lowerBound, lowerBound + magnitude - 1];
}
