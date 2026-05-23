"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useStudioHeader } from "~/components/layout/studio-header";
import { RequireCourseAccess } from "~/components/auth/require-course-access";
import { StudioFormSection } from "~/components/studio/studio-editor-pane";
import { StudioModuleCard } from "~/components/studio/studio-module-card";
import {
  AndamioButton,
  AndamioBadge,
  AndamioInput,
  AndamioLabel,
  AndamioTextarea,
  AndamioAlert,
  AndamioAlertTitle,
  AndamioAlertDescription,
  AndamioScrollArea,
  AndamioStudioLoading,
  AndamioSaveButton,
} from "~/components/andamio";
import {
  AlertIcon,
  AddIcon,
  SettingsIcon,
  CourseIcon,
  OnChainIcon,
  CloseIcon,
  DeleteIcon,
  PendingIcon,
  ExternalLinkIcon,
  ImagePlaceholderIcon,
  VideoIcon,
  CompletedIcon,
  PreviewIcon,
  SparkleIcon,
  NextIcon,
  SLTIcon,
  CredentialIcon,
  VerifiedIcon,
  TeacherIcon,
  OwnerIcon,
  NeutralIcon,
  LearnerIcon,
} from "~/components/icons";
import { AndamioTabs, AndamioTabsList, AndamioTabsTrigger, AndamioTabsContent } from "~/components/andamio/andamio-tabs";
import { AndamioConfirmDialog } from "~/components/andamio/andamio-confirm-dialog";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { CopyId } from "~/components/andamio/copy-id";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useCourse } from "~/hooks/api/course/use-course";
import { useUpdateCourse, useDeleteCourse } from "~/hooks/api/course/use-course-owner";
import { useTeacherCourseModules, useDeleteCourseModule, useRegisterCourseModule } from "~/hooks/api/course/use-course-module";
import { useTeacherCourses, useTeacherAssignmentCommitments } from "~/hooks/api/course/use-course-teacher";
import { TeachersUpdate } from "~/components/tx/teachers-update";
import { MintModuleTokens } from "~/components/tx/mint-module-tokens";
import { BurnModuleTokens, type ModuleToBurn } from "~/components/tx/burn-module-tokens";
import { AndamioCheckbox } from "~/components/andamio/andamio-checkbox";
import { cn } from "~/lib/utils";
import { RESOLVED_COMMITMENT_STATUSES } from "~/config/ui-constants";
import { toast } from "sonner";
import { RegisterCourse } from "~/components/studio/register-course";
// Note: computeSltHashDefinite removed - no longer needed with hook-based data

// =============================================================================
// Types - Using hook types directly (CourseModule, CourseModuleStatus)
// =============================================================================
// The useTeacherCourseModules hook returns merged data with status:
// - "active": On-chain + DB (synced)
// - "draft" / "approved" / "pending_tx": DB only
// - "unregistered": On-chain only (needs registration)

// =============================================================================
// Helper Components
// =============================================================================


const COMMITMENT_STATUS_LABELS: Record<string, string> = {
  LEFT: "Left",
  DRAFT: "Draft",
  AWAITING_SUBMISSION: "Awaiting Submission",
  SUBMITTED: "Submitted",
};

function CommitmentInfo({ studentAlias, moduleCode }: { studentAlias: string; moduleCode?: string | null }) {
  return (
    <div className="min-w-0">
      <span className="font-mono text-sm font-medium">{studentAlias}</span>
      {moduleCode && (
        <AndamioText variant="small" className="truncate">
          Module {moduleCode}
        </AndamioText>
      )}
    </div>
  );
}

function ViewAllLink({ href, count, label }: { href: string; count: number; label: string }) {
  if (count <= 3) return null;
  return (
    <AndamioButton variant="ghost" size="sm" asChild className="w-full">
      <Link href={href}>
        View all {count} {label}
      </Link>
    </AndamioButton>
  );
}

function ImagePreview({ url, alt }: { url: string; alt: string }) {
  const [error, setError] = useState(false);

  if (!url || error) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border border-dashed bg-muted/30">
        <ImagePlaceholderIcon className="h-6 w-6 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <div className="relative h-24 overflow-hidden rounded-lg border bg-muted/30">
      <Image
        src={url}
        alt={alt}
        fill
        className="object-cover"
        onError={() => setError(true)}
        unoptimized
      />
    </div>
  );
}

function VideoPreview({ url }: { url: string }) {
  const embedUrl = useMemo(() => {
    if (!url) return null;
    const ytRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/;
    const ytMatch = ytRegex.exec(url);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    const vimeoRegex = /vimeo\.com\/(\d+)/;
    const vimeoMatch = vimeoRegex.exec(url);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return null;
  }, [url]);

  if (!url) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border border-dashed bg-muted/30">
        <VideoIcon className="h-6 w-6 text-muted-foreground/50" />
      </div>
    );
  }

  if (!embedUrl) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border bg-muted/30">
        <div className="text-center">
          <VideoIcon className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
          <AndamioText variant="small" className="text-[10px]">Video URL set</AndamioText>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-24 overflow-hidden rounded-lg border bg-black">
      <iframe
        src={embedUrl}
        className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

