/**
 * The text of something thrown. A Tauri plugin on Android rejects with a plain
 * object holding the message, which String() would show as "[object Object]".
 */
export const errorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message);
  }
  return String(error);
};
