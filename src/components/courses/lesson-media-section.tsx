"use client";

import React from "react";
import Image from "next/image";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardHeader,
} from "~/components/andamio/andamio-card";
import { AndamioSectionHeader } from "~/components/andamio";

export interface LessonMediaSectionProps {
  /** Video URL (YouTube embed, etc.) */
  videoUrl?: string | null;
  /** Image URL */
  imageUrl?: string | null;
  /** Alt text for image */
  imageAlt?: string;
}

/**
 * LessonMediaSection - Displays video and/or image media for a lesson
 *
 * Renders video embed and/or image in card containers with proper
 * aspect ratios and responsive sizing.
 */
export function LessonMediaSection({
  videoUrl,
  imageUrl,
  imageAlt = "Lesson image",
}: LessonMediaSectionProps) {
  if (!videoUrl && !imageUrl) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Video */}
      {videoUrl && (
        <AndamioCard>
          <AndamioCardHeader>
            <AndamioSectionHeader title="Video" />
          </AndamioCardHeader>
          <AndamioCardContent>
            <div className="aspect-video w-full">
              <iframe
                src={videoUrl}
                className="w-full h-full rounded-md"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* Image */}
      {imageUrl && (
        <AndamioCard>
          <AndamioCardHeader>
            <AndamioSectionHeader title="Image" />
          </AndamioCardHeader>
          <AndamioCardContent>
            <div className="relative w-full aspect-video">
              <Image
                src={imageUrl}
                alt={imageAlt}
                fill
                className="object-cover rounded-md"
              />
            </div>
          </AndamioCardContent>
        </AndamioCard>
      )}
    </div>
  );
}
