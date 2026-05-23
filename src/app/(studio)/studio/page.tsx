"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWallet } from "@meshsdk/react";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxStream } from "~/hooks/tx/use-tx-stream";
import { AndamioScrollArea } from "~/components/andamio/andamio-scroll-area";
import {
  useTeacherCourses,
  useInvalidateTeacherCourses,
  useRegisterCourse,
  useUpdateCourse,
} from "~/hooks/api";
import {
  useOwnerProjects,
  useManagerProjects,
} from "~/hooks/api";
import {
  AndamioButton,
  AndamioInput,
  AndamioCard,
  AndamioCardContent,
} from "~/components/andamio";
import { toast } from "sonner";
import { CreateProject } from "~/components/tx";
import {
  CourseIcon,
  ProjectIcon,
  AddIcon,
  AlertIcon,
  LoadingIcon,
  SuccessIcon,
} from "~/components/icons";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { getWalletAddressBech32 } from "~/lib/wallet-address";
import { PendingProjectBanner } from "~/components/studio/pending-project-banner";
import { pendingProject } from "~/lib/pending-project";
import { useStudioContext } from "./studio-context";

// =============================================================================
// ChecklistStep — vertical stepper item with numbered circle / checkmark
// =============================================================================

interface ChecklistStepProps {
  step: number;
  title: string;
  status: string | null; // null = incomplete, string = completion summary
  isLast?: boolean;
  children: React.ReactNode;
}

