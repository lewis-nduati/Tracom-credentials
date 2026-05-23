/**
 * React Query hooks for Course Module API endpoints
 *
 * Provides cached, deduplicated access to course module data.
 *
 * Architecture: Colocated Types Pattern
 * - App-level types (CourseModule) defined here with camelCase fields
 * - Transform functions convert API snake_case to app camelCase
 * - Components import types from this hook, never from generated types
 *
 * @example
 * ```tsx
 * import { useCourseModules, type CourseModule } from "~/hooks/api/course/use-course-module";
 *
 * function ModuleList({ courseId }: { courseId: string }) {
 *   const { data: modules } = useCourseModules(courseId);
 *   return modules?.map(m => <div key={m.sltHash}>{m.title}</div>);
 * }
 * ```
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
// Import directly from gateway.ts to avoid circular dependency with ~/types/generated
import type {
  MergedCourseModuleItem,
  MergedCourseModulesResponse,
  RegisterModuleResponse,
} from "~/types/generated/gateway";

import type { JSONContent } from "@tiptap/core";
import { courseKeys } from "./use-course";
import { GATEWAY_API_BASE } from "~/lib/api-utils";
import { isJSONContent } from "~/lib/assignment-status";

// =============================================================================
// App-Level Types (exported for components)
// =============================================================================

/**
 * Lifecycle status for a course module
 * - "draft": DB only, Teacher editing, SLTs can change
 * - "approved": DB only, SLTs locked, sltHash stored, ready for TX
 * - "pending_tx": TX submitted but not confirmed
 * - "active": On-chain + DB (merged)
 * - "unregistered": On-chain only, needs DB registration
 */
export type CourseModuleStatus =
  | "draft"
  | "approved"
  | "pending_tx"
  | "active"
  | "unregistered";

/**
 * Derive semantic status from API source and module_status fields
 *
 * API source values: "merged", "chain_only", "db_only"
 * API module_status values: "DRAFT", "APPROVED", "PENDING_TX"
 *
 * Status derivation logic:
 * | source     | module_status | → status      |
 * |------------|---------------|---------------|
 * | chain_only | *             | unregistered  |
 * | merged     | *             | active        |
 * | db_only    | DRAFT         | draft         |
 * | db_only    | APPROVED      | approved      |
 * | db_only    | PENDING_TX    | pending_tx    |
 */
function getModuleStatus(
  source: string | undefined,
  moduleStatus: string | undefined
): CourseModuleStatus {
  // Chain-only modules need DB registration
  if (source === "chain_only") {
    return "unregistered";
  }

  // Merged modules are fully active
  if (source === "merged") {
    return "active";
  }

  // DB-only modules: derive from module_status
  switch (moduleStatus?.toUpperCase()) {
    case "APPROVED":
      return "approved";
    case "PENDING_TX":
      return "pending_tx";
    case "DRAFT":
    default:
      return "draft";
  }
}

/**
 * App-level SLT (Student Learning Target) type with camelCase fields
 */
export interface SLT {
  id?: number;
  sltId?: string;
  sltText?: string;
  moduleIndex?: number;
  moduleCode?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  /** Whether this SLT has an associated lesson (V2 API) */
  hasLesson?: boolean;
  // Nested lesson data (populated by some endpoints)
  lesson?: Lesson | null;
}

/**
 * App-level Lesson type with camelCase fields
 */
export interface Lesson {
  id?: number;
  contentJson?: JSONContent | null;
  sltId?: string;
  sltIndex?: number;
  moduleCode?: string;
  createdAt?: string;
  updatedAt?: string;
  title?: string;
  description?: string;
  isLive?: boolean;
  imageUrl?: string;
  videoUrl?: string;
}

/**
 * App-level Assignment type with camelCase fields
 *
 * Represents a module assignment (practice exercise for students).
 * Content is stored as TipTap JSON.
 */
