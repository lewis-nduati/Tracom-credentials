import { useParams } from "next/navigation";

/**
 * Typed params hook for course route tree
 *
 * Centralizes the `as string` casts for course route params.
 * All params are guaranteed to be strings for non-catch-all routes in Next.js.
 */
export function useCourseParams() {
  const params = useParams();

  return {
    courseId: params.coursenft as string,
    moduleCode: params.modulecode as string | undefined,
    moduleIndex: params.moduleindex
      ? parseInt(params.moduleindex as string)
      : undefined,
  };
}
