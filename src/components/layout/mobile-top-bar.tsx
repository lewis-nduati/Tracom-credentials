"use client";

import React from "react";
import Link from "next/link";
import { MobileNav } from "./mobile-nav";

/** Slim paper bar for phones: menu button and wordmark. Hidden from md up. */
export function MobileTopBar() {
  return (
    <div className="flex h-12 items-center gap-2 border-b border-border bg-background px-2 md:hidden">
      <MobileNav />
      <Link href="/" className="font-serif text-lg font-medium text-primary">
        Tracom
      </Link>
    </div>
  );
}