export interface Assignment {
  id?: number;
  title?: string;
  description?: string;
  contentJson?: JSONContent | null;
  moduleCode?: string;
  imageUrl?: string;
  videoUrl?: string;
  isLive?: boolean;
  createdByAlias?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * App-level Introduction type with camelCase fields
 *
 * Represents a module introduction (overview content for students).
 * Content is stored as TipTap JSON.
 */
export interface Introduction {
  id?: number;
  title?: string;
  description?: string;
  contentJson?: JSONContent | null;
  moduleCode?: string;
  imageUrl?: string;
  videoUrl?: string;
  isLive?: boolean;
  createdByAlias?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * App-level CourseModule type with camelCase fields
 *
 * Combines on-chain fields (sltHash, prerequisites, onChainSlts)
 * with off-chain content fields (title, description, slts, etc.)
 */
export interface CourseModule {
  // Primary identifier (on-chain slts_hash / DB slt_hash)
  sltHash: string;

  // Course context
  courseId: string;

  // On-chain fields
  createdBy?: string;
  prerequisites?: string[];
  onChainSlts?: string[];

  // Lifecycle status (derived from API source + module_status fields)
  status: CourseModuleStatus;

  // Content fields (flattened from content.*)
  moduleCode?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  isLive?: boolean;
  slts?: SLT[];
  assignment?: Assignment | null;
  introduction?: Introduction | null;
}

/**
 * Input for creating a course module
 */
export interface CreateCourseModuleInput {
  moduleCode: string;
  title: string;
  description?: string;
}

// =============================================================================
// Transform Functions
// =============================================================================

/**
 * Transform raw API SLT to app-level SLT type
 * Exported for use in use-slt.ts
 *
 * Handles both V1 format (module_index) and V2 format (slt_index, has_lesson).
 */
export function transformSLT(raw: Record<string, unknown>): SLT {
  // V2 API uses slt_index, V1 used module_index
  const moduleIndex = (raw.slt_index ?? raw.module_index) as number | undefined;

  // V2 API includes has_lesson and nested lesson object
  const hasLesson = raw.has_lesson as boolean | undefined;
  const lessonData = raw.lesson as Record<string, unknown> | null | undefined;

  return {
    id: raw.id as number | undefined,
    sltId: raw.slt_id as string | undefined,
    sltText: raw.slt_text as string | undefined,
    moduleIndex,
    moduleCode: raw.course_module_code as string | undefined,
    createdAt: raw.created_at as string | undefined,
    updatedAt: raw.updated_at as string | undefined,
    createdBy: raw.created_by as string | undefined,
    hasLesson,
    lesson: lessonData ? transformLesson(lessonData) : null,
  };
}

/**
 * Transform raw API Lesson to app-level Lesson type
 * Exported for use in use-lesson.ts
 *
 * Handles both V1 format (flat) and V2 format (nested under `content`).
 */
export function transformLesson(raw: Record<string, unknown>): Lesson {
  // V2 API nests content fields under `content` object
  const content = raw.content as Record<string, unknown> | undefined;

  // Support both flat (V1) and nested (V2) formats
  const title = (content?.title ?? raw.title) as string | undefined;
  const description = (content?.description ?? raw.description) as string | undefined;
  const imageUrl = (content?.image_url ?? raw.image_url) as string | undefined;
  const videoUrl = (content?.video_url ?? raw.video_url) as string | undefined;
  const rawContentJson = content?.content_json ?? raw.lesson_content ?? raw.content_json;
  const contentJson = isJSONContent(rawContentJson) ? rawContentJson : null;

  return {
    id: raw.id as number | undefined,
    contentJson,
    sltId: raw.slt_id as string | undefined,
    sltIndex: raw.slt_index as number | undefined,
    moduleCode: raw.course_module_code as string | undefined,
    createdAt: raw.created_at as string | undefined,
    updatedAt: raw.updated_at as string | undefined,
    title,
    description,
    isLive: raw.is_live as boolean | undefined,
    imageUrl,
    videoUrl,
  };
}

/**
 * Transform raw API Assignment to app-level Assignment type
 * Exported for potential use in dedicated assignment hooks
 *
 * Handles both V1 format (flat) and V2 format (nested under `content`).
 */
export function transformAssignment(raw: Record<string, unknown>): Assignment {
  // Handle NullableString fields (object type in API)
  const getStringField = (field: unknown): string | undefined => {
    if (typeof field === "string") return field;
    if (field && typeof field === "object" && "String" in field) {
      return (field as { String?: string }).String;
    }
    return undefined;
  };

  // V2 API nests content fields under `content` object
  const content = raw.content as Record<string, unknown> | undefined;

  // Support both flat (V1) and nested (V2) formats
  const title = getStringField(content?.title ?? raw.title);
  const description = getStringField(content?.description ?? raw.description);
  const imageUrl = getStringField(content?.image_url ?? raw.image_url);
  const videoUrl = getStringField(content?.video_url ?? raw.video_url);
  const rawContentJson = content?.content_json ?? raw.assignment_content ?? raw.content_json;
  const contentJson = isJSONContent(rawContentJson) ? rawContentJson : null;

  // V2 API has created_by at top level (on-chain creator alias)
  const createdByAlias = (raw.created_by ?? raw.created_by_alias) as string | undefined;

  return {
    id: raw.id as number | undefined,
    title,
    description,
    contentJson,
    moduleCode: raw.course_module_code as string | undefined,
    imageUrl,
    videoUrl,
    isLive: raw.is_live as boolean | undefined,
    createdByAlias,
    createdAt: raw.created_at as string | undefined,
    updatedAt: raw.updated_at as string | undefined,
  };
}

/**
 * Transform raw API Introduction to app-level Introduction type
 * Exported for potential use in dedicated introduction hooks
 *
 * Handles both V1 format (flat) and V2 format (nested under `content`).
 */
export function transformIntroduction(raw: Record<string, unknown>): Introduction {
  // V2 API nests content fields under `content` object
  const content = raw.content as Record<string, unknown> | undefined;

  // Support both flat (V1) and nested (V2) formats
  const title = (content?.title ?? raw.title) as string | undefined;
  const description = (content?.description ?? raw.description) as string | undefined;
  const imageUrl = (content?.image_url ?? raw.image_url) as string | undefined;
  const videoUrl = (content?.video_url ?? raw.video_url) as string | undefined;
  const rawContentJson = content?.content_json ?? raw.introduction_content ?? raw.content_json;
  const contentJson = isJSONContent(rawContentJson) ? rawContentJson : null;

  // V2 API has created_by at top level (on-chain creator alias)
  const createdByAlias = (raw.created_by ?? raw.created_by_alias) as string | undefined;

  return {
    id: raw.id as number | undefined,
    title,
    description,
    contentJson,
    moduleCode: raw.course_module_code as string | undefined,
    imageUrl,
    videoUrl,
    isLive: raw.is_live as boolean | undefined,
    createdByAlias,
    createdAt: raw.created_at as string | undefined,
    updatedAt: raw.updated_at as string | undefined,
  };
}

/**
 * Transform API response to app-level CourseModule type
 * Handles snake_case → camelCase conversion and field flattening
 *
 * For chain_only modules (no DB content), uses on_chain_slts for display:
 * - title: First SLT text or "Untitled Module"
 * - slts: Converted from on_chain_slts array
 */
export function transformCourseModule(item: MergedCourseModuleItem): CourseModule {
  const isChainOnly = item.source === "chain_only" || !item.content;

  // Transform nested entities if present (merged modules only)
  const rawSlts = item.content?.slts as Record<string, unknown>[] | undefined;
  const dbSlts = rawSlts?.map(transformSLT);

  // For chain_only modules, convert on_chain_slts strings to SLT objects
  const chainSlts: SLT[] | undefined = item.on_chain_slts?.map((text, index) => ({
    sltText: text,
    moduleIndex: index + 1,
  }));

  // Use DB SLTs if available, otherwise chain SLTs
  const slts = dbSlts && dbSlts.length > 0 ? dbSlts : chainSlts;

  const rawAssignment = item.content?.assignment as Record<string, unknown> | undefined;
  const assignment = rawAssignment ? transformAssignment(rawAssignment) : null;

  const rawIntroduction = item.content?.introduction as Record<string, unknown> | undefined;
  const introduction = rawIntroduction ? transformIntroduction(rawIntroduction) : null;

  // For chain_only modules, derive title from first SLT
  const chainTitle = item.on_chain_slts?.[0]
    ? `Module: ${item.on_chain_slts[0].slice(0, 50)}${item.on_chain_slts[0].length > 50 ? "..." : ""}`
    : undefined;

  return {
    // On-chain fields
    sltHash: item.slt_hash ?? "",
    courseId: item.course_id ?? "",
    createdBy: item.created_by,
    prerequisites: item.prerequisites,
    onChainSlts: item.on_chain_slts,

    // Lifecycle status (derived from API source + module_status fields)
    status: getModuleStatus(item.source, item.content?.module_status),

    // Flattened content fields (with chain_only fallbacks)
    moduleCode: item.content?.course_module_code,
    title: item.content?.title ?? chainTitle,
    description: item.content?.description,
    imageUrl: item.content?.image_url,
    videoUrl: item.content?.video_url,
    isLive: isChainOnly ? true : item.content?.is_live, // chain_only = published = live
    slts,
    assignment,
    introduction,
  };
}

// =============================================================================
// Sort Helper
// =============================================================================

/**
 * Sort course modules alphabetically by moduleCode (ascending).
 * Modules without moduleCode (chain_only) are sorted to the end by sltHash.
 */
function sortModulesByCode<T extends { moduleCode?: string; sltHash?: string }>(
  modules: T[]
): T[] {
  return [...modules].sort((a, b) => {
    // Modules with moduleCode come first
    if (a.moduleCode && !b.moduleCode) return -1;
    if (!a.moduleCode && b.moduleCode) return 1;

    // Both have moduleCode - sort alphabetically
    if (a.moduleCode && b.moduleCode) {
      return a.moduleCode.localeCompare(b.moduleCode);
    }

    // Neither has moduleCode - sort by sltHash as fallback
    return (a.sltHash ?? "").localeCompare(b.sltHash ?? "");
  });
}

// =============================================================================
// Query Keys
// =============================================================================

export const courseModuleKeys = {
  all: ["courseModules"] as const,
  lists: () => [...courseModuleKeys.all, "list"] as const,
  list: (courseId: string) =>
    [...courseModuleKeys.lists(), courseId] as const,
  teacherLists: () => [...courseModuleKeys.all, "teacherList"] as const,
  teacherList: (courseId: string) =>
    [...courseModuleKeys.teacherLists(), courseId] as const,
  details: () => [...courseModuleKeys.all, "detail"] as const,
  detail: (courseId: string, moduleCode: string) =>
    [...courseModuleKeys.details(), courseId, moduleCode] as const,
  map: (courseIds: string[]) =>
    [...courseModuleKeys.all, "map", courseIds.sort().join(",")] as const,
};

// Note: assignmentKeys, introductionKeys, sltKeys, lessonKeys are defined in use-course-content.ts

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch all modules for a course (public endpoint)
 *
 * Uses the user endpoint which does not require authentication.
 * Returns app-level CourseModule types with camelCase fields.
 *
 * @example
 * ```tsx
 * function ModuleList({ courseId }: { courseId: string }) {
 *   const { data: modules, isLoading } = useCourseModules(courseId);
 *
 *   if (isLoading) return <Skeleton />;
 *   return modules?.map(m => <ModuleCard key={m.moduleCode} module={m} />);
 * }
 * ```
 */
export function useCourseModules(courseId: string | undefined) {
  return useQuery({
    queryKey: courseModuleKeys.list(courseId ?? ""),
    queryFn: async (): Promise<CourseModule[]> => {
      // Endpoint: GET /course/user/modules/{course_id}
      const response = await fetch(
        `${GATEWAY_API_BASE}/course/user/modules/${courseId}`
      );

      // 404 means no modules yet - return empty array
      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch modules: ${response.statusText}`);
      }

      const result = await response.json() as MergedCourseModulesResponse;

      // Log warning if partial data returned
      if (result.meta?.warning) {
        console.warn("[useCourseModules] API warning:", result.meta?.warning);
      }

      // Transform to app-level types and sort by moduleCode alphabetically
      const modules = (result.data ?? []).map(transformCourseModule);
      return sortModulesByCode(modules);
    },
    enabled: !!courseId,
    staleTime: 60_000,
  });
}

/**
 * Fetch all modules for a course as a teacher (merged endpoint)
 *
 * Uses the merged teacher endpoint which returns UNION of on-chain and DB modules.
 * This gives teachers visibility into all module lifecycle states:
 * - `draft`: Teacher editing, SLTs can change
 * - `approved`: SLTs locked, ready for TX
 * - `pending_tx`: TX submitted but not confirmed
 * - `active`: On-chain + DB (merged)
 * - `unregistered`: On-chain only, needs DB registration
 *
 * @example
 * ```tsx
 * function StudioModuleList({ courseId }: { courseId: string }) {
 *   const { data: modules, isLoading } = useTeacherCourseModules(courseId);
 *
 *   if (isLoading) return <Skeleton />;
 *   return modules?.map(m => (
 *     <ModuleEditor
 *       key={m.moduleCode ?? m.sltHash}
 *       module={m}
 *       needsContent={m.status === "unregistered"}
 *     />
 *   ));
 * }
 * ```
 */
export function useTeacherCourseModules(courseId: string | undefined) {
  const { authenticatedFetch, isAuthenticated } = useAndamioAuth();

  return useQuery({
    queryKey: courseModuleKeys.teacherList(courseId ?? ""),
    queryFn: async (): Promise<CourseModule[]> => {
      // Endpoint: POST /api/v2/course/teacher/course-modules/list
      // Returns UNION of on-chain and DB modules with source indicator
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/course/teacher/course-modules/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_id: courseId }),
        }
      );

      // 404 means no modules yet - return empty array
      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch teacher modules: ${response.statusText}`);
      }

      const result = await response.json() as MergedCourseModulesResponse;

      // Log warning if partial data returned
      if (result.meta?.warning) {
        console.warn("[useTeacherCourseModules] API warning:", result.meta?.warning);
      }

      // Transform to app-level types and sort by moduleCode alphabetically
      const modules = (result.data ?? []).map(transformCourseModule);

      return sortModulesByCode(modules);
    },
    enabled: !!courseId && isAuthenticated,
    staleTime: 60_000,
    // Keep previous data visible during refetch to prevent UI flicker
    placeholderData: keepPreviousData,
  });
}