function ChecklistStep({ step, title, status, isLast = false, children }: ChecklistStepProps) {
  const isComplete = status !== null;

  return (
    <div className="flex gap-4">
      {/* Left rail: indicator + connector line */}
      <div className="flex flex-col items-center">
        {isComplete ? (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground">
            <SuccessIcon className="h-4 w-4" />
          </div>
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/30 text-muted-foreground">
            <span className="text-sm font-semibold">{step}</span>
          </div>
        )}
        {/* Connector line */}
        {!isLast && (
          <div className={`w-px flex-1 mt-1 ${isComplete ? "bg-success/40" : "bg-border"}`} />
        )}
      </div>

      {/* Right: content */}
      <div className="flex-1 pb-8 min-w-0">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-sm font-semibold ${isComplete ? "text-success" : "text-foreground"}`}>
            {title}
          </span>
          {status && (
            <AndamioBadge className="text-xs bg-success/10 text-success border-success/20">
              {status}
            </AndamioBadge>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

// =============================================================================
// Main Page Component
// =============================================================================

/**
 * Studio Home Page
 * Shows welcome panel with create options, or create forms via shared context.
 */
export default function StudioHomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createMode, showCreateCourse, showCreateProject, cancelCreate } = useStudioContext();

  // Handle ?create=course or ?create=project query param
  useEffect(() => {
    const createParam = searchParams.get("create");
    if (createParam === "course") {
      showCreateCourse();
      // Clear the query param
      router.replace("/studio", { scroll: false });
    } else if (createParam === "project") {
      showCreateProject();
      router.replace("/studio", { scroll: false });
    }
  }, [searchParams, showCreateCourse, showCreateProject, router]);

  // Data for counts
  const { data: courses = [] } = useTeacherCourses();
  const { data: ownedProjects = [] } = useOwnerProjects();
  const { data: managedProjects = [] } = useManagerProjects();

  const ownedIds = new Set(ownedProjects.map((p) => p.projectId));
  const managedOnly = managedProjects.filter((p) => !ownedIds.has(p.projectId));
  const projectCount = ownedProjects.length + managedOnly.length;

  if (createMode === "course") {
    return (
      <CreateCoursePanel
        onCancel={cancelCreate}
        onCourseCreated={(courseId) => {
          if (pendingProject.get()) {
            cancelCreate();
            router.push(`/studio/course/${courseId}`);
          } else {
            cancelCreate();
          }
        }}
      />
    );
  }

  if (createMode === "project") {
    return (
      <CreateProjectPanel
        onCancel={cancelCreate}
        onSuccess={(projectId) => {
          router.push(`/studio/project/${projectId}`);
        }}
        onCreateCourseForProject={(title) => {
          pendingProject.set(title);
          showCreateCourse();
        }}
      />
    );
  }

  return (
    <WelcomePanel
      courseCount={courses.length}
      projectCount={projectCount}
      onCreateCourse={showCreateCourse}
      onCreateProject={showCreateProject}
    />
  );
}

// =============================================================================
// Welcome Panel
// =============================================================================

interface WelcomePanelProps {
  courseCount: number;
  projectCount: number;
  onCreateCourse: () => void;
  onCreateProject: () => void;
}

function WelcomePanel({ courseCount, projectCount, onCreateCourse, onCreateProject }: WelcomePanelProps) {
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-lg text-center space-y-12">
          {/* Icon */}
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary/10 mx-auto">
            <CourseIcon className="h-5 w-5 text-primary" />
          </div>

          {/* Title */}
          <div>
            <AndamioHeading level={1} size="5xl" className="mb-6">Studio</AndamioHeading>
            <AndamioText variant="muted" as="span" className="text-base max-w-sm">
              Create, manage, and publish courses and projects on Cardano
            </AndamioText>
          </div>

          {/* Quick Actions - Stacked */}
          <div className="flex flex-col space-y-12 max-w-xs mx-auto">
            <div className="space-y-4 text-center">
              <AndamioButton onClick={onCreateCourse}>
                <CourseIcon className="mr-2 h-4 w-4" />
                Create a Course
              </AndamioButton>
              <AndamioText variant="small" className="text-muted-foreground">
                Build learning content with modules and learning targets
              </AndamioText>
            </div>

            <div className="space-y-4 text-center">
              <AndamioButton variant="secondary" onClick={onCreateProject}>
                <ProjectIcon className="mr-2 h-4 w-4" />
                Create a Project
              </AndamioButton>
              <AndamioText variant="small" className="text-muted-foreground">
                Manage contributors and issue credentials
              </AndamioText>
            </div>
          </div>

          {/* Stats */}
          {(courseCount > 0 || projectCount > 0) && (
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{courseCount}</div>
                <AndamioText variant="small" className="text-muted-foreground">
                  Course{courseCount !== 1 ? "s" : ""}
                </AndamioText>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">{projectCount}</div>
                <AndamioText variant="small" className="text-muted-foreground">
                  Project{projectCount !== 1 ? "s" : ""}
                </AndamioText>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Create Course Panel (Inline Form)
// =============================================================================

interface CreateCoursePanelProps {
  onCancel: () => void;
  onCourseCreated?: (courseId: string) => void;
}

function CreateCoursePanel({ onCancel, onCourseCreated }: CreateCoursePanelProps) {
  const router = useRouter();
  const { user } = useAndamioAuth();
  const { wallet, connected } = useWallet();
  const { state, result, error, execute, reset } = useTransaction();
  const invalidateTeacherCourses = useInvalidateTeacherCourses();
  const registerCourse = useRegisterCourse();
  const updateCourse = useUpdateCourse();

  const [title, setTitle] = useState("");
  const [initiatorData, setInitiatorData] = useState<{
    used_addresses: string[];
    change_address: string;
  } | null>(null);

  const [courseMetadata, setCourseMetadata] = useState<{
    policyId: string;
    title: string;
  } | null>(null);
  const courseMetadataRef = React.useRef<typeof courseMetadata>(null);

  useEffect(() => {
    courseMetadataRef.current = courseMetadata;
  }, [courseMetadata]);

  const hasRegisteredRef = React.useRef(false);
  const onCancelRef = React.useRef(onCancel);
  const onCourseCreatedRef = React.useRef(onCourseCreated);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    onCourseCreatedRef.current = onCourseCreated;
  }, [onCourseCreated]);

  const { status: txStatus, isSuccess: txConfirmed } = useTxStream(
    result?.requiresDBUpdate ? result.txHash : null,
    {
      onComplete: (status) => {
        void (async () => {
          const metadata = courseMetadataRef.current;

          if (
            (status.state === "confirmed" || status.state === "updated") &&
            !hasRegisteredRef.current &&
            metadata
          ) {
            hasRegisteredRef.current = true;

            let registrationSucceeded = false;
            try {
              await registerCourse.mutateAsync({
                courseId: metadata.policyId,
                title: metadata.title,
              });
              registrationSucceeded = true;
            } catch (err) {
              const error = err as Error & { status?: number };
              if (error.status === 409) {
                try {
                  await updateCourse.mutateAsync({
                    courseId: metadata.policyId,
                    data: { title: metadata.title },
                  });
                  registrationSucceeded = true;
                } catch (updateErr) {
                  console.error("[CreateCourse] Update failed:", updateErr);
                }
              } else {
                console.error("[CreateCourse] Registration failed:", err);
              }
            }

            await invalidateTeacherCourses();

            if (registrationSucceeded) {
              toast.success("Course Created!", {
                description: `"${metadata.title}" is now live`,
                action: {
                  label: "Open Course",
                  onClick: () => router.push(`/studio/course/${metadata.policyId}`),
                },
              });
            } else {
              toast.warning("Course Created (Registration Pending)", {
                description: "Course is on-chain. It may take a moment to appear.",
              });
            }

            setTitle("");
            setCourseMetadata(null);
            hasRegisteredRef.current = false;
            reset();

            // If created during project detour, redirect to course dashboard
            if (onCourseCreatedRef.current) {
              onCourseCreatedRef.current(metadata.policyId);
            } else {
              // Return to welcome state
              onCancelRef.current();
            }
          } else if (status.state === "failed" || status.state === "expired") {
            toast.error("Course Creation Failed", {
              description: status.last_error ?? "Please try again or contact support.",
            });
          }
        })();
      },
    }
  );

  useEffect(() => {
    const fetchWalletData = async () => {
      if (!wallet || !connected) {
        setInitiatorData(null);
        return;
      }

      try {
        // MeshSDK v2: use Bech32 variants (raw methods return hex now)
        const changeAddress = await getWalletAddressBech32(wallet);
        let usedAddresses: string[];
        try {
          usedAddresses = await wallet.getUsedAddressesBech32();
        } catch {
          usedAddresses = [changeAddress];
        }
        setInitiatorData({
          used_addresses: usedAddresses,
          change_address: changeAddress,
        });
      } catch (err) {
        console.error("Failed to fetch wallet data:", err);
        setInitiatorData(null);
      }
    };

    void fetchWalletData();
  }, [wallet, connected]);

  const handleCreateCourse = async () => {
    if (!user?.accessTokenAlias || !initiatorData || !title.trim()) {
      return;
    }

    hasRegisteredRef.current = false;

    await execute({
      txType: "INSTANCE_COURSE_CREATE",
      params: {
        alias: user.accessTokenAlias,
        teachers: [user.accessTokenAlias],
        initiator_data: initiatorData,
      },
      metadata: {
        title: title.trim(),
      },
      onSuccess: async (txResult) => {
        const courseId = txResult.apiResponse?.course_id as string | undefined;
        if (courseId) {
          setCourseMetadata({
            policyId: courseId,
            title: title.trim(),
          });
        }
      },
      onError: (txError) => {
        console.error("[CreateCourse] Error:", txError);
        toast.error("Course Creation Failed", {
          description: txError.message || "Failed to create course NFT",
        });
      },
    });
  };

  const hasAccessToken = !!user?.accessTokenAlias;
  const hasInitiatorData = !!initiatorData;
  const hasTitle = title.trim().length > 0;
  const canCreate = hasAccessToken && hasInitiatorData && hasTitle;
  const isWaitingForConfirmation = state === "success" && result?.requiresDBUpdate && !txConfirmed;

  return (
    <div className="h-full overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      <AndamioScrollArea className="h-full">
        <div className="p-8 pb-16">
          <div className="max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-5xl w-full mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <CourseIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <AndamioHeading level={2} size="3xl" className="mb-1">Create Course</AndamioHeading>
                  <AndamioText variant="small" className="text-muted-foreground">
                    Mint a Course NFT on Cardano
                  </AndamioText>
                </div>
              </div>
              <AndamioButton variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </AndamioButton>
            </div>

            <PendingProjectBanner />

            {/* Form Card */}
            <AndamioCard className="mt-6">
              <AndamioCardContent className="py-8">
                {/* Requirements Alert */}
                {!hasAccessToken && (
                  <div className="rounded-sm border border-destructive/50 bg-destructive/10 p-4 mb-6">
                    <div className="flex items-center gap-2">
                      <AlertIcon className="h-4 w-4 text-destructive" />
                      <AndamioText className="text-sm text-destructive">
                        You need an Access Token to create a course. Go to the Dashboard to create one.
                      </AndamioText>
                    </div>
                  </div>
                )}

                {hasAccessToken && !hasInitiatorData && (
                  <div className="rounded-sm border border-border bg-muted/50 p-4 mb-6">
                    <div className="flex items-center gap-2">
                      <LoadingIcon className="h-4 w-4 animate-spin text-muted-foreground" />
                      <AndamioText className="text-sm text-muted-foreground">
                        Loading wallet data...
                      </AndamioText>
                    </div>
                  </div>
                )}

                {/* Checklist Steps */}
                {hasAccessToken && hasInitiatorData && !isWaitingForConfirmation && (
                  <div>
                    {/* Step 1: Owner (locked) */}
                    <ChecklistStep
                      step={1}
                      title="Owner"
                      status={user.accessTokenAlias}
                    >
                      <code className="rounded bg-muted px-2 py-1 font-mono text-sm text-foreground">
                        {user.accessTokenAlias}
                      </code>
                      <AndamioText variant="small" className="text-xs mt-1.5">
                        The owner cannot be changed. You can add teachers after creating the course.
                      </AndamioText>
                    </ChecklistStep>

                    {/* Step 2: Course Title */}
                    <ChecklistStep
                      step={2}
                      title="Name your course"
                      status={hasTitle ? title.trim() : null}
                      isLast
                    >
                      <AndamioInput
                        id="course-title"
                        placeholder="Introduction to Cardano Development"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={state !== "idle" && state !== "error"}
                        maxLength={200}
                      />
                      <AndamioText variant="small" className="text-xs mt-1.5">
                        Give your course a public title. You can update this later.
                      </AndamioText>
                    </ChecklistStep>

                    {/* Transaction Status */}
                    {state !== "idle" && (
                      <div className="rounded-sm border bg-muted/30 p-4 mt-4">
                        <div className="flex items-center gap-3">
                          {state === "error" ? (
                            <AlertIcon className="h-5 w-5 text-destructive" />
                          ) : (
                            <LoadingIcon className="h-5 w-5 animate-spin text-primary" />
                          )}
                          <div className="flex-1">
                            <AndamioText className="font-medium">
                              {state === "fetching" && "Preparing transaction..."}
                              {state === "signing" && "Please sign in your wallet"}
                              {state === "submitting" && "Submitting to blockchain..."}
                              {state === "error" && "Transaction failed"}
                            </AndamioText>
                            {error && (
                              <AndamioText variant="small" className="text-destructive">
                                {error.message}
                              </AndamioText>
                            )}
                          </div>
                        </div>
                        {state === "error" && (
                          <AndamioButton
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={() => reset()}
                          >
                            Try Again
                          </AndamioButton>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-6">
                      <AndamioButton
                        variant="outline"
                        className="flex-1"
                        onClick={onCancel}
                        disabled={state !== "idle" && state !== "error"}
                      >
                        Cancel
                      </AndamioButton>
                      <AndamioButton
                        className="flex-1"
                        onClick={handleCreateCourse}
                        disabled={!canCreate || (state !== "idle" && state !== "error")}
                      >
                        {state === "idle" || state === "error" ? (
                          <>
                            <AddIcon className="h-4 w-4 mr-2" />
                            Mint Course NFT
                          </>
                        ) : (
                          <>
                            <LoadingIcon className="h-4 w-4 mr-2 animate-spin" />
                            {state === "fetching" && "Preparing..."}
                            {state === "signing" && "Sign in Wallet"}
                            {state === "submitting" && "Minting..."}
                          </>
                        )}
                      </AndamioButton>
                    </div>
                  </div>
                )}

                {/* Waiting for Confirmation */}
                {isWaitingForConfirmation && (
                  <div className="rounded-sm border bg-muted/30 p-6 text-center">
                    <LoadingIcon className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                    <AndamioText className="font-medium mb-1">
                      Confirming on blockchain...
                    </AndamioText>
                    <AndamioText variant="small" className="text-muted-foreground">
                      {txStatus?.state === "pending" && "Waiting for block confirmation"}
                      {txStatus?.state === "confirmed" && "Registering course..."}
                      {!txStatus && "Registering transaction..."}
                    </AndamioText>
                    {courseMetadata && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <AndamioText variant="small" className="text-muted-foreground">
                          Creating &quot;{courseMetadata.title}&quot;
                        </AndamioText>
                      </div>
                    )}
                  </div>
                )}
              </AndamioCardContent>
            </AndamioCard>
          </div>
        </div>
      </AndamioScrollArea>
    </div>
  );
}

// =============================================================================
// Create Project Panel (Inline)
// =============================================================================

interface CreateProjectPanelProps {
  onCancel: () => void;
  onSuccess: (projectId: string) => void;
  onCreateCourseForProject: (title: string) => void;
}

function CreateProjectPanel({ onCancel, onSuccess, onCreateCourseForProject }: CreateProjectPanelProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Read and consume pending project title from sessionStorage
  const [initialTitle] = useState(() => {
    const stored = pendingProject.get();
    if (stored) {
      pendingProject.clear();
    }
    return stored ?? undefined;
  });

  return (
    <div className="h-full overflow-hidden bg-gradient-to-br from-background via-background to-secondary/5">
      <AndamioScrollArea className="h-full">
        <div className="p-8 pb-16">
          <div className="max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-5xl w-full mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10">
                  <ProjectIcon className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <AndamioHeading level={2} size="3xl" className="mb-1">
                    {isConfirmed ? "Project Created" : "Create Project"}
                  </AndamioHeading>
                  <AndamioText variant="small" className="text-muted-foreground">
                    {isConfirmed ? "Your project is live on-chain" : "Mint a Project NFT on Cardano"}
                  </AndamioText>
                </div>
              </div>
              {!isConfirmed && (
                <AndamioButton variant="ghost" size="sm" onClick={onCancel}>
                  Cancel
                </AndamioButton>
              )}
            </div>

            {/* Create Project Component */}
            <CreateProject
              onSuccess={onSuccess}
              onConfirmed={() => setIsConfirmed(true)}
              initialTitle={initialTitle}
              onCreateCourseForProject={onCreateCourseForProject}
            />
          </div>
        </div>
      </AndamioScrollArea>
    </div>
  );
}
