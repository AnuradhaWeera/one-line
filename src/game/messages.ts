import type { Mechanic } from './types';

export type FailReason =
  | 'bomb' | 'moved' | 'order' | 'ink' | 'incomplete' // drawing
  | 'open' | 'trapped' // lasso
  | 'spike' | 'fell' | 'stuck'; // ball

/** Player-facing copy for a failed attempt. `missing` = targets not yet collected. */
export function failMessage(type: Mechanic, reason: FailReason, missing: number): string {
  if (type === 'guide') {
    const m: Partial<Record<FailReason, string>> = {
      bomb: 'Your line touched red.',
      moved: 'A moving red hit your line.',
      spike: 'The ball hit red.',
      fell: 'The ball missed the cup.',
      stuck: 'The ball got stuck.',
    };
    return m[reason] ?? 'Try a different ramp.';
  }
  if (type === 'lasso') {
    const m: Partial<Record<FailReason, string>> = {
      bomb: 'Your loop touched red.',
      moved: 'A moving red hit your loop. Be quicker.',
      open: 'Close the loop: finish where you started.',
      trapped: 'A red one is inside your loop.',
      ink: 'Out of ink before the loop closed.',
      incomplete: `${missing === 1 ? 'Just one diamond' : `${missing} diamonds`} outside the loop.`,
    };
    return m[reason] ?? 'Try again.';
  }
  const m: Partial<Record<FailReason, string>> = {
    bomb: 'Red is off-limits.',
    moved: 'A moving red hit your line. Be quicker.',
    order: 'Follow the numbers in order.',
    ink: `Out of ink with ${missing} left.`,
    incomplete: `${missing} left. The line has to be one stroke.`,
  };
  const msg = m[reason] ?? 'Try again.';
  return missing === 1 && reason !== 'order' ? `Just one left. ${msg}` : msg;
}