/**
 * Fetch a single module by course and module code (public endpoint)
 *
 * NOTE: The single-module GET endpoint was removed in V2.
 * This now fetches the module list and filters client-side.
 * Returns app-level CourseModule type with camelCase fields.
 *
 * @example
 * ```tsx
 * function ModuleDetail({ courseId, moduleCode }: Props) {
 *   const { data: courseModule, isLoading } = useCourseModule(courseId, moduleCode);
 *
 *   if (isLoading) return <PageLoading />;
 *   if (!courseModule) return <NotFound />;
 *
 *   return <ModuleContent module={courseModule} />;
 * }
 * ```
 */
export function useCourseModule(
  courseId: string | undefined,
  moduleCode: string | undefined
) {
  return useQuery({
    queryKey: courseModuleKeys.detail(courseId ?? "", moduleCode ?? ""),
    queryFn: async (): Promise<CourseModule | null> => {
      // Endpoint: GET /course/user/modules/{course_id}
      // Fetch list and filter client-side
      const response = await fetch(
        `${GATEWAY_API_BASE}/course/user/modules/${courseId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch modules: ${response.statusText}`);
      }

      const result = await response.json() as MergedCourseModulesResponse;

      // Transform to app-level types
      const modules = (result.data ?? []).map(transformCourseModule);
      const courseModule = modules.find((m) => m.moduleCode === moduleCode);

      if (!courseModule) {
        return null;
      }

      return courseModule;
    },
    enabled: !!courseId && !!moduleCode,
  });
}

