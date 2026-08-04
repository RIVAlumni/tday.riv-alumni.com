/**
 * Registration draft persistence - saves in-progress form input to localStorage
 * so visitors can close the browser and pick up where they left off.
 *
 * Import from `$lib/util/registration-draft`.
 */

export interface RegistrationDraft {
  full_name: string;
  contact_number: string;
  graduating_year: string;
  visiting_teachers: string[];
  teacher1_name: string;
  teacher1_message: string;
  teacher2_name: string;
  teacher2_message: string;
  privacyConsent: boolean;
}

const DRAFT_STORAGE_KEY = 'riv-tday-2026:registration-draft';

export function emptyRegistrationDraft(): RegistrationDraft {
  return {
    full_name: '',
    contact_number: '',
    graduating_year: '',
    visiting_teachers: [],
    teacher1_name: '',
    teacher1_message: '',
    teacher2_name: '',
    teacher2_message: '',
    privacyConsent: false,
  };
}

export function loadRegistrationDraft(): RegistrationDraft {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return emptyRegistrationDraft();
    return { ...emptyRegistrationDraft(), ...JSON.parse(raw) };
  } catch {
    // unreadable or unavailable storage; start from a blank draft
    return emptyRegistrationDraft();
  }
}

export function saveRegistrationDraft(draft: RegistrationDraft): void {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // storage unavailable (private mode, quota); registration still works
  }
}

export function clearRegistrationDraft(): void {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // storage unavailable; nothing to clear
  }
}
