"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { SuccessIcon, LoadingIcon } from "~/components/icons";
import { useUpdateCourse } from "~/hooks/api";
import { toast } from "sonner";
import { pendingProject } from "~/lib/pending-project";

interface ReturnToProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  isPublic: boolean;
}

export function ReturnToProjectDialog({
  open,
  onOpenChange,
  courseId,
  isPublic,
}: ReturnToProjectDialogProps) {
  const router = useRouter();
  const updateCourse = useUpdateCourse();
  const [title, setTitle] = useState<string | null>(null);

  useEffect(() => {
    setTitle(pendingProject.get());
  }, [open]);

  if (!title) return null;

  const handleToggleVisibility = async () => {
    try {
      await updateCourse.mutateAsync({
        courseId,
        data: { isPublic: !isPublic },
      });
      toast.success(!isPublic ? "Course is now public" : "Course is now private");
    } catch (err) {
      toast.error("Failed to update visibility", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  const handleReturn = () => {
    router.push("/studio?create=project");
    onOpenChange(false);
  };

  const handleStay = () => {
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <SuccessIcon className="h-5 w-5 text-success" />
            Module minted!
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <AndamioText variant="muted" className="text-sm">
                Ready to finish creating your project <span className="font-semibold">&ldquo;{title}&rdquo;</span>?
              </AndamioText>

              {/* Course visibility toggle */}
              <div className="rounded-sm border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <AndamioText className="text-sm font-medium">Course visibility</AndamioText>
                  <div className="flex items-center gap-2">
                    <AndamioBadge variant={isPublic ? "default" : "outline"}>
                      {isPublic ? "Public" : "Private"}
                    </AndamioBadge>
                    <AndamioButton
                      variant="outline"
                      size="sm"
                      onClick={() => void handleToggleVisibility()}
                      disabled={updateCourse.isPending}
                    >
                      {updateCourse.isPending ? (
                        <LoadingIcon className="h-3 w-3 animate-spin" />
                      ) : isPublic ? (
                        "Make Private"
                      ) : (
                        "Make Public"
                      )}
                    </AndamioButton>
                  </div>
                </div>
                <AndamioText variant="small" className="text-muted-foreground">
                  Only public course modules appear as project prerequisites.
                </AndamioText>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AndamioButton variant="ghost" onClick={handleStay}>
            Stay Here
          </AndamioButton>
          <AndamioButton onClick={handleReturn}>
            Return to Project Creation
          </AndamioButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