/**
 * Simplified module info for batch lookups
 */
export interface CourseModuleSummary {
  moduleCode: string;
  title: string;
}

/**
 * Batch fetch modules for multiple courses by course ID
 *
 * Used for dashboard views showing module counts across courses.
 * Uses POST /course/teacher/modules/list endpoint.
 *
 * @example
 * ```tsx
 * function CourseCards({ courseIds }: { courseIds: string[] }) {
 *   const { data: moduleMap } = useCourseModuleMap(courseIds);
 *
 *   return courseIds.map(id => (
 *     <CourseCard
 *       key={id}
 *       moduleCount={moduleMap?.[id]?.length ?? 0}
 *     />
 *   ));
 * }
 * ```
 */
export function useCourseModuleMap(courseIds: string[]) {
  const { authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: courseModuleKeys.map(courseIds),
    queryFn: async (): Promise<Record<string, CourseModuleSummary[]>> => {
      // Endpoint: POST /course/teacher/modules/list - returns modules grouped by course ID
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/course/teacher/modules/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_ids: courseIds }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch module map: ${response.statusText}`);
      }

      const raw = await response.json() as Record<
        string,
        Array<{ course_module_code: string; title: string }>
      >;

      // Transform to camelCase and sort by moduleCode alphabetically
      const result: Record<string, CourseModuleSummary[]> = {};
      for (const [courseId, modules] of Object.entries(raw)) {
        const transformed = modules.map((m) => ({
          moduleCode: m.course_module_code,
          title: m.title,
        }));
        // Sort by moduleCode alphabetically
        result[courseId] = transformed.sort((a, b) =>
          a.moduleCode.localeCompare(b.moduleCode)
        );
      }
      return result;
    },
    enabled: courseIds.length > 0,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Create a new course module
 *
 * @example
 * ```tsx
 * function CreateModuleForm({ courseId }: { courseId: string }) {
 *   const createModule = useCreateCourseModule();
 *
 *   const handleSubmit = async (data: CreateCourseModuleInput) => {
 *     await createModule.mutateAsync({
 *       courseId,
 *       ...data,
 *     });
 *     toast.success("Module created!");
 *   };
 *
 *   return <ModuleForm onSubmit={handleSubmit} isLoading={createModule.isPending} />;
 * }
 * ```
 */
export function useCreateCourseModule() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async (
      input: { courseId: string; moduleCode: string; title: string; description?: string }
    ) => {
      // Endpoint: POST /course/teacher/course-module/create
      // API expects "course_id" and "course_module_code"
      const { courseId, moduleCode, ...rest } = input;
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/course/teacher/course-module/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseId,
            course_module_code: moduleCode,
            ...rest,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create module: ${response.statusText} - ${errorText}`);
      }

      // Response consumed but not returned - cache invalidation triggers refetch
      await response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate the module list for this course (public endpoint)
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.list(variables.courseId),
      });
      // Invalidate the teacher module list (authenticated endpoint)
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.teacherList(variables.courseId),
      });
      // Also invalidate the course detail to update module counts
      void queryClient.invalidateQueries({
        queryKey: courseKeys.detail(variables.courseId),
      });
    },
  });
}

