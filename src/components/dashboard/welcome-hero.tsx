"use client";

import Link from "next/link";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { CourseIcon, ForwardIcon, VerifiedIcon } from "~/components/icons";

interface WelcomeHeroProps {
  accessTokenAlias: string;
}

export function WelcomeHero({ accessTokenAlias }: WelcomeHeroProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <AndamioText variant="overline" className="text-muted-foreground">
          Welcome back
        </AndamioText>
        <div className="flex items-center gap-2">
          <AndamioHeading level={1} size="2xl">
            {accessTokenAlias}
          </AndamioHeading>
          <VerifiedIcon className="h-5 w-5 shrink-0 text-success" />
        </div>
      </div>
      <Link href="/course" className="shrink-0">
        <AndamioButton className="gap-2">
          <CourseIcon className="h-4 w-4" />
          Browse Courses
          <ForwardIcon className="h-4 w-4" />
        </AndamioButton>
      </Link>
    </div>
  );
}