function CourseEditorContent({ courseId }: { courseId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL-based tab persistence
  const urlTab = searchParams.get("tab");
  const validTabs = ["modules", "credentials", "teacher", "settings"];
  const activeTab = urlTab && validTabs.includes(urlTab) ? urlTab : "modules";

  // Update studio header
  const { setBreadcrumbs, setTitle, setActions } = useStudioHeader();

  // Auth - determine if current user is the course owner
  const { user } = useAndamioAuth();

  // React Query hooks - Database
  const { data: course, isLoading: isLoadingCourse, error: courseError, refetch: refetchCourse } = useCourse(courseId);
  const { data: modules = [], isLoading: isLoadingModules, refetch: refetchModules } = useTeacherCourseModules(courseId);
  const { data: teacherCourses = [] } = useTeacherCourses();

  // Get course from teacher courses list (has status info)
  const teacherCourse = useMemo(() => {
    return teacherCourses.find(c => c.courseId === courseId);
  }, [teacherCourses, courseId]);

  // Check if course is unregistered (on-chain only, no DB data)
  const isUnregistered = teacherCourse?.status === "onchain_only";

  // Get course title - prefer teacher courses list (has DB title) over course detail
  const courseTitle = useMemo(() => {
    return teacherCourse?.title || course?.title || "Untitled Course";
  }, [teacherCourse?.title, course?.title]);

  // Owner check - compare current user alias to course owner
  const isOwner = Boolean(user?.accessTokenAlias && course?.owner && user.accessTokenAlias === course.owner);
  const teachers = course?.teachers ?? [];

  // Fetch assignment commitments for this course, split into categories
  const { data: allCommitmentsForCourse = [] } = useTeacherAssignmentCommitments(courseId);
  const pendingCommitmentsForCourse = useMemo(
    () => allCommitmentsForCourse.filter((c) => c.commitmentStatus === "PENDING_APPROVAL"),
    [allCommitmentsForCourse]
  );
  const inProgressCommitments = useMemo(
    () => allCommitmentsForCourse.filter((c) =>
      c.commitmentStatus !== "PENDING_APPROVAL" && !(RESOLVED_COMMITMENT_STATUSES as readonly string[]).includes(c.commitmentStatus ?? "")
    ),
    [allCommitmentsForCourse]
  );
  const resolvedCommitments = useMemo(
    () => allCommitmentsForCourse.filter((c) => (RESOLVED_COMMITMENT_STATUSES as readonly string[]).includes(c.commitmentStatus ?? "")),
    [allCommitmentsForCourse]
  );
  const uniqueLearnerCount = useMemo(
    () => new Set(allCommitmentsForCourse.filter(c => c.commitmentStatus !== "LEFT").map(c => c.studentAlias)).size,
    [allCommitmentsForCourse]
  );

  // =============================================================================
  // Module Stats - All derived from hook data (useTeacherCourseModules)
  // =============================================================================
  // The hook returns merged data where status indicates lifecycle:
  // - "active": On-chain + DB (synced, verified)
  // - "approved": DB only, ready to mint
  // - "draft": DB only, still editing
  // - "pending_tx": TX submitted, awaiting confirmation
  // - "unregistered": On-chain only, needs DB registration

  // Modules by status (for UI filtering)
  const activeModules = useMemo(() =>
    modules.filter((m) => m.status === "active"),
    [modules]
  );

  const modulesReadyToMint = useMemo(() =>
    modules.filter((m) => m.status === "approved"),
    [modules]
  );

  const draftModules = useMemo(() =>
    modules.filter((m) => m.status === "draft"),
    [modules]
  );

  const pendingModules = useMemo(() =>
    modules.filter((m) => m.status === "pending_tx"),
    [modules]
  );

  // Module stats for display
  const moduleStats = useMemo(() => ({
    total: modules.length,
    active: activeModules.length,
    approved: modulesReadyToMint.length,
    draft: draftModules.length,
    pending: pendingModules.length,
    unregistered: modules.filter((m) => m.status === "unregistered").length,
    readyToMint: modulesReadyToMint.length,
  }), [modules, activeModules, modulesReadyToMint, draftModules, pendingModules]);

  // Unregistered modules (on-chain only, need DB registration)
  // Use hook data directly instead of hybridModules for consistency
  const unregisteredModules = useMemo(() =>
    modules.filter((m) => m.status === "unregistered"),
    [modules]
  );

  // Mutations
  const updateCourseMutation = useUpdateCourse();
  const deleteCourseMutation = useDeleteCourse();
  const deleteModuleMutation = useDeleteCourseModule();
  const registerModuleMutation = useRegisterCourseModule();

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formInitialized, setFormInitialized] = useState(false);

  // Burn selection state - stores on-chain hashes of selected modules
  const [selectedForBurn, setSelectedForBurn] = useState<Set<string>>(new Set());

  // Registration state for unregistered modules
  const [registeringHash, setRegisteringHash] = useState<string | null>(null);
  const [registerModuleCode, setRegisterModuleCode] = useState("");

  // Get modules selected for burn with full details
  // Active modules are on-chain, use sltHash as the on-chain identifier
  const modulesToBurn = useMemo<ModuleToBurn[]>(() => {
    return activeModules
      .filter((m) => m.sltHash && selectedForBurn.has(m.sltHash))
      .map((m) => ({
        moduleCode: m.moduleCode ?? "",
        title: m.title ?? null,
        onChainHash: m.sltHash,
        sltCount: m.onChainSlts?.length ?? 0,
      }));
  }, [activeModules, selectedForBurn]);

  // Toggle selection for a module
  const toggleBurnSelection = (onChainHash: string) => {
    setSelectedForBurn((prev) => {
      const next = new Set(prev);
      if (next.has(onChainHash)) {
        next.delete(onChainHash);
      } else {
        next.add(onChainHash);
      }
      return next;
    });
  };

  // Clear all burn selections
  const clearBurnSelection = () => {
    setSelectedForBurn(new Set());
  };

  // Sync form state when course data loads
  useEffect(() => {
    if (course && !formInitialized) {
      setFormTitle(course.title ?? "");
      setFormDescription(course.description ?? "");
      setFormImageUrl(course.imageUrl ?? "");
      // Note: video_url not available in merged OrchestrationCourseContent
      setFormVideoUrl("");
      setFormInitialized(true);
    }
  }, [course, formInitialized]);

  // Update header when course loads
  useEffect(() => {
    if (course) {
      setTitle(courseTitle);
      setBreadcrumbs([
        { label: "Studio", href: "/studio" },
        { label: courseTitle },
      ]);
    }
  }, [course, courseTitle, setBreadcrumbs, setTitle]);

  // Update header actions
  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        <AndamioButton
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          asChild
        >
          <Link href={`/course/${courseId}?preview=teacher`}>
            <PreviewIcon className="h-3.5 w-3.5 mr-1" />
            Preview
          </Link>
        </AndamioButton>
      </div>
    );
  }, [setActions, courseId]);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleSave = async () => {
    if (!course) return;

    try {
      await updateCourseMutation.mutateAsync({
        courseId: courseId,
        data: {
          title: formTitle || undefined,
          description: formDescription || undefined,
          imageUrl: formImageUrl || undefined,
          videoUrl: formVideoUrl || undefined,
        },
      });
      toast.success("Course updated");
    } catch (err) {
      toast.error("Failed to save", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCourseMutation.mutateAsync(courseId);
      toast.success("Course deleted");
      router.push("/studio");
    } catch (err) {
      toast.error("Failed to delete", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleToggleVisibility = async (isPublic: boolean) => {
    if (!course) return;
    try {
      await updateCourseMutation.mutateAsync({
        courseId: courseId,
        data: { isPublic },
      });
      toast.success(isPublic ? "Course is now public" : "Course is now private");
    } catch (err) {
      toast.error("Failed to update visibility", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleRegisterModule = async (sltHash: string) => {
    if (!registerModuleCode.trim()) {
      toast.error("Please enter a module code");
      return;
    }
    try {
      const result = await registerModuleMutation.mutateAsync({
        courseId: courseId,
        moduleCode: registerModuleCode.trim(),
        sltHash,
      });
      toast.success(`Registered module "${registerModuleCode}" with ${result?.sltCount ?? 0} Learning Targets`);
      setRegisteringHash(null);
      setRegisterModuleCode("");
      // Refetch to show updated data
      await refetchModules();
      await refetchCourse();
    } catch (err) {
      toast.error("Failed to register module", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  // Computed values
  const isLoading = isLoadingCourse || isLoadingModules;
  const assessmentViewHref = `/studio/course/${courseId}/teacher`;
  // Note: video_url comparison is always vs "" since it's not in merged type
  const hasChanges = course && (
    formTitle !== (course.title ?? "") ||
    formDescription !== (course.description ?? "") ||
    formImageUrl !== (course.imageUrl ?? "") ||
    formVideoUrl !== ""
  );

  // Loading state
  if (isLoading && !course) {
    return <AndamioStudioLoading variant="centered" />;
  }

  // Unregistered state - course exists on-chain but not in DB
  // Show registration form instead of normal editor
  if (isUnregistered) {
    return (
      <RegisterCourse
        courseId={courseId}
        owner={teacherCourse?.owner}
      />
    );
  }

  // Error state
  if (courseError || !course) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <AndamioAlert variant="destructive" className="max-w-md">
          <AlertIcon className="h-4 w-4" />
          <AndamioAlertDescription>
            {courseError instanceof Error ? courseError.message : "Course not found"}
          </AndamioAlertDescription>
        </AndamioAlert>
      </div>
    );
  }

  // Check if we're in empty state (no modules)
  const isEmpty = modules.length === 0;

  return (
    <AndamioScrollArea className="h-full">
      <div className="min-h-full">
        {/* Content Area */}
        <div className={cn(
          "mx-auto px-6",
          isEmpty ? "max-w-3xl py-8" : "max-w-4xl py-6"
        )}>
          {/* Course Header - Always visible */}
          <div className={cn("mb-6", isEmpty && "text-center")}>
            <AndamioHeading level={1} size="4xl" className="mb-2">{courseTitle}</AndamioHeading>
            {!isEmpty && (
              <div className="flex items-center gap-3">
                <AndamioBadge variant="default" className="text-[10px]">
                  <OnChainIcon className="h-2.5 w-2.5 mr-1" />
                  Published
                </AndamioBadge>
                <span className="text-sm text-muted-foreground">
                  {moduleStats.active} active · {moduleStats.draft + moduleStats.approved} draft
                </span>
              </div>
            )}
          </div>
          {isEmpty ? (
            /* Empty State - Full Welcome Experience (No Tabs) */
            <div className="flex flex-col items-center">
              {/* Hero Section */}
              <div className="text-center mb-10">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 mx-auto mb-6 shadow-xl shadow-primary/30">
                  <CredentialIcon className="h-12 w-12 text-primary-foreground" />
                </div>
                <AndamioHeading level={2} size="2xl" className="mb-4">
                  Create Your First Credential
                </AndamioHeading>
                <AndamioText variant="muted" className="text-lg leading-relaxed">
                  Every module is a <strong className="text-foreground">verifiable credential</strong> that learners earn on-chain.
                  Design what mastery looks like, and Andamio handles the rest.
                </AndamioText>
              </div>

              {/* Two Path Options */}
              <div className="grid md:grid-cols-2 gap-6 w-full mb-12">
                {/* Guided Path */}
                <button
                  type="button"
                  onClick={() => router.push(`/studio/course/${courseId}/new?step=credential&mode=wizard`)}
                  className="group relative text-left p-6 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-300"
                >
                  <div className="absolute top-4 right-4">
                    <AndamioBadge variant="default" className="text-[10px] shadow-sm">
                      Recommended
                    </AndamioBadge>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 mb-4 group-hover:scale-110 group-hover:bg-primary/30 transition-all">
                    <SparkleIcon className="h-7 w-7 text-primary" />
                  </div>
                  <AndamioHeading level={3} size="xl" className="mb-2">Guided Setup</AndamioHeading>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    Walk through each step: define the credential, set learning targets, write lessons, and create an assignment.
                  </p>
                  <div className="flex items-center text-primary font-semibold">
                    Start Building
                    <NextIcon className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* Pro Path */}
                <button
                  type="button"
                  onClick={() => router.push(`/studio/course/${courseId}/new?step=credential&mode=pro`)}
                  className="group text-left p-6 rounded-2xl border-2 border-border bg-gradient-to-br from-muted/50 via-muted/20 to-background hover:border-border/80 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4 group-hover:scale-110 group-hover:bg-muted/80 transition-all">
                    <OnChainIcon className="h-7 w-7 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <AndamioHeading level={3} size="xl" className="mb-2">Quick Create</AndamioHeading>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    Jump directly into the editor. Best for experienced builders who want full control from the start.
                  </p>
                  <div className="flex items-center text-muted-foreground group-hover:text-foreground font-semibold transition-colors">
                    Create Credential
                    <NextIcon className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>

              {/* Credential Anatomy */}
              <div className="w-full">
                <div className="text-center mb-8">
                  <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
                    Anatomy of a Credential
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Each credential (module) contains everything needed to verify competency
                  </p>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="relative p-5 rounded-2xl bg-gradient-to-br from-info/10 via-info/5 to-transparent border border-secondary/20">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/20 mb-3">
                      <SLTIcon className="h-5 w-5 text-secondary" />
                    </div>
                    <div className="font-bold mb-1">Learning Targets</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Clear, measurable outcomes that define what &quot;mastery&quot; means
                    </p>
                  </div>
                  <div className="relative p-5 rounded-2xl bg-gradient-to-br from-success/10 via-success/5 to-transparent border border-primary/20">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/20 mb-3">
                      <CourseIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="font-bold mb-1">Lessons</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Rich content that guides learners toward each target
                    </p>
                  </div>
                  <div className="relative p-5 rounded-2xl bg-gradient-to-br from-warning/10 via-warning/5 to-transparent border border-muted-foreground/20">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted/20 mb-3">
                      <CredentialIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="font-bold mb-1">Assignment</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Real-world contribution that proves competency
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Has Modules - Show Tabs Interface */
            <AndamioTabs value={activeTab} onValueChange={handleTabChange}>
              {course.isPublic === false && (
                <AndamioAlert className="mb-4">
                  <AlertIcon className="h-4 w-4" />
                  <AndamioAlertTitle>Course is private</AndamioAlertTitle>
                  <AndamioAlertDescription>
                    <AndamioText>
                      Private courses are hidden from Browse Courses. Set this course to Public to
                      make it visible to learners.
                    </AndamioText>
                    <AndamioButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleTabChange("settings")}
                      className="mt-2"
                    >
                      Open Settings
                    </AndamioButton>
                  </AndamioAlertDescription>
                </AndamioAlert>
              )}
              <AndamioTabsList className="w-auto inline-flex h-9 mb-6">
                <AndamioTabsTrigger value="modules" className="text-sm gap-1.5 px-4">
                  <CourseIcon className="h-4 w-4" />
                  Course
                </AndamioTabsTrigger>
                <AndamioTabsTrigger value="credentials" className="text-sm gap-1.5 px-4">
                  <CredentialIcon className="h-4 w-4" />
                  Credentials
                </AndamioTabsTrigger>
                <AndamioTabsTrigger value="teacher" className="text-sm gap-1.5 px-4">
                  <TeacherIcon className="h-4 w-4" />
                  Teachers
                  {pendingCommitmentsForCourse.length > 0 && (
                    <AndamioBadge variant="secondary" className="ml-1 h-5 min-w-5 px-1 text-[10px]">
                      {pendingCommitmentsForCourse.length}
                    </AndamioBadge>
                  )}
                </AndamioTabsTrigger>
                <AndamioTabsTrigger value="settings" className="text-sm gap-1.5 px-4">
                  <SettingsIcon className="h-4 w-4" />
                  Settings
                </AndamioTabsTrigger>
              </AndamioTabsList>

              {/* Credentials Tab */}
              <AndamioTabsContent value="modules" className="mt-0">
                <div className="space-y-4">
                  {/* Module Cards */}
                  <div className="grid gap-4">
                    {modules.map((courseModule, index) => (
                      <StudioModuleCard
                        key={courseModule.sltHash || courseModule.moduleCode || `module-${index}`}
                        courseModule={courseModule}
                        courseId={courseId}
                        onDelete={async () => {
                          const code = courseModule.moduleCode ?? "";
                          try {
                            await deleteModuleMutation.mutateAsync({
                              courseId: courseId,
                              moduleCode: code,
                            });
                            toast.success(`Module "${code}" deleted`);
                          } catch (err) {
                            toast.error("Failed to delete module", {
                              description: err instanceof Error ? err.message : "Unknown error",
                            });
                          }
                        }}
                        isDeleting={deleteModuleMutation.isPending}
                      />
                    ))}
                  </div>

                  {/* Add Credential Button - Centered at bottom */}
                  <div className="flex justify-center pt-4">
                    <AndamioButton
                      variant="outline"
                      onClick={() => router.push(`/studio/course/${courseId}/new?step=credential`)}
                    >
                      <AddIcon className="h-4 w-4 mr-2" />
                      Add Credential
                    </AndamioButton>
                  </div>

                  {/* Footer Stats */}
                  {moduleStats.pending > 0 && (
                    <AndamioAlert className="mt-6">
                      <PendingIcon className="h-4 w-4 text-secondary animate-pulse" />
                      <AndamioAlertDescription>
                        {moduleStats.pending} credential{moduleStats.pending !== 1 ? "s" : ""} pending blockchain confirmation
                      </AndamioAlertDescription>
                    </AndamioAlert>
                  )}

                  {/* Unregistered Modules CTA */}
                  {moduleStats.unregistered > 0 && (
                    <AndamioAlert className="mt-6 border-secondary/30 bg-secondary/5">
                      <OnChainIcon className="h-4 w-4 text-secondary" />
                      <AndamioAlertDescription className="flex items-center justify-between gap-4">
                        <span>
                          {moduleStats.unregistered} on-chain module{moduleStats.unregistered !== 1 ? "s need" : " needs"} to be registered before you can add content.
                        </span>
                        <AndamioButton
                          size="sm"
                          variant="outline"
                          className="flex-shrink-0 border-secondary/30 text-secondary hover:bg-secondary/10"
                          onClick={() => handleTabChange("credentials")}
                        >
                          Go to Credentials Tab
                        </AndamioButton>
                      </AndamioAlertDescription>
                    </AndamioAlert>
                  )}
                </div>
              </AndamioTabsContent>

              {/* Credentials Tab (On-Chain data) */}
              <AndamioTabsContent value="credentials" className="mt-0 space-y-6">
                <div className="rounded-xl border p-3 bg-muted/30 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <OnChainIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CopyId id={courseId} label="Policy ID" />
                    </div>
                    <AndamioButton variant="outline" size="sm" asChild className="flex-shrink-0">
                      <a
                        href={`https://preprod.cardanoscan.io/tokenPolicy/${courseId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <ExternalLinkIcon className="h-4 w-4 mr-1" />
                        View
                      </a>
                    </AndamioButton>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-xs pl-11">
                    <span className="flex items-center gap-1 text-primary">
                      <VerifiedIcon className="h-3 w-3" />
                      {moduleStats.active} verified
                    </span>
                    {moduleStats.pending > 0 && (
                      <>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="flex items-center gap-1 text-secondary">
                          <PendingIcon className="h-3 w-3 animate-pulse" />
                          {moduleStats.pending} pending
                        </span>
                      </>
                    )}
                    {moduleStats.readyToMint > 0 && (
                      <>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="text-muted-foreground">{moduleStats.readyToMint} ready to mint</span>
                      </>
                    )}
                    {moduleStats.unregistered > 0 && (
                      <>
                        <span className="text-muted-foreground/30">·</span>
                        <span className="flex items-center gap-1 text-secondary">
                          <OnChainIcon className="h-3 w-3" />
                          {moduleStats.unregistered} unregistered
                        </span>
                      </>
                    )}
                    <span className="text-muted-foreground/30">·</span>
                    <span className="text-muted-foreground">{moduleStats.total} total</span>
                  </div>
                </div>

                {/* Module verification list - show registered modules by status */}
                <div className="space-y-3">
                  {modules.filter((m) => m.status !== "unregistered").map((m) => {
                    const isActive = m.status === "active";
                    const isPending = m.status === "pending_tx";
                    const isDbOnly = m.status === "draft" || m.status === "approved";
                    const sltCount = m.onChainSlts?.length ?? m.slts?.length ?? 0;

                    return (
                      <div
                        key={m.sltHash || m.moduleCode || m.title}
                        className={cn(
                          "rounded-xl border p-4 space-y-3",
                          isActive && "bg-primary/5 border-primary/20",
                          isPending && "bg-secondary/5 border-secondary/20",
                          isDbOnly && "bg-muted/30"
                        )}
                      >
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Selection checkbox for active (on-chain) modules */}
                            {isActive && m.sltHash ? (
                              <AndamioCheckbox
                                checked={selectedForBurn.has(m.sltHash)}
                                onCheckedChange={() => toggleBurnSelection(m.sltHash)}
                                aria-label={`Select ${m.moduleCode} for removal`}
                              />
                            ) : null}
                            {/* Status icon */}
                            {isActive && (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
                                <VerifiedIcon className="h-4 w-4 text-primary" />
                              </div>
                            )}
                            {isPending && (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/20">
                                <PendingIcon className="h-4 w-4 text-secondary animate-pulse" />
                              </div>
                            )}
                            {isDbOnly && (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                <CredentialIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            {/* Module info */}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-sm font-medium">{m.moduleCode}</span>
                                {isActive && (
                                  <AndamioBadge className="bg-primary/20 text-primary border-0 text-[10px]">
                                    Verified
                                  </AndamioBadge>
                                )}
                                {isPending && (
                                  <AndamioBadge className="bg-secondary/20 text-secondary border-0 text-[10px]">
                                    Pending
                                  </AndamioBadge>
                                )}
                                {isDbOnly && (
                                  <AndamioBadge variant="outline" className="text-[10px]">
                                    Not Minted
                                  </AndamioBadge>
                                )}
                              </div>
                              {m.title && (
                                <AndamioText variant="small" className="truncate">{m.title}</AndamioText>
                              )}
                            </div>
                          </div>
                          {/* Learning Target count */}
                          <div className="text-right flex-shrink-0">
                            <div className="text-sm font-medium">{sltCount} Learning Target{sltCount !== 1 ? "s" : ""}</div>
                            <AndamioText variant="small" className="text-[10px]">
                              {isActive ? "On-Chain" : "Database"}
                            </AndamioText>
                          </div>
                        </div>

                        {/* SLTs from on-chain (for active modules) */}
                        {isActive && (m.onChainSlts?.length ?? 0) > 0 && (
                          <div className="space-y-1.5 pl-11">
                            <AndamioText variant="small" className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                              On-Chain Learning Targets
                            </AndamioText>
                            <div className="space-y-1">
                              {m.onChainSlts?.map((slt, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm">
                                  <SLTIcon className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
                                  <span>{slt}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Hash display for on-chain modules */}
                        {isActive && m.sltHash && (
                          <div className="space-y-2 pl-11">
                            <AndamioText variant="small" className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                              Token Name (Hash)
                            </AndamioText>
                            <div className="flex items-center gap-2">
                              <OnChainIcon className="h-3 w-3 text-primary flex-shrink-0" />
                              <code className="text-[10px] font-mono text-foreground bg-primary/10 px-1.5 py-0.5 rounded break-all">
                                {m.sltHash}
                              </code>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Mint Modules - Show when there are modules ready to mint (APPROVED but not yet on-chain) */}
                {moduleStats.readyToMint > 0 && (
                  <MintModuleTokens
                    courseId={courseId}
                    courseModules={modulesReadyToMint}
                    onSuccess={async () => {
                      await refetchModules();
                      await refetchCourse();
                    }}
                  />
                )}

                {/* Burn Modules - Show when modules are selected for removal */}
                {modulesToBurn.length > 0 && (
                  <BurnModuleTokens
                    courseId={courseId}
                    modulesToBurn={modulesToBurn}
                    onClearSelection={clearBurnSelection}
                    onSuccess={async () => {
                      await refetchModules();
                      await refetchCourse();
                    }}
                  />
                )}

                {/* Unregistered Modules - On-chain but not in database */}
                {unregisteredModules.length > 0 && (
                  <StudioFormSection title="Unregistered Modules">
                    <AndamioAlert className="mb-4">
                      <OnChainIcon className="h-4 w-4 text-secondary" />
                      <AndamioAlertDescription>
                        These modules exist on-chain but aren&apos;t registered in the database yet.
                        Register them to add lessons, assignments, and other content.
                      </AndamioAlertDescription>
                    </AndamioAlert>

                    <div className="space-y-3">
                      {unregisteredModules.map((m) => (
                        <div
                          key={m.sltHash}
                          className="rounded-xl border p-4 bg-secondary/5 border-secondary/20 space-y-4"
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/20">
                                <OnChainIcon className="h-4 w-4 text-secondary" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-sm font-medium text-secondary">
                                    On-Chain Only
                                  </span>
                                  <AndamioBadge className="bg-secondary/20 text-secondary border-0 text-[10px]">
                                    Needs Registration
                                  </AndamioBadge>
                                </div>
                                <AndamioText variant="small" className="font-mono text-[10px] truncate">
                                  {m.sltHash}
                                </AndamioText>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-sm font-medium">{m.onChainSlts?.length ?? 0} Learning Target{(m.onChainSlts?.length ?? 0) !== 1 ? "s" : ""}</div>
                              <AndamioText variant="small" className="text-[10px]">On-Chain</AndamioText>
                            </div>
                          </div>

                          {/* SLTs preview */}
                          {(m.onChainSlts?.length ?? 0) > 0 && (
                            <div className="space-y-1.5 pl-11">
                              <AndamioText variant="small" className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                Learning Targets (On-Chain)
                              </AndamioText>
                              <div className="space-y-1">
                                {m.onChainSlts?.map((slt, i) => (
                                  <div key={i} className="flex items-start gap-2 text-sm">
                                    <SLTIcon className="h-3.5 w-3.5 mt-0.5 text-secondary flex-shrink-0" />
                                    <span className="text-muted-foreground">{slt}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Registration form */}
                          {registeringHash === m.sltHash ? (
                            <div className="space-y-3 pl-11">
                              <div className="space-y-2">
                                <AndamioLabel htmlFor={`module-code-${m.sltHash}`}>
                                  Module Code
                                </AndamioLabel>
                                <AndamioInput
                                  id={`module-code-${m.sltHash}`}
                                  value={registerModuleCode}
                                  onChange={(e) => setRegisterModuleCode(e.target.value)}
                                  placeholder="e.g., 101 or MODULE-A"
                                  className="max-w-xs font-mono"
                                />
                                <AndamioText variant="small">
                                  Choose a unique code to identify this module in your course
                                </AndamioText>
                              </div>
                              <div className="flex gap-2">
                                <AndamioButton
                                  size="sm"
                                  onClick={() => handleRegisterModule(m.sltHash)}
                                  disabled={registerModuleMutation.isPending || !registerModuleCode.trim()}
                                >
                                  {registerModuleMutation.isPending ? (
                                    <>
                                      <PendingIcon className="h-4 w-4 mr-1 animate-spin" />
                                      Registering...
                                    </>
                                  ) : (
                                    <>
                                      <AddIcon className="h-4 w-4 mr-1" />
                                      Register Module
                                    </>
                                  )}
                                </AndamioButton>
                                <AndamioButton
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setRegisteringHash(null);
                                    setRegisterModuleCode("");
                                  }}
                                  disabled={registerModuleMutation.isPending}
                                >
                                  Cancel
                                </AndamioButton>
                              </div>
                            </div>
                          ) : (
                            <div className="pl-11">
                              <AndamioButton
                                size="sm"
                                variant="outline"
                                onClick={() => setRegisteringHash(m.sltHash)}
                              >
                                <AddIcon className="h-4 w-4 mr-1" />
                                Register This Module
                              </AndamioButton>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </StudioFormSection>
                )}

                {/* Only show blockchain links after modules are minted */}
                {activeModules.length > 0 && (
                  <div className="flex items-center gap-4 text-sm">
                    <a
                      href={`https://preprod.cardanoscan.io/tokenPolicy/${courseId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLinkIcon className="h-3.5 w-3.5" />
                      CardanoScan
                    </a>
                    <a
                      href={`https://preprod.cexplorer.io/policy/${courseId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLinkIcon className="h-3.5 w-3.5" />
                      Cexplorer
                    </a>
                  </div>
                )}
              </AndamioTabsContent>

              {/* Teacher Tab */}
              <AndamioTabsContent value="teacher" className="mt-0 space-y-6">
                {/* Teaching Team — first so it's always visible */}
                <StudioFormSection title="Teaching Team">
                  <div className="space-y-3">
                    {course.owner && (
                      <div className="flex items-center justify-between">
                        <AndamioLabel className="flex items-center gap-1.5">
                          <OwnerIcon className="h-3.5 w-3.5 text-primary" />
                          Owner
                        </AndamioLabel>
                        <AndamioBadge variant="default" className="font-mono text-xs">
                          {course.owner}
                        </AndamioBadge>
                      </div>
                    )}
                    {teachers.length > 0 && (
                      <div className="flex items-center justify-between gap-4">
                        <AndamioLabel className="flex items-center gap-1.5 flex-shrink-0">
                          <TeacherIcon className="h-3.5 w-3.5" />
                          Teachers
                        </AndamioLabel>
                        <div className="flex flex-wrap gap-1.5 justify-end">
                          {teachers.map((teacher: string) => (
                            <AndamioBadge key={teacher} variant="secondary" className="font-mono text-xs">
                              {teacher}
                            </AndamioBadge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </StudioFormSection>

                {/* Manage Teachers - Owner only */}
                {isOwner && (
                  <StudioFormSection title="Manage Teachers" description="Add or remove teachers from this course">
                    <TeachersUpdate
                      courseId={courseId}
                      currentTeachers={teachers}
                      onSuccess={() => {
                        void refetchCourse();
                      }}
                    />
                  </StudioFormSection>
                )}

                {/* Assessment Summary Bar */}
                <div className="flex items-center justify-between gap-4 rounded-xl border p-4 bg-muted/30">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5">
                      <PendingIcon className="h-3.5 w-3.5 text-secondary" />
                      <strong>{pendingCommitmentsForCourse.length}</strong> Pending
                    </span>
                    <span className="text-muted-foreground/30">·</span>
                    <span className="flex items-center gap-1.5">
                      <NeutralIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      <strong>{inProgressCommitments.length}</strong> In Progress
                    </span>
                    <span className="text-muted-foreground/30">·</span>
                    <span className="flex items-center gap-1.5">
                      <CompletedIcon className="h-3.5 w-3.5 text-primary" />
                      <strong>{resolvedCommitments.length}</strong> Resolved
                    </span>
                  </div>
                  <AndamioButton size="sm" asChild>
                    <Link href={assessmentViewHref}>
                      <TeacherIcon className="h-4 w-4 mr-1.5" />
                      Open Assessment View
                    </Link>
                  </AndamioButton>
                </div>

                {/* Pending Review — capped at 3 */}
                {pendingCommitmentsForCourse.length > 0 ? (
                  <StudioFormSection title={`Pending Review (${pendingCommitmentsForCourse.length})`}>
                    <div className="space-y-3">
                      {pendingCommitmentsForCourse.slice(0, 3).map((commitment, i) => (
                        <Link
                          key={`${commitment.studentAlias}-${commitment.sltHash}-${i}`}
                          href={`/studio/course/${courseId}/teacher?student=${encodeURIComponent(commitment.studentAlias)}&sltHash=${encodeURIComponent(commitment.sltHash ?? "")}`}
                          className="block rounded-xl border p-4 bg-secondary/5 border-secondary/20 hover:bg-secondary/10 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary/20">
                                <PendingIcon className="h-4 w-4 text-secondary" />
                              </div>
                              <CommitmentInfo studentAlias={commitment.studentAlias} moduleCode={commitment.moduleCode} />
                            </div>
                            <NextIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          </div>
                        </Link>
                      ))}
                      <ViewAllLink href={assessmentViewHref} count={pendingCommitmentsForCourse.length} label="pending reviews" />
                    </div>
                  </StudioFormSection>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <TeacherIcon className="h-10 w-10 text-muted-foreground/40 mb-4" />
                    <AndamioHeading level={3} size="lg" className="mb-1">No Pending Reviews</AndamioHeading>
                    <AndamioText variant="muted" className="text-center max-w-sm">
                      All caught up! When students submit assignment work, pending reviews will appear here.
                    </AndamioText>
                  </div>
                )}

                {/* In Progress — capped at 3 */}
                {inProgressCommitments.length > 0 && (
                  <StudioFormSection title={`In Progress (${inProgressCommitments.length})`}>
                    <div className="space-y-3">
                      {inProgressCommitments.slice(0, 3).map((commitment, i) => (
                        <div key={`${commitment.studentAlias}-${commitment.sltHash}-progress-${i}`} className="rounded-xl border p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                <NeutralIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <CommitmentInfo studentAlias={commitment.studentAlias} moduleCode={commitment.moduleCode} />
                            </div>
                            <AndamioBadge variant="outline" className="text-[10px]">
                              {COMMITMENT_STATUS_LABELS[commitment.commitmentStatus ?? ""] ?? "In Progress"}
                            </AndamioBadge>
                          </div>
                        </div>
                      ))}
                      <ViewAllLink href={assessmentViewHref} count={inProgressCommitments.length} label="in progress" />
                    </div>
                  </StudioFormSection>
                )}

                {/* Resolved — capped at 3 */}
                {resolvedCommitments.length > 0 && (
                  <StudioFormSection title="Resolved">
                    <div className="space-y-3">
                      {resolvedCommitments.slice(0, 3).map((commitment, i) => {
                        const isAccepted = commitment.commitmentStatus === "ACCEPTED";
                        return (
                          <div key={`${commitment.studentAlias}-${commitment.sltHash}-resolved-${i}`} className="rounded-xl border p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={cn(
                                  "flex h-8 w-8 items-center justify-center rounded-full",
                                  isAccepted ? "bg-primary/20" : "bg-destructive/20"
                                )}>
                                  {isAccepted ? (
                                    <CompletedIcon className="h-4 w-4 text-primary" />
                                  ) : (
                                    <CloseIcon className="h-4 w-4 text-destructive" />
                                  )}
                                </div>
                                <CommitmentInfo studentAlias={commitment.studentAlias} moduleCode={commitment.moduleCode} />
                              </div>
                              <AndamioBadge
                                variant={isAccepted ? "default" : "destructive"}
                                className="text-[10px]"
                              >
                                {isAccepted ? "Accepted" : "Refused"}
                              </AndamioBadge>
                            </div>
                          </div>
                        );
                      })}
                      <ViewAllLink href={assessmentViewHref} count={resolvedCommitments.length} label="resolved" />
                    </div>
                  </StudioFormSection>
                )}

                {/* Teaching Team */}
                <StudioFormSection title="Teaching Team">
                  <div className="space-y-3">
                    {course.owner && (
                      <div className="flex items-center justify-between">
                        <AndamioLabel className="flex items-center gap-1.5">
                          <OwnerIcon className="h-3.5 w-3.5 text-primary" />
                          Owner
                        </AndamioLabel>
                        <AndamioBadge variant="default" className="font-mono text-xs">
                          {course.owner}
                        </AndamioBadge>
                      </div>
                    )}
                    {(course.teachers ?? []).length > 0 && (
                      <div className="flex items-center justify-between gap-4">
                        <AndamioLabel className="flex items-center gap-1.5 flex-shrink-0">
                          <TeacherIcon className="h-3.5 w-3.5" />
                          Teachers
                        </AndamioLabel>
                        <div className="flex flex-wrap gap-1.5 justify-end">
                          {(course.teachers ?? []).map((teacher: string) => (
                            <AndamioBadge key={teacher} variant="secondary" className="font-mono text-xs">
                              {teacher}
                            </AndamioBadge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </StudioFormSection>

                {/* Learners */}
                <StudioFormSection title="Learners" description="Students with assignment activity">
                  <div className="flex items-center justify-between">
                    <AndamioText variant="small">
                      View all students who have submitted assignments for this course.
                    </AndamioText>
                    <Link href={`/studio/course/${courseId}/manage-learners`}>
                      <AndamioButton variant="outline" size="sm">
                        <LearnerIcon className="h-3.5 w-3.5 mr-1.5" />
                        View Learners ({uniqueLearnerCount})
                      </AndamioButton>
                    </Link>
                  </div>
                </StudioFormSection>

                {/* Manage Teachers - Owner only */}
                {isOwner && (
                  <StudioFormSection title="Manage Teachers" description="Add or remove teachers from this course">
                    <TeachersUpdate
                      courseId={courseId}
                      currentTeachers={course.teachers ?? []}
                      onSuccess={() => {
                        void refetchCourse();
                      }}
                    />
                  </StudioFormSection>
                )}
              </AndamioTabsContent>

              {/* Settings Tab */}
              <AndamioTabsContent value="settings" className="mt-0 space-y-8">
                {/* General */}
                <StudioFormSection title="General" description="Course title, description, and media">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <AndamioLabel htmlFor="title">Title</AndamioLabel>
                      <AndamioInput
                        id="title"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        placeholder="Course title"
                      />
                    </div>
                    <div className="space-y-2">
                      <AndamioLabel htmlFor="description">Description</AndamioLabel>
                      <AndamioTextarea
                        id="description"
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Course description"
                        rows={4}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <AndamioLabel htmlFor="imageUrl">Cover Image</AndamioLabel>
                        <ImagePreview url={formImageUrl} alt={formTitle || "Course cover"} />
                        <AndamioInput
                          id="imageUrl"
                          value={formImageUrl}
                          onChange={(e) => setFormImageUrl(e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="space-y-2">
                        <AndamioLabel htmlFor="videoUrl">Intro Video</AndamioLabel>
                        <VideoPreview url={formVideoUrl} />
                        <AndamioInput
                          id="videoUrl"
                          value={formVideoUrl}
                          onChange={(e) => setFormVideoUrl(e.target.value)}
                          placeholder="https://youtube.com/..."
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <AndamioText variant="small" className="text-muted-foreground">
                        {hasChanges ? "You have unsaved changes" : "All changes saved"}
                      </AndamioText>
                      <AndamioSaveButton
                        onClick={handleSave}
                        isSaving={updateCourseMutation.isPending}
                        disabled={!hasChanges}
                      />
                    </div>
                  </div>
                </StudioFormSection>

                {/* Visibility */}
                <StudioFormSection title="Visibility" description="Control who can discover this course">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <AndamioBadge variant={course.isPublic ? "default" : "outline"} className="text-xs">
                        {course.isPublic ? "Public" : "Private"}
                      </AndamioBadge>
                      <AndamioText variant="small">
                        {course.isPublic
                          ? "Anyone can find this course in the catalog"
                          : "Only owners and teachers can see this course"}
                      </AndamioText>
                    </div>
                    {isOwner && (
                      <AndamioButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleVisibility(!course.isPublic)}
                        disabled={updateCourseMutation.isPending}
                      >
                        {updateCourseMutation.isPending
                          ? "Updating..."
                          : course.isPublic
                            ? "Make Private"
                            : "Make Public"}
                      </AndamioButton>
                    )}
                  </div>
                </StudioFormSection>

                {/* Course ID */}
                <StudioFormSection title="Course ID" description="Unique identifier for this course">
                  <CopyId id={course.courseId ?? courseId} label="Course ID" />
                </StudioFormSection>

                {/* Danger Zone - Owner only */}
                {isOwner && (
                  <div className="border-t pt-8">
                    <StudioFormSection title="Danger Zone" description="Irreversible actions">
                      <div className="flex items-center justify-between">
                        <AndamioText variant="small">
                          Permanently delete this course and all its content.
                        </AndamioText>
                        <AndamioConfirmDialog
                          trigger={
                            <AndamioButton
                              variant="destructive"
                              size="sm"
                              disabled={deleteCourseMutation.isPending}
                            >
                              <DeleteIcon className="h-4 w-4 mr-2" />
                              Delete Course
                            </AndamioButton>
                          }
                          title="Delete Course"
                          description={`Are you sure you want to delete "${course.title ?? "this course"}"? This will remove all modules, lessons, and assignments.`}
                          confirmText="Delete Course"
                          variant="destructive"
                          onConfirm={handleDelete}
                          isLoading={deleteCourseMutation.isPending}
                        />
                      </div>
                    </StudioFormSection>
                  </div>
                )}
              </AndamioTabsContent>
            </AndamioTabs>
          )}
        </div>
      </div>

    </AndamioScrollArea>
  );
}

/**
 * Studio Course Edit Page
 *
 * Clean, breathable layout for course overview and module management.
 * Modules are front and center - the heart of every course.
 */
export default function StudioCourseEditPage() {
  const params = useParams();
  const courseId = params.coursenft as string;

  return (
    <RequireCourseAccess
      courseId={courseId}
      title="Edit Course"
      description="Connect your wallet to edit this course"
      loadingVariant="studio-centered"
    >
      <CourseEditorContent courseId={courseId} />
    </RequireCourseAccess>
  );
}
