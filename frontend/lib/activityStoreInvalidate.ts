/**
 * Thin module that exposes the store's invalidate + state-reset functions
 * without importing the full activityStore — prevents a circular dependency
 * between activityStore ↔ supabaseActivityStore.
 *
 * activityStore.ts calls setInvalidateFn() and setResetStateFn() on load.
 * supabaseActivityStore.ts calls invalidateActivities() + resetSupabaseState()
 * after a write so the next render re-fetches from Supabase.
 */

let _invalidate: (() => void) | null = null;
let _resetState: (() => void) | null = null;

export function setInvalidateFn(fn: () => void): void {
  _invalidate = fn;
}

export function setResetStateFn(fn: () => void): void {
  _resetState = fn;
}

export function invalidateActivities(): void {
  _invalidate?.();
}

export function resetSupabaseState(): void {
  _resetState?.();
}
