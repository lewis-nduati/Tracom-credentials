"use client";

import React from "react";
import Link from "next/link";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioCard, AndamioCardContent } from "~/components/andamio/andamio-card";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { CourseIcon, ForwardIcon, AccessTokenIcon, VerifiedIcon } from "~/components/icons";

interface WelcomeHeroProps {
  accessTokenAlias: string;
}

export function WelcomeHero({ accessTokenAlias }: WelcomeHeroProps) {
  return (
    <AndamioCard className="overflow-hidden border-0">
      <AndamioCardContent className="p-0">
        {/* Main hero section */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/5" />

          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col gap-6">
              {/* Identity Section */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-1">
                  <AndamioText variant="small" className="font-medium">
                    Welcome back
                  </AndamioText>
                  <div className="flex items-center gap-3">
                    <AndamioHeading level={1} size="3xl" className="break-all xs:break-normal">
                      {accessTokenAlias}
                    </AndamioHeading>
                    <VerifiedIcon className="h-5 w-5 text-success" />
                  </div>
                </div>

                {/* Access Token Badge - hidden on small screens */}
                <div className="hidden sm:flex items-center gap-3 rounded-sm border border-primary/20 bg-primary/5 px-4 py-3 shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                    <AccessTokenIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <AndamioText variant="small" className="text-xs font-medium">
                      Access Token
                    </AndamioText>
                    <AndamioText className="text-lg font-bold truncate max-w-[150px] text-primary">
                      {accessTokenAlias}
                    </AndamioText>
                  </div>
                </div>
              </div>

              {/* Description */}
              <AndamioText variant="muted" className="max-w-2xl">
                Everything you learn and build is recorded on Cardano. Pick up where you left off.
              </AndamioText>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                <Link href="/course">
                  <AndamioButton size="lg" className="gap-2">
                    <CourseIcon className="h-4 w-4" />
                    Browse Courses
                    <ForwardIcon className="h-4 w-4" />
                  </AndamioButton>
                </Link>
                <Link href="/studio/course">
                  <AndamioButton variant="outline" size="lg">
                    Course Studio
                  </AndamioButton>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}
