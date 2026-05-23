"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AddIcon, CloseIcon, LoadingIcon, ErrorIcon, SuccessIcon } from "~/components/icons";

export interface AliasListInputProps {
  /** Current list of validated aliases */
  value: string[];
  /** Callback when the alias list changes */
  onChange: (aliases: string[]) => void;
  /** Label text for the input */
  label: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Aliases to exclude (e.g. current user, already in list from another source) */
  excludeAliases?: string[];
  /** Context-aware message for excluded aliases. Returns a message string or null if not excluded. Takes priority over the default excludeAliases message. */
  getExcludeReason?: (alias: string) => string | null;
  /** Helper text shown below the input */
  helperText?: string;
  /** Hide the inline badge list (when parent manages its own display) */
  hideBadges?: boolean;
  /** Called when validation starts or ends — use to disable parent save buttons */
  onValidatingChange?: (isValidating: boolean) => void;
}

export function AliasListInput({
  value,
  onChange,
  label,
  placeholder = "Enter alias",
  disabled = false,
  excludeAliases = [],
  getExcludeReason,
  helperText,
  hideBadges = false,
  onValidatingChange,
}: AliasListInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [lastVerified, setLastVerified] = useState<string | null>(null);
  const verifiedTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (verifiedTimerRef.current) clearTimeout(verifiedTimerRef.current);
    };
  }, []);

  const addAlias = useCallback(async () => {
    const alias = inputValue.trim();
    setValidationError(null);
    setLastVerified(null);

    // Format check: 1-31 chars
    if (alias.length === 0) return;
    if (alias.length > 31) {
      setValidationError("Alias must be 31 characters or fewer");
      return;
    }

    // Duplicate check
    if (value.includes(alias)) {
      setValidationError(`"${alias}" is already queued to be added.`);
      return;
    }

    // Excluded alias check (context-aware if callback provided)
    if (getExcludeReason) {
      const reason = getExcludeReason(alias);
      if (reason) {
        setValidationError(reason);
        return;
      }
    } else if (excludeAliases.includes(alias)) {
      setValidationError("This alias is already included.");
      return;
    }

    // Existence check via gateway
    // API returns 200 with { exists: boolean } — check the body, not just status
    setIsValidating(true);
    onValidatingChange?.(true);
    try {
      const response = await fetch(`/api/gateway/api/v2/user/exists/${encodeURIComponent(alias)}`);
      if (response.ok) {
        const data = (await response.json()) as { exists?: boolean };
        if (data.exists) {
          onChange([...value, alias]);
          setInputValue("");
          setLastVerified(alias);
          if (verifiedTimerRef.current) clearTimeout(verifiedTimerRef.current);
          verifiedTimerRef.current = setTimeout(() => setLastVerified(null), 3000);
        } else {
          setValidationError(`"${alias}" was not found. Make sure the alias has an Access Token on-chain.`);
        }
      } else {
        setValidationError("Failed to verify alias. Please try again.");
      }
    } catch {
      setValidationError("Failed to verify alias. Please try again.");
    } finally {
      setIsValidating(false);
      onValidatingChange?.(false);
    }
  }, [inputValue, value, excludeAliases, getExcludeReason, onChange, onValidatingChange]);

  const removeAlias = useCallback(
    (alias: string) => {
      onChange(value.filter((a) => a !== alias));
    },
    [value, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void addAlias();
    }
  };

  return (
    <div className="space-y-2">
      <AndamioLabel>{label}</AndamioLabel>

      {/* Badge list of validated aliases */}
      {value.length > 0 && !hideBadges && (
        <div className="flex flex-wrap gap-2">
          {value.map((alias) => (
            <AndamioBadge key={alias} variant="secondary" className="gap-1 pr-1 font-mono text-xs">
              <SuccessIcon className="h-3 w-3 text-primary shrink-0" />
              {alias}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeAlias(alias)}
                  className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  aria-label={`Remove ${alias}`}
                >
                  <CloseIcon className="h-3 w-3" />
                </button>
              )}
            </AndamioBadge>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2">
        <AndamioInput
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setValidationError(null);
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled || isValidating}
          maxLength={31}
          className="flex-1"
        />
        <AndamioButton
          type="button"
          variant="outline"
          onClick={() => void addAlias()}
          disabled={disabled || isValidating || inputValue.trim().length === 0}
          aria-label="Add alias"
          className="h-9 w-9 shrink-0 p-0"
        >
          {isValidating ? (
            <LoadingIcon className="h-4 w-4 animate-spin" />
          ) : (
            <AddIcon className="h-4 w-4" />
          )}
        </AndamioButton>
      </div>

      {/* Validation success */}
      {lastVerified && (
        <div className="flex items-center gap-1.5">
          <SuccessIcon className="h-3.5 w-3.5 shrink-0 text-primary" />
          <AndamioText variant="small" className="text-xs text-primary">
            &ldquo;{lastVerified}&rdquo; added
          </AndamioText>
        </div>
      )}

      {/* Validation error */}
      {validationError && (
        <div className="flex items-center gap-1.5">
          <ErrorIcon className="h-3.5 w-3.5 shrink-0 text-destructive" />
          <AndamioText variant="small" className="text-xs text-destructive">
            {validationError}
          </AndamioText>
        </div>
      )}

      {/* Helper text */}
      {helperText && !validationError && !lastVerified && (
        <AndamioText variant="small" className="text-xs">
          {helperText}
        </AndamioText>
      )}
    </div>
  );
}
