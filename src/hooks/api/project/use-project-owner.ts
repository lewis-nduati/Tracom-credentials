/**
 * React Query hooks for Owner Project API endpoints
 *
 * Owner hooks handle project management operations:
 * - Listing owned projects
 * - Creating, updating, deleting projects
 * - Registering on-chain projects with off-chain metadata
 *
 * Architecture: Role-based hook file
 * - Imports types and transforms from use-project.ts (entity file)
 * - Exports owner-specific query keys and hooks
 *
 * @example
 * ```tsx
 * import { useOwnerProjects, useUpdateProject } from "~/hooks/api/project/use-project-owner";
 *
 * function ProjectStudio() {
 *   const { data: projects, isLoading } = useOwnerProjects();
 *   const updateProject = useUpdateProject();
 *
 *   return projects?.map(project => (
 *     <ProjectCard key={project.projectId} project={project} />
 *   ));
 * }
 * ```
 */

import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import type {
  MergedProjectsResponse,
  MergedProjectListItem,
} from "~/types/generated/gateway";
import {
  projectKeys,
  transformProjectListItem,
  type Project,
} from "./use-project";
import { GATEWAY_API_BASE } from "~/lib/api-utils";
import { projectManagerKeys } from "./use-project-manager";

// =============================================================================
// Query Keys
// =============================================================================

/**
 * Query keys for owner project operations
 * Extends the base projectKeys for cache invalidation
 */
export const ownerProjectKeys = {
  all: ["owner-projects"] as const,
  list: () => [...ownerProjectKeys.all, "list"] as const,
};

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch projects owned by the authenticated user
 *
 * Requires authentication. Automatically skips query if user is not authenticated.
 *
 * @example
 * ```tsx
 * function MyProjectsPage() {
 *   const { data: projects, isLoading, error } = useOwnerProjects();
 *
 *   if (isLoading) return <PageLoading />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *   if (!projects?.length) return <EmptyState title="No projects yet" />;
 *
 *   return <ProjectList projects={projects} />;
 * }
 * ```
 */
export function useOwnerProjects() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: ownerProjectKeys.list(),
    queryFn: async (): Promise<Project[]> => {
      // Endpoint: POST /project/owner/projects/list
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/project/owner/projects/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch owned projects: ${response.statusText}`);
      }

      const result = (await response.json()) as
        | MergedProjectListItem[]
        | MergedProjectsResponse;

      // Handle both wrapped { data: [...] } and raw array formats
      const items = Array.isArray(result) ? result : (result.data ?? []);

      // Transform to app-level types with camelCase fields
      return items.map(transformProjectListItem);
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Create a new project
 *
 * Creates an off-chain project record. For on-chain creation,
 * use the transaction endpoint and then call useRegisterProject.
 *
 * @example
 * ```tsx
 * function CreateProjectForm() {
 *   const createProject = useCreateProject();
 *
 *   const handleSubmit = async (data: CreateProjectInput) => {
 *     await createProject.mutateAsync(data);
 *     toast.success("Project created!");
 *   };
 *
 *   return <ProjectForm onSubmit={handleSubmit} isLoading={createProject.isPending} />;
 * }
 * ```
 */
export function useCreateProject() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async (input: {
      title: string;
      description?: string;
      imageUrl?: string;
      videoUrl?: string;
      category?: string;
      isPublic?: boolean;
      prerequisites?: Array<{ courseId: string; sltHashes?: string[] }>;
    }) => {
      // Endpoint: POST /project/owner/project/create
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/project/owner/project/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: input.title,
            description: input.description,
            image_url: input.imageUrl,
            video_url: input.videoUrl,
            category: input.category,
            is_public: input.isPublic,
            prerequisites: input.prerequisites?.map((p) => ({
              course_id: p.courseId,
              slt_hashes: p.sltHashes,
            })),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create project: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate owner projects list
      void queryClient.invalidateQueries({
        queryKey: ownerProjectKeys.all,
      });
      // Also invalidate general project lists
      void queryClient.invalidateQueries({
        queryKey: projectKeys.all,
      });
    },
  });
}

/**
 * Update project metadata
 *
 * Updates project content including introduction fields (title, description, image, video).
 * Automatically invalidates the project cache on success.
 *
 * @example
 * ```tsx
 * function EditProjectForm({ project }: { project: Project }) {
 *   const updateProject = useUpdateProject();
 *
 *   const handleSubmit = async (data: UpdateProjectInput) => {
 *     await updateProject.mutateAsync({
 *       projectId: project.projectId,
 *       data,
 *     });
 *     toast.success("Project updated!");
 *   };
 *
 *   return <ProjectForm onSubmit={handleSubmit} isLoading={updateProject.isPending} />;
 * }
 * ```
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      projectId,
      data,
    }: {
      projectId: string;
      data: Partial<{
        title?: string;
        description?: string;
        imageUrl?: string;
        videoUrl?: string;
        isPublic?: boolean;
      }>;
    }) => {
      // Endpoint: POST /project/owner/project/update
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/project/owner/project/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: projectId,
            data: {
              title: data.title,
              description: data.description,
              image_url: data.imageUrl,
              video_url: data.videoUrl,
              is_public: data.isPublic,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update project: ${response.statusText}`);
      }

      // Response consumed but not returned - cache invalidation triggers refetch
      await response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific project
      void queryClient.invalidateQueries({
        queryKey: projectKeys.detail(variables.projectId),
      });
      // Also invalidate lists that might contain this project
      void queryClient.invalidateQueries({
        queryKey: projectKeys.lists(),
      });
      // Invalidate published projects
      void queryClient.invalidateQueries({
        queryKey: projectKeys.published(),
      });
      // Invalidate owner projects
      void queryClient.invalidateQueries({
        queryKey: ownerProjectKeys.all,
      });
      // Invalidate manager projects (if user is also a manager)
      void queryClient.invalidateQueries({
        queryKey: projectManagerKeys.all,
      });
    },
  });
}

