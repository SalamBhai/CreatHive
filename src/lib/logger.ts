/**
 * Structured system log for external services, warnings and failures.
 * Emits one JSON object per line to stderr/stdout. In development the terminal
 * is the log; in production the platform collector ingests the same format.
 * No credentials or raw payloads are ever written.
 *
 * To persist locally: npm run dev 2>&1 | tee .dev/system.log
 */

export type LogLevel = 'info' | 'warn' | 'error';
export type LogSource =
  | 'auth'
  | 'signup'
  | 'email'
  | 'push'
  | 'cloudinary'
  | 'inquiry'
  | 'pwa'
  | 'system';

interface LogInput {
  source: LogSource;
  message: string;
  level?: LogLevel;
  /** Short, non-sensitive context only (ids, status codes, file names). */
  context?: Record<string, string | number | boolean | null | undefined>;
  error?: unknown;
}

function serialiseError(error: unknown): string | undefined {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof error === 'string') return error.slice(0, 300);
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const message = record.message ?? record.error;
    return message ? String(message).slice(0, 300) : 'unknown error';
  }
  return undefined;
}

function cleanContext(
  context?: Record<string, string | number | boolean | null | undefined>
) {
  if (!context) return undefined;
  const result: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(context)) {
    if (value === undefined || value === null) continue;
    // Drop anything that looks like a token, secret or email body.
    if (/token|secret|password|authorization|api[_-]?key/i.test(key)) continue;
    result[key] = typeof value === 'string' ? value.slice(0, 200) : value;
  }
  return Object.keys(result).length ? result : undefined;
}

/** Fire-and-forget. Logging must never break the operation being logged. */
export function logEvent({
  source,
  message,
  level = 'info',
  context,
  error,
}: LogInput): void {
  if (typeof window !== 'undefined') return; // server-only

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    source,
    message,
    ...(context ? { context: cleanContext(context) } : {}),
    ...(error ? { error: serialiseError(error) } : {}),
  };
  const line = JSON.stringify(entry);
  const emit = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  emit(line);
}

export const logInfo = (source: LogSource, message: string, context?: LogInput['context']) =>
  logEvent({ source, message, level: 'info', context });

export const logWarn = (
  source: LogSource,
  message: string,
  context?: LogInput['context'],
  error?: unknown
) => logEvent({ source, message, level: 'warn', context, error });

export const logError = (
  source: LogSource,
  message: string,
  error?: unknown,
  context?: LogInput['context']
) => logEvent({ source, message, level: 'error', context, error });
