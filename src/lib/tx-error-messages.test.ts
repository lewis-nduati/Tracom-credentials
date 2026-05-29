/**
 * Tests for the transaction error message parser.
 *
 * These messages are what users see when an on-chain transaction fails, so the
 * mapping from raw gateway errors to readable text needs to be reliable.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  isTxError,
  isCollateralError,
  parseTxErrorMessage,
  TX_ERROR_MAP,
} from "./tx-error-messages";

describe("isTxError", () => {
  it("matches a known error code substring", () => {
    assert.equal(isTxError("error: INSUFFICIENT_FUNDS at submit"), true);
    assert.equal(isTxError("Transaction API error: 500"), true);
  });

  it("returns false for unrelated messages", () => {
    assert.equal(isTxError("user closed the wallet popup"), false);
  });
});

describe("isCollateralError", () => {
  it("matches collateral phrasing", () => {
    assert.equal(isCollateralError("No suitable collateral UTxO found"), true);
    assert.equal(isCollateralError("insufficient collateral"), true);
    assert.equal(isCollateralError("collateral not found"), true);
  });

  it("is case-insensitive", () => {
    assert.equal(isCollateralError("NO SUITABLE COLLATERAL"), true);
  });

  it("requires both 'collateral' and a qualifying phrase", () => {
    assert.equal(isCollateralError("collateral is fine"), false);
    assert.equal(isCollateralError("insufficient funds"), false);
  });
});

describe("parseTxErrorMessage", () => {
  it("returns null for empty input", () => {
    assert.equal(parseTxErrorMessage(null), null);
    assert.equal(parseTxErrorMessage(undefined), null);
    assert.equal(parseTxErrorMessage(""), null);
  });

  it("extracts the message from an ErrorEnvelope JSON shape", () => {
    const raw = JSON.stringify({
      error: { code: "SCRIPT_FAILURE", message: "Script execution failed at step 3" },
    });
    assert.equal(parseTxErrorMessage(raw), "Script execution failed at step 3");
  });

  it("extracts the message from a flat JSON shape", () => {
    const raw = JSON.stringify({ message: "Something specific went wrong" });
    assert.equal(parseTxErrorMessage(raw), "Something specific went wrong");
  });

  it("unwraps a nested message inside details", () => {
    const raw = JSON.stringify({
      details: JSON.stringify({ message: "Nested gateway detail" }),
    });
    assert.equal(parseTxErrorMessage(raw), "Nested gateway detail");
  });

  it("maps an extracted collateral message to the friendly collateral copy", () => {
    const raw = JSON.stringify({
      error: { message: "No suitable collateral UTxO found in wallet" },
    });
    assert.equal(parseTxErrorMessage(raw), TX_ERROR_MAP.INSUFFICIENT_COLLATERAL);
  });

  it("maps a raw (non-JSON) collateral string to the friendly collateral copy", () => {
    const raw = "422 - No suitable collateral UTxO found";
    assert.equal(parseTxErrorMessage(raw), TX_ERROR_MAP.INSUFFICIENT_COLLATERAL);
  });

  it("falls back to TX_ERROR_MAP when a known code appears in a raw string", () => {
    assert.equal(
      parseTxErrorMessage("gateway said INSUFFICIENT_FUNDS"),
      TX_ERROR_MAP.INSUFFICIENT_FUNDS,
    );
  });

  it("returns the original string when nothing matches", () => {
    assert.equal(parseTxErrorMessage("plain unmatched message"), "plain unmatched message");
  });

  it("does not throw on malformed JSON and falls back to the raw string", () => {
    const raw = "{ this is not valid json";
    assert.equal(parseTxErrorMessage(raw), raw);
  });
});
