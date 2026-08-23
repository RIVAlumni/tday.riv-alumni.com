import { createContext } from 'svelte';

export type TimelineOrientation = 'horizontal' | 'vertical';

interface TimelineContextValue {
  activeStep: () => number;
  orientation: () => TimelineOrientation;
}

export const [getTimelineContext, setTimelineContext] = createContext<TimelineContextValue>();
