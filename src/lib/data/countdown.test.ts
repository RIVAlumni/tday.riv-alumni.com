import { describe, expect, it } from 'vitest';
import {
  EVENT_START_MS,
  getCountdownState,
  PRE_REGISTRATION_CLOSE_MS,
  VACATE_BY_MS,
} from './countdown';

describe('Teachers’ Day countdown', () => {
  it('counts down to pre-registration before the closing instant', () => {
    const state = getCountdownState(PRE_REGISTRATION_CLOSE_MS - 1);

    expect(state.phase).toBe('pre-registration');
    expect(state.units.map((unit) => unit.value)).toEqual(['00', '00', '00', '01']);
  });

  it('switches to the event countdown exactly when pre-registration closes', () => {
    expect(getCountdownState(PRE_REGISTRATION_CLOSE_MS).phase).toBe('event');
  });

  it('switches to the vacate countdown exactly when the event begins', () => {
    expect(getCountdownState(EVENT_START_MS).phase).toBe('vacate');
  });

  it('marks the visit complete exactly at the vacate deadline', () => {
    const state = getCountdownState(VACATE_BY_MS);

    expect(state.phase).toBe('complete');
    expect(state.complete).toBe(true);
    expect(state.deadline).toBe('Thank you for coming back to RIVPS.');
    expect(state.units.map((unit) => unit.value)).toEqual(['00', '00', '00', '00']);
  });
});
