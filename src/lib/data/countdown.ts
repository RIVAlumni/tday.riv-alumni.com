export const PRE_REGISTRATION_CLOSE_ISO = '2026-07-29T11:00:00+08:00';
export const EVENT_START_ISO = '2026-09-03T11:00:00+08:00';
export const VACATE_BY_ISO = '2026-09-03T12:30:00+08:00';

export const PRE_REGISTRATION_CLOSE_MS = Date.parse(PRE_REGISTRATION_CLOSE_ISO);
export const EVENT_START_MS = Date.parse(EVENT_START_ISO);
export const VACATE_BY_MS = Date.parse(VACATE_BY_ISO);

export type CountdownPhase = 'pre-registration' | 'event' | 'vacate' | 'complete';

export type CountdownUnit = {
  label: 'Days' | 'Hours' | 'Minutes' | 'Seconds';
  value: string;
};

export type CountdownState = {
  phase: CountdownPhase;
  eyebrow: string;
  deadline: string;
  targetIso: string | null;
  units: CountdownUnit[];
  complete: boolean;
  ariaLabel: string;
};

const phaseDetails = {
  'pre-registration': {
    eyebrow: 'Pre-registration closes in',
    deadline: '28 August 2026 · 11:59 PM SGT',
    targetIso: PRE_REGISTRATION_CLOSE_ISO,
    targetMs: PRE_REGISTRATION_CLOSE_MS,
  },
  'event': {
    eyebrow: 'Teachers’ Day visit begins in',
    deadline: '3 September 2026 · 11:00 AM SGT',
    targetIso: EVENT_START_ISO,
    targetMs: EVENT_START_MS,
  },
  'vacate': {
    eyebrow: 'Alumni must vacate in',
    deadline: 'Please leave the school by 12:30 PM SGT',
    targetIso: VACATE_BY_ISO,
    targetMs: VACATE_BY_MS,
  },
} as const;

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function splitDuration(remainingMs: number): CountdownUnit[] {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1_000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return [
    { label: 'Days', value: pad(days) },
    { label: 'Hours', value: pad(hours) },
    { label: 'Minutes', value: pad(minutes) },
    { label: 'Seconds', value: pad(seconds) },
  ];
}

function getPhase(nowMs: number): CountdownPhase {
  if (nowMs < PRE_REGISTRATION_CLOSE_MS) return 'pre-registration';
  if (nowMs < EVENT_START_MS) return 'event';
  if (nowMs < VACATE_BY_MS) return 'vacate';
  return 'complete';
}

export function getCountdownState(nowMs = Date.now()): CountdownState {
  const phase = getPhase(nowMs);

  if (phase === 'complete') {
    const units = splitDuration(0);
    return {
      phase,
      eyebrow: 'The visit has ended',
      deadline: 'Thank you for coming back to RIVPS.',
      targetIso: null,
      units,
      complete: true,
      ariaLabel: 'The 2026 Teachers’ Day visit has ended.',
    };
  }

  const details = phaseDetails[phase];
  const units = splitDuration(details.targetMs - nowMs);
  const spokenUnits = units
    .map((unit) => `${Number(unit.value)} ${unit.label.toLowerCase()}`)
    .join(', ');

  return {
    phase,
    eyebrow: details.eyebrow,
    deadline: details.deadline,
    targetIso: details.targetIso,
    units,
    complete: false,
    ariaLabel: `${details.eyebrow}: ${spokenUnits}.`,
  };
}
