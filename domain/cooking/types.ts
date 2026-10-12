// Domain types for active kitchen cooking session

export interface StepTimerState {
  stepNumber: number;
  totalSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
}

export interface CookSessionState {
  recipeId: string;
  targetServings: number;
  currentStepIndex: number;
  completedStepNumbers: number[];
  timers: Record<number, StepTimerState>;
  isMiseEnPlaceDone: boolean;
  startedAt: string;
}

export type CookSessionAction =
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; stepIndex: number }
  | { type: 'TOGGLE_STEP_COMPLETED'; stepNumber: number }
  | { type: 'START_TIMER'; stepNumber: number }
  | { type: 'PAUSE_TIMER'; stepNumber: number }
  | { type: 'RESET_TIMER'; stepNumber: number }
  | { type: 'TICK_TIMER'; stepNumber: number }
  | { type: 'SET_MISE_EN_PLACE_DONE'; done: boolean };
