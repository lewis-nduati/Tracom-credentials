"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useRegisterCourse, useInvalidateOwnerCourses } from "~/hooks/api/course/use-course-owner";
import { useInvalidateTeacherCourses } from "~/hooks/api/course/use-course-teacher";
import {
  AndamioButton,
  AndamioInput,
  AndamioLabel,
  AndamioTextarea,
  AndamioCard,
  AndamioCardContent,
  AndamioScrollArea,
} from "~/components/andamio";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { AndamioText } from "~/components/andamio/andamio-text";
import { CopyId } from "~/components/andamio/copy-id";
import {
  OnChainIcon,
  CourseIcon,
  AlertIcon,
  LoadingIcon,
  ExternalLinkIcon,
} from "~/components/icons";
import { toast } from "sonner";

interface RegisterCourseProps {
  courseId: string;
  /** On-chain owner alias (if available) */
  owner?: string;
}

/**
 * RegisterCourse - Register an on-chain course with the database
 *
 * Shown when a course exists on-chain but has no database entry.
 * Allows the owner to add metadata (title, description) to make
 * the course fully functional in the app.
 */
export function RegisterCourse({ courseId, owner }: RegisterCourseProps) {
  const router = useRouter();
  const registerCourse = useRegisterCourse();
  const invalidateOwnerCourses = useInvalidateOwnerCourses();
  const invalidateTeacherCourses = useInvalidateTeacherCourses();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const handleRegister = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      await registerCourse.mutateAsync({
        courseId,
        title: title.trim(),
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        isPublic,
      });

      // Invalidate caches
      await invalidateOwnerCourses();
      await invalidateTeacherCourses();

      toast.success("Course registered!", {
        description: `"${title}" is now ready to use`,
      });

      // Refresh the page to show the full course editor
      router.refresh();
    } catch (err) {
      console.error("[RegisterCourse] Error:", err);
      toast.error("Registration failed", {
        description: err instanceof Error ? err.message : "Please try again",
      });
    }
  };

  return (
    <AndamioScrollArea className="h-full">
      <div className="min-h-full bg-background">
        <div className="max-w-2xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-secondary/10 mx-auto mb-4">
              <OnChainIcon className="h-5 w-5 text-secondary" />
            </div>
            <AndamioHeading level={1} size="3xl" className="mb-2">
              Register Course
            </AndamioHeading>
            <AndamioText variant="muted" className="max-w-md mx-auto">
              This course exists on-chain but hasn&apos;t been registered yet.
              Add details to start building content.
            </AndamioText>
          </div>

          {/* On-Chain Info */}
          <AndamioCard className="mb-6 border-secondary/30 bg-secondary/5">
            <AndamioCardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertIcon className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <AndamioText className="font-medium mb-2">
                    On-Chain Course Detected
                  </AndamioText>
                  <div className="space-y-2">
                    <CopyId id={courseId} label="Policy ID" />
                    {owner && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Owner:</span>
                        <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                          {owner}
                        </code>
                      </div>
                    )}
                  </div>
                  <AndamioButton
                    variant="link"
                    size="sm"
                    className="px-0 h-auto mt-2"
                    asChild
                  >
                    <a
                      href={`https://preprod.cardanoscan.io/tokenPolicy/${courseId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLinkIcon className="h-3 w-3 mr-1" />
                      View on CardanoScan
                    </a>
                  </AndamioButton>
                </div>
              </div>
            </AndamioCardContent>
          </AndamioCard>

          {/* Registration Form */}
          <AndamioCard>
            <AndamioCardContent className="py-6 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <CourseIcon className="h-5 w-5 text-primary" />
                <AndamioHeading level={2} size="lg">
                  Course Details
                </AndamioHeading>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <AndamioLabel htmlFor="title">
                  Title <span className="text-destructive">*</span>
                </AndamioLabel>
                <AndamioInput
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Introduction to Cardano Development"
                  maxLength={200}
                />
                <AndamioText variant="small">
                  The display name shown to learners
                </AndamioText>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <AndamioLabel htmlFor="description">Description</AndamioLabel>
                <AndamioTextarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A comprehensive introduction to building on Cardano..."
                  rows={4}
                />
              </div>

              {/* Image URL */}
              <div className="space-y-2">
                <AndamioLabel htmlFor="imageUrl">Cover Image URL</AndamioLabel>
                <AndamioInput
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              {/* Visibility */}
              <div className="flex items-center justify-between py-2 border-t">
                <div>
                  <AndamioLabel>Visibility</AndamioLabel>
                  <AndamioText variant="small">
                    {isPublic
                      ? "Anyone can find this course"
                      : "Only you and teachers can see this"}
                  </AndamioText>
                </div>
                <AndamioButton
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPublic(!isPublic)}
                >
                  {isPublic ? "Public" : "Private"}
                </AndamioButton>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <AndamioButton
                  onClick={handleRegister}
                  disabled={!title.trim() || registerCourse.isPending}
                  className="flex-1"
                >
                  {registerCourse.isPending ? (
                    <>
                      <LoadingIcon className="h-4 w-4 mr-2 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <CourseIcon className="h-4 w-4 mr-2" />
                      Register Course
                    </>
                  )}
                </AndamioButton>
              </div>
            </AndamioCardContent>
          </AndamioCard>
        </div>
      </div>
    </AndamioScrollArea>
  );
}
