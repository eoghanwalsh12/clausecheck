const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(value: string): boolean {
  return UUID_RE.test(value);
}

/** Max upload size in bytes (10 MB) */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function isFileTooLarge(file: File): boolean {
  return file.size > MAX_FILE_SIZE;
}

/**
 * Return a safe error message for API consumers.
 * Never leaks stack traces or internal details.
 */
export function safeErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof SyntaxError) return fallback;
  if (error instanceof Error) {
    // Only surface messages that look user-facing (short, no stack-like content)
    const msg = error.message;
    if (msg.length < 200 && !msg.includes("\n") && !msg.includes("at ")) {
      return msg;
    }
  }
  return fallback;
}
