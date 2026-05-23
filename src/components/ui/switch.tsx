"use client"

import * as React from "react"
import * as SwitchPrimitive from "@radix-ui/react-switch"

import { cn } from "~/lib/utils"

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        // Base styles
        "peer inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border shadow-sm transition-colors duration-150 outline-none",
        // Unchecked state - visible border
        "data-[state=unchecked]:bg-muted data-[state=unchecked]:border-border",
        // Checked state
        "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
        // Focus state
        "focus-visible:ring-2 focus-visible:ring-primary/20",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-4 rounded-full ring-0 shadow-sm transition-transform",
          // Colors
          "bg-background dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground",
          // Position
          "data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
