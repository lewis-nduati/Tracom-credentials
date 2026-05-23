"use client";

import React from "react";
import Link from "next/link";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioButton } from "~/components/andamio/andamio-button";
import type { IconComponent } from "~/types/ui";

interface StudioHubCardProps {
  title: string;
  description: string;
  href: string;
  icon: IconComponent;
  buttonLabel: string;
}

/**
 * Card component for the Studio hub page
 * Provides consistent styling for navigation cards with hover effects
 */
export function StudioHubCard({
  title,
  description,
  href,
  icon: Icon,
  buttonLabel,
}: StudioHubCardProps) {
  return (
    <Link href={href}>
      <AndamioCard className="hover:bg-accent transition-colors cursor-pointer h-full">
        <AndamioCardHeader>
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            <AndamioCardTitle>{title}</AndamioCardTitle>
          </div>
          <AndamioCardDescription>{description}</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <AndamioButton variant="outline" className="w-full">
            {buttonLabel}
          </AndamioButton>
        </AndamioCardContent>
      </AndamioCard>
    </Link>
  );
}
