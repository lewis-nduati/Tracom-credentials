"use client";

import Link from "next/link";
import Image from "next/image";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { CourseIcon, ForwardIcon, VerifiedIcon } from "~/components/icons";
import { useDashboardData } from "~/contexts/dashboard-context";

const BADGE_BASE =
  "https://raw.githubusercontent.com/Andamio-Platform/credential-badges/main/badges";
const PLACEHOLDER_BADGE = `${BADGE_BASE}/_placeholder.svg`;

interface WelcomeHeroProps {
  accessTokenAlias: string;
}

export function WelcomeHero({ accessTokenAlias }: WelcomeHeroProps) {
  const { student, isLoading } = useDashboardData();

  // Flatten all earned credential badges: [{courseId, sltHash, courseTitle}]
  const badges =
    student?.credentialsByCourse.flatMap((entry) =>
      entry.credentials.map((sltHash) => ({
        courseId: entry.courseId,
        courseTitle: entry.courseTitle,
        sltHash,
        src: `${BADGE_BASE}/${entry.courseId}.${sltHash}.svg`,
      })),
    ) ?? [];

  return (
    <div className="space-y-6">
      {/* Identity row */}
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

      {/* Credential badges */}
      {!isLoading && (
        <CredentialBadgeRow badges={badges} />
      )}
    </div>
  );
}

// =============================================================================
// Badge row
// =============================================================================

interface BadgeEntry {
  courseId: string;
  courseTitle: string;
  sltHash: string;
  src: string;
}

interface CredentialBadgeRowProps {
  badges: BadgeEntry[];
}

function CredentialBadgeRow({ badges }: CredentialBadgeRowProps) {
  if (badges.length === 0) {
    return (
      <div className="flex items-center gap-4">
        <PlaceholderBadge />
        <AndamioText variant="small" className="text-muted-foreground">
          Complete a course to earn your first on-chain credential badge.
        </AndamioText>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-4">
      {badges.map((badge) => (
        <CredentialBadge key={`${badge.courseId}.${badge.sltHash}`} badge={badge} />
      ))}
    </div>
  );
}

// =============================================================================
// Individual badge
// =============================================================================

function CredentialBadge({ badge }: { badge: BadgeEntry }) {
  return (
    <Link
      href={`/course/${badge.courseId}`}
      className="group flex flex-col items-center gap-1.5"
      title={badge.courseTitle || badge.courseId}
    >
      <div className="relative h-20 w-20 overflow-hidden rounded-full ring-2 ring-border transition-all group-hover:ring-primary group-hover:scale-105">
        <Image
          src={badge.src}
          alt={`${badge.courseTitle || badge.courseId} credential badge`}
          fill
          className="object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_BADGE;
          }}
          unoptimized
        />
      </div>
      {badge.courseTitle && (
        <AndamioText
          variant="small"
          className="max-w-[80px] truncate text-center text-xs text-muted-foreground"
        >
          {badge.courseTitle}
        </AndamioText>
      )}
    </Link>
  );
}

// =============================================================================
// Empty state placeholder badge (inline SVG matching Andamio style)
// =============================================================================

function PlaceholderBadge() {
  return (
    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full opacity-40">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        role="img"
        aria-label="No credential earned yet"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id="ph-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1f2a44" />
            <stop offset="1" stopColor="#3b4d7a" />
          </linearGradient>
        </defs>
        <circle cx="256" cy="256" r="240" fill="url(#ph-g)" />
        <circle
          cx="256"
          cy="256"
          r="240"
          fill="none"
          stroke="#9fb3e0"
          strokeWidth="6"
        />
        <circle
          cx="256"
          cy="256"
          r="200"
          fill="none"
          stroke="#9fb3e0"
          strokeWidth="2"
          strokeDasharray="4 8"
        />
        <text
          x="256"
          y="270"
          textAnchor="middle"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="44"
          fill="#ffffff"
          fontWeight="bold"
          letterSpacing="2"
        >
          ?
        </text>
      </svg>
    </div>
  );
}
