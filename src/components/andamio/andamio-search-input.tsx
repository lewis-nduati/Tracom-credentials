"use client";

import * as React from "react";
import { cn } from "~/lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "~/components/ui/input-group";
import { SearchIcon } from "~/components/icons";

export interface AndamioSearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /**
   * Size variant for the search input
   * - "default": Standard height (h-9), normal text
   * - "sm": Compact height (h-8), smaller text
   */
  inputSize?: "default" | "sm";
}

/**
 * AndamioSearchInput - Search input with integrated search icon
 *
 * Built on shadcn InputGroup for proper icon alignment and focus handling.
 *
 * Usage:
 * ```tsx
 * <AndamioSearchInput
 *   placeholder="Search courses..."
 *   value={searchQuery}
 *   onChange={(e) => setSearchQuery(e.target.value)}
 * />
 *
 * // Compact variant for toolbars
 * <AndamioSearchInput
 *   inputSize="sm"
 *   placeholder="Search..."
 *   value={query}
 *   onChange={handleChange}
 * />
 * ```
 */
const AndamioSearchInput = React.forwardRef<HTMLInputElement, AndamioSearchInputProps>(
  ({ className, inputSize = "default", ...props }, ref) => {
    const isSmall = inputSize === "sm";

    return (
      <InputGroup className={cn("rounded-lg", isSmall && "h-8", className)}>
        <InputGroupAddon align="inline-start">
          <SearchIcon className={isSmall ? "size-3.5" : "size-4"} />
        </InputGroupAddon>
        <InputGroupInput
          ref={ref}
          type="text"
          className={cn(isSmall && "text-xs")}
          {...props}
        />
      </InputGroup>
    );
  }
);
AndamioSearchInput.displayName = "AndamioSearchInput";

export { AndamioSearchInput };