/**
 * Register an on-chain project with off-chain metadata
 *
 * Use this after a project is created on-chain but before it has
 * been registered in the database. Changes status from "unregistered" -> "active".
 *
 * Typical flow:
 * 1. Project created on-chain via /api/v2/tx/instance/owner/project/create
 * 2. Transaction submitted and confirmed
 * 3. Call this hook to register off-chain metadata
 *
 * @example
 * ```tsx
 * function RegisterProjectButton({ projectId }: { projectId: string }) {
 *   const registerProject = useRegisterProject();
 *
 *   const handleRegister = async () => {
 *     await registerProject.mutateAsync({
 *       projectId,
 *       title: "My Project",
 *       description: "Project description",
 *       isPublic: true,
 *     });
 *     toast.success("Project registered!");
 *   };
 *
 *   return <Button onClick={handleRegister}>Register Project</Button>;
 * }
 * ```
 */
export function useRegisterProject() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async (input: {
      projectId: string;
      txHash?: string;
      title?: string;
      description?: string;
      imageUrl?: string;
      videoUrl?: string;
      category?: string;
      isPublic?: boolean;
      prerequisites?: Array<{ courseId: string; sltHashes?: string[] }>;
    }) => {
      // Endpoint: POST /project/owner/project/register
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/project/owner/project/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: input.projectId,
            tx_hash: input.txHash,
            title: input.title,
            description: input.description,
            image_url: input.imageUrl,
            video_url: input.videoUrl,
            category: input.category,
            is_public: input.isPublic,
            prerequisites: input.prerequisites?.map((p) => ({
              course_id: p.courseId,
              slt_hashes: p.sltHashes,
            })),
          }),
        }
      );

      if (!response.ok) {
        // Include status code for consumers that need to handle specific cases (e.g., 409 conflict)
        const error = new Error(`Failed to register project: ${response.status} ${response.statusText}`);
        (error as Error & { status?: number }).status = response.status;
        throw error;
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific project (status changes from unregistered -> active)
      void queryClient.invalidateQueries({
        queryKey: projectKeys.detail(variables.projectId),
      });
      // Invalidate all lists (registered projects appear in different queries)
      void queryClient.invalidateQueries({
        queryKey: projectKeys.all,
      });
      // Invalidate owner projects
      void queryClient.invalidateQueries({
        queryKey: ownerProjectKeys.all,
      });
      // Invalidate manager projects
      void queryClient.invalidateQueries({
        queryKey: projectManagerKeys.all,
      });
    },
  });
}

/**
 * Hook to invalidate owner projects cache
 *
 * @example
 * ```tsx
 * const invalidate = useInvalidateOwnerProjects();
 *
 * // After an external operation that affects owned projects
 * await invalidate();
 * ```
 */
export function useInvalidateOwnerProjects() {
  const queryClient = useQueryClient();

  return useCallback(
    async () => {
      await queryClient.invalidateQueries({
        queryKey: ownerProjectKeys.all,
      });
    },
    [queryClient],
  );
}
