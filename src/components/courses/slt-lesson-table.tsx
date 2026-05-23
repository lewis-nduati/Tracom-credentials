"use client";

import Link from "next/link";
import { CourseIcon, SuccessIcon, NextIcon } from "~/components/icons";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioEmptyState } from "~/components/andamio";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { type CourseModule } from "~/hooks/api";

/**
 * Combined SLT + Lesson data type
 */
export type CombinedSLTLesson = {
  module_index: number;
  slt_text: string;
  slt_id: string;
  lesson?: {
    title: string | null;
    description: string | null;
    image_url: string | null;
    video_url: string | null;
  };
};

export interface SLTLessonTableProps {
  /** Combined SLT and lesson data */
  data: CombinedSLTLesson[];
  /** Course NFT policy ID for links */
  courseId: string;
  /** Module code for links */
  moduleCode: string;
  /** On-chain module data for verification badges (flattened format) */
  onChainModule?: CourseModule | null;
}

/**
 * SLTAccordion - Displays learning targets as expandable accordion items
 *
 * SLTs are the primary hierarchy. Expanding an SLT reveals its lesson
 * (if one exists) as a compact card with title, description, media badges,
 * and "Open Lesson" link. SLTs without lessons show a muted message.
 */
export function SLTLessonTable({
  data,
  courseId,
  moduleCode,
  onChainModule,
}: SLTLessonTableProps) {
  const onChainSltTexts = new Set(onChainModule?.onChainSlts ?? []);

  if (data.length === 0) {
    return (
      <AndamioEmptyState
        icon={CourseIcon}
        title="No learning targets defined for this module"
        className="border rounded-md"
      />
    );
  }

  return (
    <Accordion type="multiple">
      {data.map((item) => {
        const isOnChain = onChainSltTexts.has(item.slt_text);
        const hasLesson = !!item.lesson;

        return (
          <AccordionItem key={item.slt_id} value={item.slt_id}>
            <AccordionTrigger className="gap-3 hover:no-underline">
              <div className="flex items-center gap-3 text-left">
                <AndamioBadge variant="outline" className="font-mono text-xs shrink-0">
                  {item.module_index}
                </AndamioBadge>
                {isOnChain && (
                  <span title="Verified on-chain">
                    <SuccessIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                  </span>
                )}
                <span className="font-medium">{item.slt_text}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {hasLesson ? (
                <div className="rounded-lg border bg-muted/30 p-4 ml-8">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 space-y-1">
                      <AndamioText className="font-medium">
                        {item.lesson!.title ?? `Lesson ${item.module_index}`}
                      </AndamioText>
                      {item.lesson!.description && (
                        <AndamioText variant="small" className="line-clamp-2">
                          {item.lesson!.description}
                        </AndamioText>
                      )}
                      {(item.lesson!.image_url || item.lesson!.video_url) && (
                        <div className="flex gap-1 pt-1">
                          {item.lesson!.image_url && (
                            <AndamioBadge variant="outline" className="text-xs">Image</AndamioBadge>
                          )}
                          {item.lesson!.video_url && (
                            <AndamioBadge variant="outline" className="text-xs">Video</AndamioBadge>
                          )}
                        </div>
                      )}
                    </div>
                    <Link href={`/course/${courseId}/${moduleCode}/${item.module_index}`}>
                      <AndamioButton variant="outline" size="sm" rightIcon={<NextIcon className="h-3.5 w-3.5" />}>
                        Open Lesson
                      </AndamioButton>
                    </Link>
                  </div>
                </div>
              ) : (
                <AndamioText variant="muted" className="ml-8 text-sm italic">
                  No lesson available for this learning target
                </AndamioText>
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
