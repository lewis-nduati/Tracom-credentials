/**
 * Debug Logger
 *
 * Conditional logging that can be enabled/disabled via environment variable.
 * Set NEXT_PUBLIC_DEBUG_LOGGING=true to enable debug logs.
 *
 * Logs are OFF by default, even in development. To enable:
 * - Add NEXT_PUBLIC_DEBUG_LOGGING=true to .env.local
 * - Or run: NEXT_PUBLIC_DEBUG_LOGGING=true npm run dev
 */

const isDebugEnabled = (): boolean => {
  if (typeof window === "undefined") return false;
  return process.env.NEXT_PUBLIC_DEBUG_LOGGING === "true";
};

interface LoggerOptions {
  /** Namespace prefix for logs (e.g., "Auth", "PendingTx") */
  namespace?: string;
}

function formatMessage(namespace: string | undefined, message: string): string {
  return namespace ? `[${namespace}] ${message}` : message;
}

/**
 * Create a namespaced debug logger
 */
export function createDebugLogger(options: LoggerOptions = {}) {
  const { namespace } = options;

  return {
    info: (message: string, ...args: unknown[]) => {
      if (!isDebugEnabled()) return;
      console.log(formatMessage(namespace, message), ...args);
    },

    warn: (message: string, ...args: unknown[]) => {
      if (!isDebugEnabled()) return;
      console.warn(formatMessage(namespace, message), ...args);
    },

    error: (message: string, ...args: unknown[]) => {
      // Errors are always logged
      console.error(formatMessage(namespace, message), ...args);
    },

    debug: (message: string, ...args: unknown[]) => {
      if (!isDebugEnabled()) return;
      console.debug(formatMessage(namespace, message), ...args);
    },

    /** Log with a custom emoji prefix */
    emoji: (emoji: string, message: string, ...args: unknown[]) => {
      if (!isDebugEnabled()) return;
      console.log(`${emoji} ${formatMessage(namespace, message)}`, ...args);
    },
  };
}

// Pre-configured loggers for common namespaces
export const authLogger = createDebugLogger({ namespace: "Auth" });
export const pendingTxLogger = createDebugLogger({ namespace: "PendingTx" });
export const learnerLogger = createDebugLogger({ namespace: "Learner" });
export const txLogger = createDebugLogger({ namespace: "TX" });
export const syncLogger = createDebugLogger({ namespace: "Sync" });
export const projectLogger = createDebugLogger({ namespace: "Project" });
export const courseLogger = createDebugLogger({ namespace: "Course" });
export const gatewayLogger = createDebugLogger({ namespace: "Gateway" });
export const indexerLogger = createDebugLogger({ namespace: "Cardano Indexer" });
export const meshLogger = createDebugLogger({ namespace: "Mesh" });

// Generic debug logger
export const debugLog = createDebugLogger();
