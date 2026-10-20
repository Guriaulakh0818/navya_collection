/**
 * Executes a background task asynchronously without blocking the current HTTP response.
 * Uses Next.js 15 `after()` when available in the request execution context, or falls back to
 * isolated asynchronous execution so server responses return immediately without waiting.
 */
export function executeBackgroundTask(taskName: string, taskFn: () => Promise<void> | void): void {
  try {
    import('next/server')
      .then(({ after }) => {
        if (typeof after === 'function') {
          after(async () => {
            try {
              await taskFn();
            } catch (err: any) {
              console.error(`[BACKGROUND_TASK_${taskName}_ERROR]`, err?.message || err);
            }
          });
        } else {
          Promise.resolve()
            .then(() => taskFn())
            .catch((err: any) => {
              console.error(`[BACKGROUND_TASK_${taskName}_ERROR]`, err?.message || err);
            });
        }
      })
      .catch(() => {
        Promise.resolve()
          .then(() => taskFn())
          .catch((err: any) => {
            console.error(`[BACKGROUND_TASK_${taskName}_ERROR]`, err?.message || err);
          });
      });
  } catch {
    Promise.resolve()
      .then(() => taskFn())
      .catch((err: any) => {
        console.error(`[BACKGROUND_TASK_${taskName}_ERROR]`, err?.message || err);
      });
  }
}
