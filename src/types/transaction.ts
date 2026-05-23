/**
 * Transaction Types
 *
 * Type definitions for Cardano transactions in the Andamio platform.
 * These types will be extracted to @andamio/transactions package.
 */

/**
 * Transaction state machine states
 */
export type TransactionState =
  | "idle"        // Not started
  | "fetching"    // Fetching unsigned CBOR from Andamioscan
  | "signing"     // Waiting for user to sign with wallet
  | "submitting"  // Submitting signed tx to blockchain
  | "confirming"  // Waiting for blockchain confirmation
  | "success"     // Transaction confirmed on-chain
  | "error";      // Transaction failed

/**
 * Transaction result containing tx hash and status
 */
export interface TransactionResult {
  txHash?: string;
  success: boolean;
  error?: string;
  blockchainExplorerUrl?: string;
  /** Full response from the transaction API (includes courseId, etc.) */
  apiResponse?: Record<string, unknown>;
}

/**
 * API backend options for transaction building
 * V2: Uses unified "gateway" backend for all services
 */
export type TxApiBackend = "gateway";

/**
 * Configuration for a transaction
 */
export interface TransactionConfig<TParams = unknown> {
  /**
   * API endpoint for fetching unsigned CBOR
   * Example: "/tx/v2/general/mint-access-token"
   */
  endpoint: string;

  /**
   * Parameters to send to the API endpoint
   */
  params: TParams;

  /**
   * HTTP method to use for the API request
   * - GET: Parameters sent as query string
   * - POST: Parameters sent as JSON body
   * @default "POST"
   */
  method?: "GET" | "POST";

  /**
   * API backend to use for transaction building
   * Uses the unified gateway for all services
   * @default "gateway"
   */
  apiBackend?: TxApiBackend;

  /**
   * Transaction type for logging purposes
   * Example: "MINT_ACCESS_TOKEN"
   */
  txType?: string;

  /**
   * Optional callback fired when transaction succeeds
   */
  onSuccess?: (result: TransactionResult) => void | Promise<void>;

  /**
   * Optional callback fired when transaction fails
   */
  onError?: (error: Error) => void;

  /**
   * Optional callback fired on any state change
   */
  onStateChange?: (state: TransactionState) => void;

  /**
   * Enable partial signing for multi-sig transactions.
   * When true, calls wallet.signTx(cbor, true) to indicate
   * that additional signatures may be required.
   * @default false
   */
  partialSign?: boolean;
}

/**
 * Response from transaction API endpoint
 * V2 API uses unsigned_tx, legacy uses unsignedTxCBOR
 */
export interface UnsignedTxResponse {
  /** V2 API format - unsigned transaction CBOR hex string */
  unsigned_tx?: string;
  /** Legacy format - unsigned transaction CBOR hex string */
  unsignedTxCBOR?: string;
  /** Transaction hash (optional, some endpoints return this) */
  txHash?: string;
  /** Course ID returned by INSTANCE_COURSE_CREATE */
  course_id?: string;
  /** Project ID returned by INSTANCE_PROJECT_CREATE */
  project_id?: string;
}

/**
 * Mint Access Token transaction parameters
 * For POST /tx/v2/general/mint-access-token endpoint
 */
export interface MintAccessTokenParams {
  /** User's wallet address in bech32 format */
  walletData: string;
  /** Desired alias for the access token */
  alias: string;
}

/**
 * Submit Assignment transaction parameters
 */
export interface SubmitAssignmentParams {
  courseId: string;
  moduleCode: string;
  walletAddress: string;
  accessTokenAlias: string;
  submissionInfo: string;
}

/**
 * Wallet data structure for v2 transactions
 */
export interface WalletData {
  usedAddresses: string[];
  changeAddress: string;
}

/**
 * Create Course transaction parameters
 * For POST /tx/v2/admin/course/create endpoint
 */
export interface CreateCourseParams {
  walletData: WalletData;
  alias: string;
  teachers: string[];
}
