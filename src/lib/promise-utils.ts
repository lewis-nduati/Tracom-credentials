/**
 * Race a promise against a timeout.
 * Rejects with a descriptive message if the timeout fires first.
 *
 * Pure utility — no env, no framework, no auth dependencies. Callers that only
 * need this helper should import from here so their import chain stays free of
 * `~/env` validation (useful for unit tests).
 */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Timeout: ${label} (${ms}ms)`)),
      ms,
    );
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(timer);
        reject(e instanceof Error ? e : new Error(String(e)));
      },
    );
  });
}