/**
 * Update a course module
 */
export function useUpdateCourseModule() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      courseId,
      moduleCode,
      data,
    }: {
      courseId: string;
      moduleCode: string;
      data: Partial<{ title: string; description: string }>;
    }) => {
      // Endpoint: POST /course/teacher/course-module/update
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/course/teacher/course-module/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseId,
            course_module_code: moduleCode,
            ...data,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update module: ${response.statusText}`);
      }

      // Response consumed but not returned - cache invalidation triggers refetch
      await response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific module
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.detail(
          variables.courseId,
          variables.moduleCode
        ),
      });
      // Invalidate the module list (public endpoint)
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.list(variables.courseId),
      });
      // Invalidate the teacher module list (authenticated endpoint)
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.teacherList(variables.courseId),
      });
    },
  });
}

/**
 * Update course module status
 *
 * When setting status to "APPROVED", the sltHash is required.
 * The sltHash should be computed from the module's SLTs using computeSltHash().
 *
 * @example
 * ```tsx
 * const updateStatus = useUpdateCourseModuleStatus();
 *
 * // Approve a module (requires sltHash)
 * await updateStatus.mutateAsync({
 *   courseId: "...",
 *   moduleCode: "101",
 *   status: "APPROVED",
 *   sltHash: computeSltHash(slts),
 * });
 *
 * // Revert to draft (no sltHash needed)
 * await updateStatus.mutateAsync({
 *   courseId: "...",
 *   moduleCode: "101",
 *   status: "DRAFT",
 * });
 * ```
 */
export function useUpdateCourseModuleStatus() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      courseId,
      moduleCode,
      status,
      sltHash,
    }: {
      courseId: string;
      moduleCode: string;
      status: "DRAFT" | "APPROVED";
      /** Required when status is "APPROVED" */
      sltHash?: string;
    }) => {
      // Use dedicated update-status endpoint for bidirectional status changes
      // This endpoint supports both DRAFT → APPROVED and APPROVED → DRAFT
      const body: Record<string, string> = {
        course_id: courseId,
        course_module_code: moduleCode,
        status,
      };

      // Include slt_hash when approving (required by API)
      if (sltHash) {
        body.slt_hash = sltHash;
      }

      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/course/teacher/course-module/update-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errorData = await response.json() as { message?: string; error?: string };
        throw new Error(errorData.message ?? errorData.error ?? `Failed to update module status: ${response.statusText}`);
      }

      // Response consumed but not returned - cache invalidation triggers refetch
      await response.json();
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.detail(
          variables.courseId,
          variables.moduleCode
        ),
      });
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.list(variables.courseId),
      });
      // Invalidate the teacher module list (authenticated endpoint)
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.teacherList(variables.courseId),
      });
    },
  });
}

// =============================================================================
// Delete Course Module
// =============================================================================

/**
 * Delete a course module
 *
 * Permanently removes a course module from the database.
 * Only works for modules that are not on-chain (DRAFT status).
 *
 * Automatically invalidates course module caches on success.
 *
 * @example
 * ```tsx
 * function DeleteModuleButton({ courseId, moduleCode }: Props) {
 *   const deleteModule = useDeleteCourseModule();
 *
 *   const handleDelete = async () => {
 *     if (confirm("Are you sure?")) {
 *       await deleteModule.mutateAsync({ courseId, moduleCode });
 *     }
 *   };
 *
 *   return <Button onClick={handleDelete} variant="destructive">Delete</Button>;
 * }
 * ```
 */
export function useDeleteCourseModule() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      courseId,
      moduleCode,
    }: {
      courseId: string;
      moduleCode: string;
    }) => {
      // Endpoint: POST /course/teacher/course-module/delete
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/course/teacher/course-module/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseId,
            course_module_code: moduleCode,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(errorData.message ?? `Failed to delete module: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Remove the specific module from cache
      queryClient.removeQueries({
        queryKey: courseModuleKeys.detail(
          variables.courseId,
          variables.moduleCode
        ),
      });
      // Invalidate the list (public endpoint)
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.list(variables.courseId),
      });
      // Invalidate the teacher module list (authenticated endpoint)
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.teacherList(variables.courseId),
      });
    },
  });
}

