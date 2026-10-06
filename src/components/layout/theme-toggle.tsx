"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { DarkModeIcon, LightModeIcon } from "~/components/icons";

/** Light/dark switch for the sidebar spine. Renders nothing until mounted. */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex min-h-11 w-full items-center gap-2 rounded-sm px-2 text-xs text-sidebar-foreground/70 outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring"
    >
      {isDark ? <LightModeIcon className="h-3.5 w-3.5" /> : <DarkModeIcon className="h-3.5 w-3.5" />}
      {isDark ? "Light mode" : "Dark mode"}
    </button>
  );
}
