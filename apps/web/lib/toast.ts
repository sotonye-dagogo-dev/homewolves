/**
 * Framework-agnostic toast bridge.
 *
 * `ToastProvider` (root layout) listens for the `hw-toast` window event, so
 * non-React modules (data-layer error handlers) can surface feedback without
 * importing React hooks. Components can also call `useToast()` directly.
 */

export type ToastType = 'success' | 'error' | 'info';
export interface ToastAction {
  label: string;
  href: string;
}
export interface ToastDetail {
  message: string;
  type?: ToastType;
  action?: ToastAction;
}

export function emitToast(
  message: string,
  type: ToastType = 'info',
  action?: ToastAction,
): void {
  if (typeof window === 'undefined' || !message) return;
  window.dispatchEvent(
    new CustomEvent<ToastDetail>('hw-toast', { detail: { message, type, action } }),
  );
}

/** Normalize an unknown error into a safe, user-facing message. */
export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof Error && error.message) {
    // Never leak stack traces or raw gateway HTML to the UI.
    const message = error.message.trim();
    if (message.length > 0 && message.length <= 240 && !message.includes('<')) return message;
  }
  if (typeof error === 'string' && error.trim()) return error.trim().slice(0, 240);
  return fallback;
}
