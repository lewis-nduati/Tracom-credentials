"use client";

import Link from "next/link";
import { ExploreIcon, CourseIcon, ProjectIcon, ForwardIcon } from "~/components/icons";
import { AndamioButton } from "~/components/andamio/andamio-button";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { MARKETING } from "~/config/marketing";

/**
 * Landing page card for exploring courses and projects without authentication.
 */
export function ExploreCard() {
  const copy = MARKETING.landingCards.explore;

  return (
    <AndamioCard className="flex flex-col">
      <AndamioCardHeader>
        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <ExploreIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        <AndamioCardTitle>{copy.title}</AndamioCardTitle>
        <AndamioCardDescription>{copy.description}</AndamioCardDescription>
      </AndamioCardHeader>
      <AndamioCardContent className="mt-auto space-y-3">
        <AndamioButton asChild variant="outline" className="w-full">
          <Link href="/course">
            <CourseIcon className="h-4 w-4" />
            <span>Browse Courses</span>
            <ForwardIcon className="ml-auto h-4 w-4" />
          </Link>
        </AndamioButton>
        <AndamioButton asChild variant="outline" className="w-full">
          <Link href="/project">
            <ProjectIcon className="h-4 w-4" />
            <span>Browse Projects</span>
            <ForwardIcon className="ml-auto h-4 w-4" />
          </Link>
        </AndamioButton>
      </AndamioCardContent>
    </AndamioCard>
  );
}
