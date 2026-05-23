/**
 * Transaction Logger
 *
 * Pretty console logging for Andamio transactions during development.
 * Logs API calls, side effects, and results in an easy-to-read format.
 */

const COLORS = {
  header: "color: #8B5CF6; font-weight: bold; font-size: 12px",
  label: "color: #6B7280; font-weight: normal",
  success: "color: #10B981; font-weight: bold",
  error: "color: #EF4444; font-weight: bold",
  warning: "color: #F59E0B; font-weight: bold",
  info: "color: #3B82F6",
  muted: "color: #9CA3AF",
};

function formatJson(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

export const txLogger = {
  /**
   * Log when a transaction build request is made
   */
  buildRequest(txType: string, endpoint: string, method: string, params: unknown) {
    console.groupCollapsed(
      `%c📦 BUILD TX: ${txType}`,
      COLORS.header
    );
    console.log(`%cEndpoint:%c ${method} ${endpoint}`, COLORS.label, COLORS.info);
    console.log(`%cParams:`, COLORS.label);
    console.log(formatJson(params));
    console.groupEnd();
  },

  /**
   * Log the result of a transaction build
   */
  buildResult(txType: string, success: boolean, response: unknown) {
    const icon = success ? "✅" : "❌";
    const style = success ? COLORS.success : COLORS.error;

    console.groupCollapsed(
      `%c${icon} BUILD RESULT: ${txType}`,
      style
    );
    if (success) {
      console.log(`%cUnsigned CBOR received`, COLORS.success);
      if (typeof response === "object" && response !== null && "unsignedTxCBOR" in response) {
        const cbor = (response as { unsignedTxCBOR: string }).unsignedTxCBOR;
        console.log(`%cCBOR (truncated):%c ${cbor.substring(0, 80)}...`, COLORS.label, COLORS.muted);
      }
    } else {
      console.log(`%cError:`, COLORS.label);
      console.log(formatJson(response));
    }
    console.groupEnd();
  },

  /**
   * Log when a side effect request is made
   */
  sideEffectRequest(
    phase: "onSubmit" | "onConfirmation",
    description: string,
    method: string,
    endpoint: string,
    body?: unknown
  ) {
    console.groupCollapsed(
      `%c🔄 SIDE EFFECT [${phase}]: ${description}`,
      COLORS.header
    );
    console.log(`%cEndpoint:%c ${method} ${endpoint}`, COLORS.label, COLORS.info);
    if (body) {
      console.log(`%cBody:`, COLORS.label);
      console.log(formatJson(body));
    }
    console.groupEnd();
  },

  /**
   * Log the result of a side effect
   */
  sideEffectResult(
    phase: "onSubmit" | "onConfirmation",
    description: string,
    success: boolean,
    response?: unknown,
    error?: unknown
  ) {
    const icon = success ? "✅" : "❌";
    const style = success ? COLORS.success : COLORS.error;

    console.groupCollapsed(
      `%c${icon} SIDE EFFECT RESULT [${phase}]: ${description}`,
      style
    );
    if (success) {
      console.log(`%cResponse:`, COLORS.label);
      console.log(formatJson(response));
    } else {
      console.log(`%cError:`, COLORS.label);
      console.log(formatJson(error));
    }
    console.groupEnd();
  },

  /**
   * Log when a side effect is skipped
   */
  sideEffectSkipped(phase: "onSubmit" | "onConfirmation", description: string, reason: string) {
    console.log(
      `%c⏭️ SIDE EFFECT SKIPPED [${phase}]: %c${description} %c(${reason})`,
      COLORS.warning,
      COLORS.label,
      COLORS.muted
    );
  },

  /**
   * Log transaction submission success
   */
  txSubmitted(txType: string, txHash: string, explorerUrl?: string) {
    console.groupCollapsed(
      `%c🚀 TX SUBMITTED: ${txType}`,
      COLORS.success
    );
    console.log(`%cTx Hash:%c ${txHash}`, COLORS.label, COLORS.info);
    if (explorerUrl) {
      console.log(`%cExplorer:%c ${explorerUrl}`, COLORS.label, COLORS.muted);
    }
    console.groupEnd();
  },

  /**
   * Log transaction error
   */
  txError(txType: string, error: unknown) {
    console.groupCollapsed(
      `%c❌ TX FAILED: ${txType}`,
      COLORS.error
    );
    console.log(`%cError:`, COLORS.label);
    console.log(formatJson(error));
    console.groupEnd();
  },

  /**
   * Log a summary of all side effects
   */
  sideEffectsSummary(
    phase: "onSubmit" | "onConfirmation",
    total: number,
    succeeded: number,
    failed: number,
    skipped: number
  ) {
    const allSuccess = failed === 0;
    const style = allSuccess ? COLORS.success : COLORS.warning;
    const icon = allSuccess ? "✅" : "⚠️";

    console.log(
      `%c${icon} SIDE EFFECTS [${phase}]: %c${succeeded}/${total} succeeded, ${failed} failed, ${skipped} skipped`,
      style,
      COLORS.label
    );
  },
};