// =============================================================================
// Register Course Module (On-Chain → Database)
// =============================================================================

/**
 * Input for registering an on-chain module in the database
 */
export interface RegisterCourseModuleInput {
  /** Course policy ID (course_id) */
  courseId: string;
  /** Module code to assign to the registered module */
  moduleCode: string;
  /** On-chain SLT hash (identifies the module on-chain) */
  sltHash: string;
}

/**
 * Response from registering a module
 */
export interface RegisteredModule {
  courseId: string;
  moduleCode: string;
  sltHash: string;
  /** Status after registration (should be "APPROVED") */
  moduleStatus: string;
  /** Number of SLTs created in database */
  sltCount: number;
  /** Source after registration (should be "merged") */
  source: string;
  /** The SLTs that were registered */
  slts: Array<{
    sltIndex: number;
    sltText: string;
  }>;
}

/**
 * WORKAROUND: API spec has recursive bug (RegisterModuleResponse.data: RegisterModuleResponse)
 * These interfaces define the actual shape of the response.
 * TODO: Remove when API spec is fixed (see gateway.ts RegisterModuleResponse)
 */
interface RegisterModuleResponseData {
  course_id?: string;
  course_module_code?: string;
  slt_hash?: string;
  module_status?: string;
  slt_count?: number;
  source?: string;
  slts?: Array<{
    slt_index?: number;
    slt_text?: string;
  }>;
}

