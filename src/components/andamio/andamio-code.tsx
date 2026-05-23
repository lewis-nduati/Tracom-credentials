import * as React from "react";
import { cn } from "~/lib/utils";

export interface AndamioCodeProps extends React.HTMLAttributes<HTMLPreElement> {
  /**
   * The data to display as JSON. If provided, it will be stringified with formatting.
   * Otherwise, children will be rendered directly.
   */
  data?: unknown;
  /**
   * Number of spaces for JSON indentation (default: 2)
   */
  indent?: number;
}

/**
 * AndamioCode - Component for displaying formatted JSON or code blocks
 *
 * Displays raw data in a monospace font with proper formatting.
 * Designed for showing API responses, debug info, or code snippets.
 *
 * @example
 * ```tsx
 * // Display JSON data
 * <AndamioCode data={myObject} />
 *
 * // Display raw code
 * <AndamioCode>
 *   const foo = "bar";
 * </AndamioCode>
 * ```
 */
export const AndamioCode = React.forwardRef<HTMLPreElement, AndamioCodeProps>(
  ({ className, data, indent = 2, children, ...props }, ref) => {
    // When data is provided, stringify it; otherwise use children
    const content = data !== undefined
      ? JSON.stringify(data, null, indent)
      : (children as string);

    return (
      <div className="overflow-x-auto">
        <pre
          ref={ref}
          className={cn(
            "rounded-md bg-muted p-4 font-light font-mono",
            className
          )}
          style={{ fontSize: '0.75rem' }}
          {...props}
        >
          {content}
        </pre>
      </div>
    );
  }
);

AndamioCode.displayName = "AndamioCode";