interface RegisterModuleResponseWorkaround {
  data?: RegisterModuleResponseData;
  meta?: { warning?: string };
}

/**
 * Transform API response to RegisteredModule type
 */
function transformRegisteredModule(
  data: RegisterModuleResponseData | undefined
): RegisteredModule | null {
  if (!data) return null;
  return {
    courseId: data.course_id ?? "",
    moduleCode: data.course_module_code ?? "",
    sltHash: data.slt_hash ?? "",
    moduleStatus: data.module_status ?? "",
    sltCount: data.slt_count ?? 0,
    source: data.source ?? "",
    slts: (data.slts ?? []).map((s) => ({
      sltIndex: s.slt_index ?? 0,
      sltText: s.slt_text ?? "",
    })),
  };
}

/**
 * Register an on-chain module in the database
 *
 * This mutation takes an on-chain module (identified by its sltHash) and creates
 * the corresponding database records. The API fetches the on-chain SLT data
 * and creates the module + SLT records in the database.
 *
 * Use case: When a teacher sees an "unregistered" module (on-chain only) and wants
 * to add content (lessons, assignments) to it, they first need to register it.
 *
 * @example
 * ```tsx
 * function RegisterModuleButton({ courseId, sltHash }: Props) {
 *   const [moduleCode, setModuleCode] = useState("");
 *   const registerModule = useRegisterCourseModule();
 *
 *   const handleRegister = async () => {
 *     const result = await registerModule.mutateAsync({
 *       courseId,
 *       moduleCode,
 *       sltHash,
 *     });
 *     toast.success(`Registered module with ${result?.sltCount} SLTs`);
 *   };
 *
 *   return (
 *     <div>
 *       <Input value={moduleCode} onChange={e => setModuleCode(e.target.value)} />
 *       <Button onClick={handleRegister} disabled={registerModule.isPending}>
 *         Register Module
 *       </Button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRegisterCourseModule() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async (
      input: RegisterCourseModuleInput
    ): Promise<RegisteredModule | null> => {
      // Endpoint: POST /api/v2/course/teacher/course-module/register
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/course/teacher/course-module/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: input.courseId,
            course_module_code: input.moduleCode,
            slt_hash: input.sltHash,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to register module: ${response.statusText} - ${errorText}`
        );
      }

      const result = (await response.json()) as RegisterModuleResponseWorkaround;
      return transformRegisteredModule(result.data);
    },
    onSuccess: (_, variables) => {
      // Invalidate the module list for this course (public endpoint)
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.list(variables.courseId),
      });
      // Invalidate the teacher module list (authenticated endpoint)
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.teacherList(variables.courseId),
      });
      // Also invalidate the course detail to update module state
      void queryClient.invalidateQueries({
        queryKey: courseKeys.detail(variables.courseId),
      });
    },
  });
}

// =============================================================================
// Note: useAssignment query hook has been moved to use-assignment.ts
// =============================================================================
