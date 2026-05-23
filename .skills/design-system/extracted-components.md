# Extracted Components Log

This document logs reusable components extracted during style reviews. These components follow the Andamio styling guidelines and provide consistent, reusable patterns across the application.

---

## Quick Reference: Common Prop Mistakes

These are the most frequently misused props. Check these first when fixing type errors:

| Component | ❌ Wrong Prop | ✅ Correct Prop |
|-----------|---------------|-----------------|
| `AndamioStatCard` | `title` | `label` |
| `AndamioStatCard` | `description`, `trend` | Not supported - use `iconColor` |
| `AndamioNotFoundCard` | `description` | `message` |
| `AndamioNotFoundCard` | `backHref`, `backLabel` | `action={<Button>...</Button>}` |
| `AndamioConfirmDialog` | `confirmLabel` | `confirmText` |
| `AndamioConfirmDialog` | `cancelLabel` | `cancelText` |
| `AndamioEmptyState` | `size` | `iconSize` (`"sm"`, `"md"`, `"lg"`) |

**Tip**: When in doubt, check the component file in `src/components/andamio/` for the interface definition.

---

## Components

### AndamioNotFoundCard

**File**: `src/components/andamio/andamio-not-found-card.tsx`

**Extracted From**: Style review of `/dashboard` route (2024-12)

**Purpose**: Provides consistent error/not-found states across the application.

**Pattern Replaced**:
```tsx
<AndamioPageHeader title="X Not Found" />
<AndamioAlert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AndamioAlertTitle>Error</AndamioAlertTitle>
  <AndamioAlertDescription>{message}</AndamioAlertDescription>
</AndamioAlert>
```

**Usage**:
```tsx
import { AndamioNotFoundCard } from "~/components/andamio";

// Basic
<AndamioNotFoundCard title="Course Not Found" />

// With custom message
<AndamioNotFoundCard
  title="Module Not Found"
  message="The requested module could not be loaded"
/>

// With action
<AndamioNotFoundCard
  title="Assignment Not Found"
  action={<AndamioButton onClick={() => router.back()}>Go Back</AndamioButton>}
/>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | required | Title in page header |
| `message` | `string` | "The requested resource could not be found" | Error message in alert |
| `action` | `ReactNode` | - | Optional action button |
| `className` | `string` | - | Additional CSS classes |

---

### AndamioEmptyState

**File**: `src/components/andamio/andamio-empty-state.tsx`

**Extracted From**: Style review of `/dashboard` route (2024-12)

**Purpose**: Provides consistent empty state UI when there's no data to display.

**Pattern Replaced**:
```tsx
<div className="flex flex-col items-center justify-center py-8 text-center">
  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
  <p className="text-sm text-muted-foreground mb-2">Title</p>
  <p className="text-xs text-muted-foreground mb-4">Description</p>
  <AndamioButton>Action</AndamioButton>
</div>
```

**Usage**:
```tsx
import { AndamioEmptyState } from "~/components/andamio";
import { BookOpen } from "lucide-react";

// Basic
<AndamioEmptyState
  icon={BookOpen}
  title="No courses found"
/>

// With description and action
<AndamioEmptyState
  icon={BookOpen}
  title="No courses yet"
  description="Browse courses and commit to assignments to see them here."
  action={<AndamioButton>Browse Courses</AndamioButton>}
/>

// Custom icon size
<AndamioEmptyState
  icon={FileText}
  iconSize="sm"
  title="No documents"
/>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `IconComponent` | required | Lucide icon component |
| `title` | `string` | required | Main title text |
| `description` | `string` | - | Optional description |
| `action` | `ReactNode` | - | Optional action button |
| `iconSize` | `"sm" \| "md" \| "lg"` | `"lg"` | Icon size variant |
| `className` | `string` | - | Additional CSS classes |

---

### AndamioStatCard

**File**: `src/components/andamio/andamio-stat-card.tsx`

**Extracted From**: Style review of `/dashboard` route (2024-12)

**Purpose**: Provides consistent stat/metric display for counts and totals.

**Pattern Replaced**:
```tsx
<div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
  <BookOpen className="h-4 w-4 text-info" />
  <div>
    <p className="text-lg font-semibold">{count}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
</div>
```

**Usage**:
```tsx
import { AndamioStatCard } from "~/components/andamio";
import { BookOpen, Award } from "lucide-react";

// Basic stat
<AndamioStatCard
  icon={BookOpen}
  value={12}
  label="Courses"
/>

// With semantic color
<AndamioStatCard
  icon={Award}
  value={5}
  label="Credentials"
  iconColor="warning"
/>

// Grid of stats
<div className="grid grid-cols-2 gap-3">
  <AndamioStatCard icon={BookOpen} value={12} label="Courses" iconColor="info" />
  <AndamioStatCard icon={Award} value={5} label="Credentials" iconColor="warning" />
</div>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `IconComponent` | required | Lucide icon component |
| `value` | `number \| string` | required | The statistic value |
| `label` | `string` | required | Label describing the stat |
| `iconColor` | `"muted" \| "primary" \| "success" \| "warning" \| "info" \| "destructive"` | `"muted"` | Semantic icon color |
| `className` | `string` | - | Additional CSS classes |

---

### AndamioPageLoading

**File**: `src/components/andamio/andamio-page-loading.tsx`

**Extracted From**: Style review of `/course` route (2024-12)

**Purpose**: Provides consistent loading skeleton patterns for pages.

**Pattern Replaced**:
```tsx
<div className="space-y-6">
  <div>
    <AndamioSkeleton className="h-9 w-64 mb-2" />
    <AndamioSkeleton className="h-5 w-96" />
  </div>
  <div className="space-y-2">
    {[1, 2, 3, 4, 5].map((i) => (
      <AndamioSkeleton key={i} className="h-12 w-full" />
    ))}
  </div>
</div>
```

**Usage**:
```tsx
import { AndamioPageLoading } from "~/components/andamio";

// List page loading (default)
<AndamioPageLoading />

// Detail page with header
<AndamioPageLoading variant="detail" />

// Content page
<AndamioPageLoading variant="content" />

// Custom item count
<AndamioPageLoading variant="list" itemCount={3} />
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"list" \| "detail" \| "content"` | `"list"` | Layout variant |
| `itemCount` | `number` | `5` | Number of skeleton items |
| `className` | `string` | - | Additional CSS classes |

---

## Wrapper Components Updated

All Andamio wrapper components now consistently export with the `Andamio` prefix for clarity. This follows **Rule 3** from style-rules.md.

### Bulk Update (2024-12)

The following wrappers were updated to export with `Andamio` prefix instead of re-exporting raw shadcn names:

| Wrapper File | Exports |
|--------------|---------|
| `andamio-slider.tsx` | `AndamioSlider` |
| `andamio-sheet.tsx` | `AndamioSheet`, `AndamioSheetContent`, `AndamioSheetHeader`, etc. |
| `andamio-popover.tsx` | `AndamioPopover`, `AndamioPopoverContent`, `AndamioPopoverTrigger` |
| `andamio-hover-card.tsx` | `AndamioHoverCard`, `AndamioHoverCardContent`, `AndamioHoverCardTrigger` |
| `andamio-dropdown-menu.tsx` | `AndamioDropdownMenu`, `AndamioDropdownMenuContent`, `AndamioDropdownMenuItem`, etc. |
| `andamio-context-menu.tsx` | `AndamioContextMenu`, `AndamioContextMenuContent`, `AndamioContextMenuItem`, etc. |
| `andamio-avatar.tsx` | `AndamioAvatar`, `AndamioAvatarFallback`, `AndamioAvatarImage` |
| `andamio-collapsible.tsx` | `AndamioCollapsible`, `AndamioCollapsibleContent`, `AndamioCollapsibleTrigger` |
| `andamio-alert-dialog.tsx` | `AndamioAlertDialog`, `AndamioAlertDialogContent`, `AndamioAlertDialogAction`, etc. |
| `andamio-pagination.tsx` | `AndamioPagination`, `AndamioPaginationContent`, `AndamioPaginationItem`, etc. |
| `andamio-resizable.tsx` | `AndamioResizablePanelGroup`, `AndamioResizablePanel`, `AndamioResizableHandle` |
| `andamio-toggle-group.tsx` | `AndamioToggleGroup`, `AndamioToggleGroupItem` |

**Backwards Compatibility**: Some wrappers (e.g., `andamio-popover.tsx`, `andamio-resizable.tsx`) also export base names via `export * from` for existing code that uses non-prefixed names.

---

### AndamioBreadcrumb

**File**: `src/components/andamio/andamio-breadcrumb.tsx`

**Updated From**: Style review of `/course` route (2024-12)

**Reason**: The `course-breadcrumb.tsx` was importing raw shadcn/ui `Breadcrumb*` components, violating Rule 2: "ShadCN primitives should never be used outside of Andamio Components."

**Change**: Updated wrapper to export named Andamio-prefixed components instead of `export *`.

**Usage**:
```tsx
import {
  AndamioBreadcrumb,
  AndamioBreadcrumbList,
  AndamioBreadcrumbItem,
  AndamioBreadcrumbLink,
  AndamioBreadcrumbPage,
  AndamioBreadcrumbSeparator,
} from "~/components/andamio";
```

---

## Other Components Extracted

### AccountDetailsCard

**File**: `src/components/dashboard/account-details.tsx`

**Extracted From**: Style review of `/dashboard` route (2024-12)

**Reason**: The dashboard page.tsx was applying custom tailwind classes to `AndamioCard*` components, violating Rule 1: "Top level page components should never apply custom tailwind properties to Andamio Components."

**Purpose**: Displays wallet address, access token status, and session information.

---

### SLTLessonTable

**File**: `src/components/courses/slt-lesson-table.tsx`

**Extracted From**: Style review of `/course` route (2024-12)

**Reason**: The module page (`/course/[coursenft]/[modulecode]/page.tsx`) had a complex inline table component with custom styling on Andamio components, violating Rule 1.

**Purpose**: Displays a combined table of Student Learning Targets (SLTs) and their associated lessons, with on-chain verification status badges.

**Usage**:
```tsx
import { SLTLessonTable, type CombinedSLTLesson } from "~/components/courses/slt-lesson-table";

const combinedData: CombinedSLTLesson[] = [
  {
    module_index: 1,
    slt_text: "Understand blockchain basics",
    slt_id: "slt-123",
    lesson: {
      title: "Introduction to Blockchain",
      description: "Learn the fundamentals",
      image_url: null,
      video_url: null,
    },
  },
];

<SLTLessonTable
  data={combinedData}
  courseId={courseId}
  moduleCode={moduleCode}
  onChainModule={onChainModule}  // Optional - for on-chain status badges
/>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `CombinedSLTLesson[]` | required | Array of SLT and lesson data |
| `courseId` | `string` | required | Course NFT policy ID for links |
| `moduleCode` | `string` | required | Module code for links |
| `onChainModule` | `OnChainModule \| null` | - | On-chain module data for verification badges |

---

### CourseModuleCard

**File**: `src/components/courses/course-module-card.tsx`

**Extracted From**: Style review of `/course` route (2024-12)

**Reason**: The course detail page (`/course/[coursenft]/page.tsx`) had inline module card rendering with custom styling, violating Rule 1.

**Purpose**: Displays a course module card with SLT list, on-chain verification status, and links to module details.

**Usage**:
```tsx
import { CourseModuleCard } from "~/components/courses/course-module-card";

<CourseModuleCard
  moduleCode="MOD001"
  title="Introduction to Smart Contracts"
  index={1}
  slts={[
    { slt_text: "Understand blockchain basics" },
    { slt_text: "Write your first contract" },
  ]}
  onChainSlts={new Set(["Understand blockchain basics"])}
  isOnChain={true}
  courseId={courseId}
/>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `moduleCode` | `string` | required | Module identifier code |
| `title` | `string` | required | Module title |
| `index` | `number` | required | Module position (1-based) |
| `slts` | `Array<{ slt_text: string }>` | required | Student Learning Targets |
| `onChainSlts` | `Set<string>` | required | Set of SLT texts verified on-chain |
| `isOnChain` | `boolean` | required | Whether module has on-chain verification |
| `courseId` | `string` | required | Course NFT policy ID for links |

---

### LessonMediaSection

**File**: `src/components/courses/lesson-media-section.tsx`

**Extracted From**: Style review of `/course` route (2024-12)

**Reason**: The lesson page (`/course/[coursenft]/[modulecode]/[moduleindex]/page.tsx`) had inline media display code with custom styling patterns.

**Purpose**: Displays lesson video and/or image media in a consistent, responsive layout with video taking priority over images when both are present.

**Usage**:
```tsx
import { LessonMediaSection } from "~/components/courses/lesson-media-section";

// Video only
<LessonMediaSection
  videoUrl="https://youtube.com/watch?v=..."
/>

// Image only
<LessonMediaSection
  imageUrl="https://example.com/image.jpg"
  imageAlt="Lesson illustration"
/>

// Both (video shown, image hidden)
<LessonMediaSection
  videoUrl="https://youtube.com/watch?v=..."
  imageUrl="https://example.com/image.jpg"
  imageAlt="Lesson illustration"
/>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `videoUrl` | `string \| null` | - | Video URL (YouTube, Vimeo, etc.) |
| `imageUrl` | `string \| null` | - | Image URL |
| `imageAlt` | `string` | "Lesson image" | Alt text for image |

**Notes**:
- When both video and image are provided, only video is displayed
- Component returns `null` if neither video nor image is provided
- Video uses `ReactPlayer` with responsive aspect ratio container
- Image uses Next.js `Image` component with proper optimization

---

### StudioHubCard

**File**: `src/components/studio/studio-hub-card.tsx`

**Extracted From**: Style review of `/studio` route (2024-12)

**Reason**: The studio hub page had inline card components with custom hover styling and transitions on Andamio components, violating Rule 1.

**Purpose**: Navigation card for the Studio hub page with hover effects and icon.

**Usage**:
```tsx
import { StudioHubCard } from "~/components/studio/studio-hub-card";
import { BookOpen, FolderKanban } from "lucide-react";

<StudioHubCard
  title="Course Studio"
  description="Create and manage your Andamio courses"
  href="/studio/course"
  icon={BookOpen}
  buttonLabel="Manage Courses"
/>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | required | Card title |
| `description` | `string` | required | Card description |
| `href` | `string` | required | Navigation URL |
| `icon` | `IconComponent` | required | Lucide icon component |
| `buttonLabel` | `string` | required | Button text |

---

### StudioCourseCard

**File**: `src/components/studio/studio-course-card.tsx`

**Extracted From**: Style review of `/studio/course` route (2024-12)

**Reason**: The course studio page had a raw `<button>` element with custom styling, violating Rule 2. The component also had custom tailwind on card elements.

**Purpose**: Compact course card for the Course Studio grid with on-chain verification status indicators.

**Usage**:
```tsx
import { StudioCourseCard, type HybridCourseStatus } from "~/components/studio/studio-course-card";

const course: HybridCourseStatus = {
  courseId: "abc123...",
  title: "My Course",
  inDb: true,
  onChain: true,
  onChainModuleCount: 3,
};

<StudioCourseCard
  course={course}
  onClick={() => router.push(`/studio/course/${course.courseId}`)}
/>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `course` | `HybridCourseStatus` | required | Course data with DB and on-chain status |
| `onClick` | `() => void` | required | Click handler |

---

## Hooks Extracted

### useModuleWizardData

**File**: `src/hooks/api/course/use-module-wizard-data.ts`

**Extracted From**: Refactoring of `/studio/course/[coursenft]/[modulecode]/page.tsx` (2024-12)
**Refactored**: January 25, 2026 - Now composes React Query hooks instead of direct fetch()

**Purpose**: Encapsulates all data fetching logic for the module wizard by composing `useCourse`, `useTeacherCourseModules`, `useSLTs`, and `useAssignment` hooks.

**Usage**:
```tsx
import { useModuleWizardData } from "~/hooks/api/course/use-module-wizard-data";

const { data, completion, refetchData } = useModuleWizardData({
  courseId,
  moduleCode,
  isNewModule,
  onDataLoaded: (course, courseModule) => {
    // Update header, breadcrumbs, etc.
  },
});
```

**Returns**:
| Property | Type | Description |
|----------|------|-------------|
| `data` | `WizardData` | Course, module, SLTs, assignment, introduction, lessons, loading state |
| `completion` | `StepCompletion` | Boolean flags for each wizard step completion |
| `refetchData` | `() => Promise<void>` | Function to refetch all data |

---

### useWizardNavigation

**File**: `src/hooks/use-wizard-navigation.ts`

**Extracted From**: Refactoring of `/studio/course/[coursenft]/[modulecode]/page.tsx` (2024-12)

**Purpose**: Manages wizard step navigation with URL synchronization and step unlock logic.

**Usage**:
```tsx
import { useWizardNavigation, STEP_ORDER } from "~/hooks/use-wizard-navigation";

const {
  currentStep,
  direction,
  currentIndex,
  canGoNext,
  canGoPrevious,
  goToStep,
  goNext,
  goPrevious,
  getStepStatus,
  isStepUnlocked,
} = useWizardNavigation({ completion });
```

**Features**:
- URL-based step persistence (`?step=credential`)
- Step unlock logic based on completion state
- Direction tracking for animations
- Navigation guards

---

## Authorization Components

### RequireCourseAccess

**File**: `src/components/auth/require-course-access.tsx`

**Extracted From**: Authorization requirements for `/studio/course/[coursenft]/*` routes (2024-12)

**Purpose**: Verifies the user has Owner or Teacher access to a course before rendering children.

**Authorization Logic**:
- Checks if user is authenticated
- Calls `GET /courses/owned` endpoint to verify user owns or contributes to the course
- Course ownership = created the course
- Teacher access = listed as contributor

**Usage**:
```tsx
import { RequireCourseAccess } from "~/components/auth/require-course-access";

<RequireCourseAccess
  courseId={courseId}
  title="Edit Module"
  description="You need access to this course to edit modules"
>
  <ModuleWizard />
</RequireCourseAccess>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `courseId` | `string` | required | Course NFT Policy ID to check access for |
| `title` | `string` | "Course Access Required" | Title shown when not authenticated |
| `description` | `string` | "Connect your wallet..." | Description shown when not authenticated |
| `loadingVariant` | `"page" \| "studio-centered" \| "studio-split"` | `"page"` | Loading skeleton style to match page layout |
| `children` | `ReactNode` | required | Content to render when user has access |

**States Rendered**:
- Not authenticated → Login prompt with `AndamioAuthButton`
- Loading → Loading skeleton matching `loadingVariant`
  - `"page"` → `AndamioPageLoading variant="detail"`
  - `"studio-centered"` → `AndamioStudioLoading variant="centered"`
  - `"studio-split"` → `AndamioStudioLoading variant="split-pane"`
- Error → Error alert with back button
- Access denied → Access denied message with navigation options
- Has access → Renders children

**Why loadingVariant matters**: Prevents loading screen "flash" when navigating between pages with different layouts. The authorization check loading state should match the page's actual layout.

---

## Studio Components

### StudioModuleCard

**File**: `src/components/studio/studio-module-card.tsx`

**Extracted From**: Course Editor module list (`/studio/course/[coursenft]/page.tsx`) (2025-12)

**Purpose**: Displays a course module with status, progress indicator, and metadata in studio context.

**Usage**:
```tsx
import { StudioModuleCard } from "~/components/studio/studio-module-card";

<StudioModuleCard
  courseModule={courseModule}
  courseId={courseId}
  showProgress={true}
  showDescription={true}
  showSltCount={true}
/>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `courseModule` | `CourseModuleOutput` | required | Module data from API |
| `courseId` | `string` | required | Course identifier for link building |
| `showProgress` | `boolean` | `true` | Show 6-step wizard progress indicator |
| `showDescription` | `boolean` | `true` | Show module description |
| `showSltCount` | `boolean` | `true` | Show SLT count badge |

**Sub-components Exported**:
- `ModuleStatusIcon` - Status indicator (ON_CHAIN, PENDING_TX, APPROVED, DRAFT, etc.)
- `ModuleProgressIndicator` - 6-step wizard progress dots
- `WIZARD_STEPS` - Step configuration array

**Progress Indicator**:
Shows completion status for 6 wizard steps:
1. Credential (required)
2. SLTs (required)
3. Assignment (required)
4. Lessons (optional)
5. Introduction (required)
6. Review (required)

---

## Review History

| Date | Route | Components Extracted |
|------|-------|---------------------|
| 2024-12 | `/dashboard` | `AndamioNotFoundCard`, `AndamioEmptyState`, `AndamioStatCard`, `AccountDetailsCard` |
| 2024-12 | `/course` | `AndamioPageLoading`, `SLTLessonTable`, `CourseModuleCard`, `LessonMediaSection`, Updated `AndamioBreadcrumb` wrapper |
| 2024-12 | `/studio` | `StudioHubCard`, `StudioCourseCard`, Refactored pages to use `AndamioPageLoading`, `AndamioEmptyState` |
| 2024-12 | `/studio/course/[coursenft]/*` | `useModuleWizardData`, `useWizardNavigation`, `RequireCourseAccess` - Refactored for separation of concerns + authorization |
| 2025-12 | `/project/*` | Refactored to use `AndamioPageLoading`, `AndamioEmptyState` |
| 2025-12 | `/components` | Complete component showcase page with all Andamio components |
| 2025-12 | Wrapper Updates | All wrapper components updated to export with `Andamio` prefix (Rule 3) |
| 2025-12 | Codebase-wide | `AndamioText` - Standardized all `<p className=...>` patterns to use semantic text component |
| 2025-12 | `/studio/course` | Master-detail layout, selectable list items, status icons, welcome panel - Documented as reusable patterns |
| 2025-12 | `/studio/course/[coursenft]/[modulecode]` | SLT drag-and-drop reordering with @dnd-kit |
| 2025-12 | `/studio/course/[coursenft]` | `StudioModuleCard` with progress indicator, `RequireCourseAccess` loadingVariant |
| 2025-12 | Module Wizard | Inline lesson editing, Blueprint→Credential rename, silent refetch on save |
| 2025-12 | `/studio/course` | `RegisterCourseDrawer` for on-chain-only course registration |
| 2025-12 | `/studio/course/[coursenft]` | Credential-focused empty state, conditional tabs |
| 2026-01 | `/project/[treasurynft]/contributor` | `AndamioDashboardStat` - Replaced inline KPI cards |
| 2026-01 | `/studio/project/[treasurynft]/manager` | `AndamioSearchInput`, `AndamioDashboardStat` - Replaced inline patterns |
| 2026-01 | `/studio/course/[coursenft]/teacher` | `AndamioDashboardStat`, `AndamioSearchInput`, `AndamioPageLoading`, `AndamioEmptyState`, `AndamioErrorAlert` |
| 2026-01 | `/project/[treasurynft]/[taskhash]` | `AndamioBackButton`, `AndamioErrorAlert`, `AndamioDashboardStat`, `AndamioText` - Task commitment flow with evidence editor |
| 2026-01 | `/dashboard` | 6 Andamioscan summary components: `EnrolledCoursesSummary`, `PendingReviewsSummary`, `CredentialsSummary`, `ContributingProjectsSummary`, `ManagingProjectsSummary`, `OwnedCoursesSummary` |
| 2026-01 | `/credentials` | New page using `useCompletedCourses` hook |
| 2026-01 | `/studio/course` | `InstructorIcon` - Crown icon for course ownership indicator |
| 2026-02 | Design system audit | `AndamioHeading`, `AndamioCode`, `AndamioSectionDescription`, `CopyId` — Documented existing undocumented components |

---

## Dashboard Summary Components

These components follow a consistent pattern for displaying on-chain data summaries on the dashboard. They use React Query hooks for data fetching with skeleton loading states and graceful error handling.

### EnrolledCoursesSummary

**File**: `src/components/dashboard/enrolled-courses-summary.tsx`

**Purpose**: Shows a summary of on-chain enrolled courses for the current user.

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `accessTokenAlias` | `string \| null \| undefined` | required | User's access token alias |

**Hook Used**: `useEnrolledCourses`

---

### PendingReviewsSummary

**File**: `src/components/dashboard/pending-reviews-summary.tsx`

**Purpose**: Shows pending assessment reviews for teachers/instructors.

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `accessTokenAlias` | `string \| null \| undefined` | required | User's access token alias |

**Hook Used**: `usePendingAssessments`

---

### CredentialsSummary

**File**: `src/components/dashboard/credentials-summary.tsx`

**Purpose**: Shows earned on-chain credentials with link to full credentials page.

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `accessTokenAlias` | `string \| null \| undefined` | required | User's access token alias |

**Hook Used**: `useCompletedCourses`

---

### ContributingProjectsSummary

**File**: `src/components/dashboard/contributing-projects-summary.tsx`

**Purpose**: Shows projects the user is actively contributing to.

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `accessTokenAlias` | `string \| null \| undefined` | required | User's access token alias |

**Hook Used**: `useContributingProjects`

---

### ManagingProjectsSummary

**File**: `src/components/dashboard/managing-projects-summary.tsx`

**Purpose**: Shows projects the user is managing. Only renders if user has managing projects (returns null for non-managers).

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `accessTokenAlias` | `string \| null \| undefined` | required | User's access token alias |

**Hook Used**: `useManagingProjects`

---

### OwnedCoursesSummary

**File**: `src/components/dashboard/owned-courses-summary.tsx`

**Purpose**: Shows on-chain courses the user owns (created), with links to studio.

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `accessTokenAlias` | `string \| null \| undefined` | required | User's access token alias |

**Hook Used**: `useOwnedCourses`

---

### Common Pattern for Dashboard Summary Components

All dashboard summary components follow this structure:

```tsx
export function SummaryComponent({ accessTokenAlias }: Props) {
  const { data, isLoading, error, refetch } = useHookName(accessTokenAlias ?? undefined);

  // Log errors silently
  React.useEffect(() => {
    if (error) console.error(`[ComponentName] Failed to load:`, error.message);
  }, [error]);

  // No access token - don't render
  if (!accessTokenAlias) return null;

  // Loading skeleton
  if (isLoading) {
    return (
      <AndamioCard>
        <AndamioCardHeader className="pb-3">
          <AndamioCardIconHeader icon={RelevantIcon} title="Title" />
        </AndamioCardHeader>
        <AndamioCardContent>
          <AndamioSkeleton className="..." />
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Empty/error state - return null or empty state
  if (!data || data.length === 0 || error) return null;

  // Render data
  return (
    <AndamioCard>
      {/* Header with icon, title, badge, refresh button */}
      {/* Summary stat with icon */}
      {/* List of items (truncated to 3) */}
      {/* Action button */}
    </AndamioCard>
  );
}
```

---

### AndamioSearchInput

**File**: `src/components/andamio/andamio-search-input.tsx`

**Extracted From**: Style review of `/studio/project/[treasurynft]/manager` route (2026-01)

**Purpose**: Search input with integrated search icon. Replaces the repeated pattern of wrapping an input in a relative div with positioned icon.

**Pattern Replaced**:
```tsx
<div className="relative">
  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <AndamioInput className="pl-8" placeholder="Search..." />
</div>
```

**Usage**:
```tsx
import { AndamioSearchInput } from "~/components/andamio";

// Default size
<AndamioSearchInput
  placeholder="Search courses..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
/>

// Compact variant for toolbars
<AndamioSearchInput
  inputSize="sm"
  placeholder="Search..."
  value={query}
  onChange={handleChange}
/>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `inputSize` | `"default" \| "sm"` | `"default"` | Size variant |
| `...inputProps` | `InputHTMLAttributes` | - | All input props (placeholder, value, onChange, etc.) |

**Features**:
- SearchIcon automatically positioned inside input
- Size variants for different contexts
- Forwards ref to underlying input

---

### AndamioDashboardStat

**File**: `src/components/andamio/andamio-dashboard-stat.tsx`

**Extracted From**: Style review of `/project/[treasurynft]/contributor` and `/studio/project/[treasurynft]/manager` routes (2026-01)

**Purpose**: Full card-based KPI stat display for dashboard grids. Shows label with icon in header and large value below.

**Pattern Replaced**:
```tsx
<AndamioCard>
  <AndamioCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <AndamioCardTitle className="text-sm font-medium">Total Submissions</AndamioCardTitle>
    <ManagerIcon className="h-4 w-4 text-muted-foreground" />
  </AndamioCardHeader>
  <AndamioCardContent>
    <div className="text-2xl font-bold">{stats.total}</div>
  </AndamioCardContent>
</AndamioCard>
```

**Usage**:
```tsx
import { AndamioDashboardStat } from "~/components/andamio";

// Basic stat
<AndamioDashboardStat
  icon={ManagerIcon}
  label="Total Submissions"
  value={stats.total}
/>

// With description sub-text
<AndamioDashboardStat
  icon={CourseIcon}
  label="Total Courses"
  value={stats.total}
  description={`${stats.published} published, ${stats.draft} draft`}
/>

// With semantic color
<AndamioDashboardStat
  icon={SuccessIcon}
  label="Accepted"
  value={stats.accepted}
  valueColor="success"
  iconColor="success"
/>

// Grid of stats
<div className="grid gap-4 md:grid-cols-4">
  <AndamioDashboardStat icon={ManagerIcon} label="Total" value={10} />
  <AndamioDashboardStat icon={PendingIcon} label="Pending" value={5} />
  <AndamioDashboardStat icon={SuccessIcon} label="Accepted" value={3} valueColor="success" iconColor="success" />
  <AndamioDashboardStat icon={ErrorIcon} label="Denied" value={2} valueColor="destructive" iconColor="destructive" />
</div>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `IconComponent` | required | Lucide icon component |
| `label` | `string` | required | Label describing the statistic |
| `value` | `ReactNode` | required | The value to display (number, string, or JSX) |
| `description` | `string` | - | Optional sub-text shown below the value |
| `valueColor` | `"success" \| "warning" \| "destructive" \| "info" \| "muted"` | - | Semantic color for value text |
| `iconColor` | `"success" \| "warning" \| "destructive" \| "info" \| "muted"` | `"muted"` | Semantic color for icon |
| `className` | `string` | - | Additional CSS classes for card |

**Note**: For compact inline stats (icon + value + label without card wrapper), use `AndamioStatCard` instead.

---

### AndamioText

**File**: `src/components/andamio/andamio-text.tsx`

**Extracted From**: Codebase-wide `<p className=...>` standardization (2025-12)

**Purpose**: Provides consistent text styling across the application, replacing loose `<p>` tags with styled className patterns.

**Pattern Replaced**:
```tsx
<p className="text-sm text-muted-foreground">Helper text</p>
<p className="text-muted-foreground">Description</p>
<p className="text-lg text-muted-foreground">Lead text</p>
<p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Label</p>
```

**Usage**:
```tsx
import { AndamioText } from "~/components/andamio";

// Default body text
<AndamioText>Regular paragraph text</AndamioText>

// Muted description
<AndamioText variant="muted">This is muted helper text</AndamioText>

// Small helper text
<AndamioText variant="small">Small muted text</AndamioText>

// Lead/intro text
<AndamioText variant="lead">Large introductory paragraph</AndamioText>

// Overline/label
<AndamioText variant="overline">CATEGORY LABEL</AndamioText>

// Render as different element
<AndamioText as="span" variant="small">Inline text</AndamioText>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"default" \| "muted" \| "small" \| "lead" \| "overline"` | `"default"` | Text style variant |
| `as` | `"p" \| "span" \| "div"` | `"p"` | HTML element to render |
| `className` | `string` | - | Additional CSS classes |

**Variant Styles**:
| Variant | Classes Applied |
|---------|----------------|
| `default` | `text-base text-foreground` |
| `muted` | `text-base text-muted-foreground` |
| `small` | `text-sm text-muted-foreground` |
| `lead` | `text-lg text-muted-foreground` |
| `overline` | `text-xs font-medium uppercase tracking-wider text-muted-foreground` |

---

### AndamioHeading

**File**: `src/components/andamio/andamio-heading.tsx`

**Extracted From**: Heading standardization (2026-01)

**Purpose**: Decouples semantic heading level (h1-h6) from visual size for flexible, accessible headings. Uses CVA for variant management. Applies `m-0` to override global heading margins.

**Pattern Replaced**:
```tsx
<h2 className="text-xl font-bold tracking-tight mb-2">Section Title</h2>
```

**Usage**:
```tsx
import { AndamioHeading } from "~/components/andamio";

// Default (h2, size 2xl)
<AndamioHeading>Section Title</AndamioHeading>

// Semantic h1, visual size 4xl
<AndamioHeading level={1} size="4xl">Page Title</AndamioHeading>

// Semantic h3, visual size lg
<AndamioHeading level={3} size="lg" className="text-muted-foreground">Subsection</AndamioHeading>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `level` | `1 \| 2 \| 3 \| 4 \| 5 \| 6` | `2` | Semantic heading level |
| `size` | `"5xl" \| "4xl" \| "3xl" \| "2xl" \| "xl" \| "lg" \| "base"` | `"2xl"` | Visual size variant |
| `className` | `string` | - | Additional CSS classes |

**Size Scale**:
| Size | Base | sm: breakpoint |
|------|------|----------------|
| `5xl` | text-5xl | text-6xl |
| `4xl` | text-4xl | text-5xl |
| `3xl` | text-3xl | text-4xl |
| `2xl` | text-2xl | text-3xl |
| `xl` | text-xl | text-2xl |
| `lg` | text-lg | text-xl |
| `base` | text-base | text-lg |

---

### AndamioCode

**File**: `src/components/andamio/andamio-code.tsx`

**Purpose**: Displays formatted JSON data or raw code in a monospace block. Designed for API responses, debug info, or code snippets.

**Usage**:
```tsx
import { AndamioCode } from "~/components/andamio";

// Display JSON data (auto-stringified)
<AndamioCode data={myObject} />

// Custom indent
<AndamioCode data={response} indent={4} />

// Raw code block
<AndamioCode>const foo = "bar";</AndamioCode>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `unknown` | - | Data to stringify as JSON |
| `indent` | `number` | `2` | JSON indentation spaces |
| `children` | `ReactNode` | - | Raw code content (used when `data` not provided) |
| `className` | `string` | - | Additional CSS classes |

---

### AndamioSectionDescription

**File**: `src/components/andamio/andamio-section-description.tsx`

**Purpose**: Centered, constrained-width paragraph for section descriptions on landing pages.

**Usage**:
```tsx
import { AndamioSectionDescription } from "~/components/andamio";

<AndamioSectionDescription>
  Build verifiable credentials on-chain with Andamio's learning platform.
</AndamioSectionDescription>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | required | Description text |
| `className` | `string` | - | Additional CSS classes |

**Renders**: `AndamioText variant="lead"` inside a centered `max-w-2xl` container with vertical padding.

---

### CopyId

**File**: `src/components/andamio/copy-id.tsx`

**Purpose**: Displays a copyable ID with responsive truncation. Mobile shows truncated, desktop shows full. Click to copy with checkmark feedback.

**Usage**:
```tsx
import { CopyId } from "~/components/andamio/copy-id";

<CopyId id={project.projectId} label="Project ID" />
<CopyId id={course.courseId} label="Course ID" />
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `id` | `string` | required | The full ID to display and copy |
| `label` | `string` | - | Accessibility label |
| `className` | `string` | - | Additional CSS classes |

**Features**:
- Mobile (< md): Truncated display (first 8...last 6 chars)
- Desktop (md+): Full ID display
- Click anywhere to copy with `useCopyFeedback` hook
- Subtle icon transition: CopyIcon → CompletedIcon

---

### AndamioStatusIcon

**File**: `src/components/andamio/andamio-status-icon.tsx`

**Extracted From**: Style review of `/studio/course` route (2025-12)

**Purpose**: Consistent status indicator with icon and semantic color background. Replaces 5+ duplicate implementations.

**Pattern Replaced**:
```tsx
// This pattern appeared in 17+ files:
<div className="flex h-8 w-8 items-center justify-center rounded-md bg-success/10">
  <CheckCircle className="h-4 w-4 text-success" />
</div>
```

**Usage**:
```tsx
import { AndamioStatusIcon, getCourseStatus, getModuleStatus } from "~/components/andamio";

// Using presets (recommended)
<AndamioStatusIcon status="on-chain" />
<AndamioStatusIcon status="pending" />
<AndamioStatusIcon status="draft" />
<AndamioStatusIcon status="syncing" />
<AndamioStatusIcon status="needs-import" />

// With helper functions
<AndamioStatusIcon status={getCourseStatus(course)} />
<AndamioStatusIcon status={getModuleStatus(module.status)} />

// Custom configuration
<AndamioStatusIcon variant="success" icon={Star} />
<AndamioStatusIcon variant="warning" animate />

// Size and shape variants
<AndamioStatusIcon status="synced" size="sm" />
<AndamioStatusIcon status="synced" size="lg" shape="circle" />
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `status` | `StatusPreset` | - | Preset status: "on-chain", "synced", "pending", "syncing", "draft", "ready", "needs-import", "error", "archived" |
| `variant` | `StatusVariant` | - | Manual variant: "success", "warning", "info", "muted", "destructive" |
| `icon` | `LucideIcon` | - | Custom icon (overrides preset) |
| `animate` | `boolean` | false | Whether to animate (pulse) |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Size variant |
| `shape` | `"rounded" \| "circle"` | `"rounded"` | Shape variant |

**Helper Functions**:
| Function | Input | Output | Use For |
|----------|-------|--------|---------|
| `getCourseStatus` | `{ inDb, onChain }` | StatusPreset | HybridCourseStatus objects |
| `getModuleStatus` | `string` | StatusPreset | Module status strings (ON_CHAIN, DRAFT, etc.) |

---

## UI Patterns (Not Yet Extracted)

These patterns are documented for consistency but remain in their original files. Extract them when they're needed in 2+ locations.

### Master-Detail Split Pane Layout

**Location**: `src/app/(studio)/studio/course/page.tsx`

**Pattern**: Split-pane layout with list on left (35%) and preview/detail panel on right (65%).

**Structure**:
```tsx
import {
  AndamioResizablePanelGroup,
  AndamioResizablePanel,
  AndamioResizableHandle,
} from "~/components/andamio/andamio-resizable";

<AndamioResizablePanelGroup direction="horizontal" className="h-full">
  {/* Left Panel: List */}
  <AndamioResizablePanel defaultSize={35} minSize={25} maxSize={50}>
    <div className="flex h-full flex-col border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        {/* Icon + title */}
      </div>

      {/* Scrollable list */}
      <AndamioScrollArea className="flex-1">
        <div className="flex flex-col gap-3 p-3">
          {/* List items */}
        </div>
      </AndamioScrollArea>

      {/* Footer (search, filters) */}
      <div className="border-t border-border px-3 py-2 bg-muted/30">
        {/* Search input */}
      </div>
    </div>
  </AndamioResizablePanel>

  <AndamioResizableHandle withHandle />

  {/* Right Panel: Preview/Detail */}
  <AndamioResizablePanel defaultSize={65}>
    {selectedItem ? <DetailPanel item={selectedItem} /> : <WelcomePanel />}
  </AndamioResizablePanel>
</AndamioResizablePanelGroup>
```

**Use For**:
- Studio landing pages with item selection
- Email/messaging interfaces
- File browser patterns

---

### Selectable List Item

**Location**: `src/app/(studio)/studio/course/page.tsx` (CourseListItem)

**Pattern**: List item with hover/selection states, animated chevron indicator.

**Structure**:
```tsx
import { cn } from "~/lib/utils";
import { ChevronRight } from "lucide-react";

interface SelectableListItemProps {
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

function SelectableListItem({ isSelected, onClick, disabled, children }: SelectableListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group flex w-full items-center gap-3 px-3 py-3 text-left rounded-lg border transition-all duration-150",
        isSelected
          ? "bg-primary/10 border-primary/30 shadow-sm"
          : "bg-transparent border-transparent hover:bg-muted/50 hover:border-border active:bg-muted/70",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      {/* Status icon slot */}
      <StatusIcon />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <span className={cn(
          "text-sm font-medium truncate transition-colors",
          isSelected ? "text-primary" : "group-hover:text-foreground"
        )}>
          {title}
        </span>
        <span className="text-[10px] text-muted-foreground">{subtitle}</span>
      </div>

      {/* Selection indicator - slides in on hover/select */}
      <ChevronRight className={cn(
        "h-4 w-4 flex-shrink-0 transition-all duration-150",
        isSelected
          ? "text-primary opacity-100 translate-x-0"
          : "text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-70 group-hover:translate-x-0"
      )} />
    </button>
  );
}
```

**Key Features**:
- `group` class enables child hover states
- Border transitions from transparent → visible
- Chevron slides in with opacity + translate animation
- Selected state uses primary color tint

---

### Status Icon Badge

**Location**: `src/app/(studio)/studio/course/page.tsx` (StatusIcon, ModuleStatusIcon)

**Pattern**: Small icon with colored background indicating status.

**Structure**:
```tsx
type Status = "success" | "warning" | "info" | "muted";

function StatusIcon({ status }: { status: Status }) {
  const iconClass = "h-4 w-4";
  const containerBase = "flex h-8 w-8 items-center justify-center rounded-md";

  switch (status) {
    case "success":
      return (
        <div className={cn(containerBase, "bg-success/10")}>
          <CheckCircle className={cn(iconClass, "text-success")} />
        </div>
      );
    case "warning":
      return (
        <div className={cn(containerBase, "bg-warning/10")}>
          <Clock className={cn(iconClass, "text-warning")} />
        </div>
      );
    case "info":
      return (
        <div className={cn(containerBase, "bg-info/10")}>
          <Info className={cn(iconClass, "text-info")} />
        </div>
      );
    default:
      return (
        <div className={cn(containerBase, "bg-muted")}>
          <AlertCircle className={cn(iconClass, "text-muted-foreground")} />
        </div>
      );
  }
}
```

**Variants**:
| Status | Background | Icon Color |
|--------|------------|------------|
| success | `bg-success/10` | `text-success` |
| warning | `bg-warning/10` | `text-warning` |
| info | `bg-info/10` | `text-info` |
| muted | `bg-muted` | `text-muted-foreground` |

**Enhanced version** with gradient and ring (ModuleStatusIcon):
```tsx
<div className="flex h-8 w-8 items-center justify-center rounded-lg ring-1 bg-gradient-to-br from-success/20 to-success/5 ring-success/20">
  <CheckCircle className="h-4 w-4 text-success" />
</div>
```

---

### Welcome Panel (Studio Landing)

**Location**: `src/app/(studio)/studio/course/page.tsx` (WelcomePanel)

**Pattern**: Centered hero section with icon, title, action, and feature cards for studio landing pages.

**Structure**:
```tsx
function WelcomePanel({ itemCount }: { itemCount: number }) {
  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-background via-background to-primary/5">
      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-lg text-center">
          {/* Large Icon */}
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent ring-1 ring-primary/20 mx-auto mb-6 shadow-lg shadow-primary/10">
            <BookOpen className="h-10 w-10 text-primary" />
          </div>

          {/* Title */}
          <h1>Studio Name</h1>
          <AndamioText variant="muted" className="text-base mb-8">
            Tagline describing what this studio does
          </AndamioText>

          {/* Quick Actions */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <AndamioButton>Create New</AndamioButton>
            {itemCount > 0 && (
              <AndamioText variant="small">or select from the list</AndamioText>
            )}
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-3 gap-3 text-left">
            <FeatureCard
              icon={CheckCircle}
              iconColor="success"
              title="Feature 1"
              description="Brief description"
            />
            {/* More feature cards */}
          </div>
        </div>
      </div>

      {/* Footer hint */}
      {itemCount > 0 && (
        <div className="border-t border-border/50 px-6 py-3 bg-muted/20">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <ChevronRight className="h-4 w-4 rotate-180" />
            <AndamioText variant="small">Select an item to view details</AndamioText>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Feature Card Sub-pattern**:
```tsx
<div className="rounded-xl bg-gradient-to-br from-muted/50 to-muted/20 p-4 ring-1 ring-border/50">
  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10 mb-2">
    <CheckCircle className="h-4 w-4 text-success" />
  </div>
  <AndamioText className="text-xs font-medium mb-1">Feature Title</AndamioText>
  <AndamioText variant="small" className="text-[10px] leading-relaxed">
    Feature description text
  </AndamioText>
</div>
```

---

### Stats Grid

**Location**: `src/app/(studio)/studio/course/page.tsx` (CoursePreviewPanel)

**Pattern**: Grid of colorful stat cards with semantic colors.

**Structure**:
```tsx
<div className="grid grid-cols-4 gap-3">
  {/* Default stat */}
  <div className="rounded-xl border p-3 text-center bg-gradient-to-br from-background to-muted/20 shadow-sm">
    <div className="text-2xl font-bold">{stats.total}</div>
    <AndamioText variant="small" className="text-[10px]">Total</AndamioText>
  </div>

  {/* Success stat */}
  <div className="rounded-xl border border-success/20 p-3 text-center bg-gradient-to-br from-success/10 to-success/5 shadow-sm">
    <div className="text-2xl font-bold text-success">{stats.success}</div>
    <AndamioText variant="small" className="text-[10px] text-success/70">Label</AndamioText>
  </div>

  {/* Warning stat */}
  <div className="rounded-xl border border-warning/20 p-3 text-center bg-gradient-to-br from-warning/10 to-warning/5 shadow-sm">
    <div className="text-2xl font-bold text-warning">{stats.warning}</div>
    <AndamioText variant="small" className="text-[10px] text-warning/70">Label</AndamioText>
  </div>

  {/* Muted stat */}
  <div className="rounded-xl border p-3 text-center bg-gradient-to-br from-muted/50 to-muted/20 shadow-sm">
    <div className="text-2xl font-bold text-muted-foreground">{stats.muted}</div>
    <AndamioText variant="small" className="text-[10px]">Label</AndamioText>
  </div>
</div>
```

**Key Features**:
- Semantic color borders (`border-success/20`)
- Gradient backgrounds (`from-success/10 to-success/5`)
- Matching text colors
- Compact sizing (`text-[10px]` labels)

---

### Linked Item List (Outline)

**Location**: `src/app/(studio)/studio/course/page.tsx` (module outline)

**Pattern**: Compact linked list with hover effects and status indicators.

**Structure**:
```tsx
<div className="rounded-xl border overflow-hidden bg-gradient-to-b from-background to-muted/10">
  {items.map((item, index) => (
    <Link
      key={item.id}
      href={`/path/${item.id}`}
      className={cn(
        "flex items-center gap-3 p-3 hover:bg-primary/5 transition-all group",
        index !== 0 && "border-t border-border/50"
      )}
    >
      <StatusIcon status={item.status} />
      <div className="flex-1 min-w-0">
        <AndamioText variant="small" className="font-medium truncate group-hover:text-primary transition-colors">
          {item.title}
        </AndamioText>
        <AndamioText variant="small" className="text-[10px] font-mono text-muted-foreground">
          {item.code}
        </AndamioText>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all group-hover:translate-x-0.5" />
    </Link>
  ))}

  {/* "View all" footer if truncated */}
  {items.length > MAX_VISIBLE && (
    <div className="p-3 text-center border-t border-border/50 bg-muted/30">
      <AndamioButton variant="ghost" size="sm" className="h-7 text-xs">
        View all {items.length} items
        <ChevronRight className="h-3.5 w-3.5 ml-1" />
      </AndamioButton>
    </div>
  )}
</div>
```

**Key Features**:
- `group` class for coordinated hover effects
- Chevron slides in with opacity + translate
- First item has no top border (use `index !== 0`)
- Truncated list shows "View all" footer

---

### Sortable List with Drag and Drop

**Location**: `src/components/studio/wizard/steps/step-slts.tsx`

**Dependencies**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

**Pattern**: Reorderable list items with drag handles using @dnd-kit library.

**Structure**:
```tsx
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

// Configure sensors
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
);

// Handle reorder with optimistic update
const handleDragEnd = useCallback(async (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const oldIndex = items.findIndex((i) => i.id === active.id);
  const newIndex = items.findIndex((i) => i.id === over.id);

  // Optimistic update
  const reordered = arrayMove(items, oldIndex, newIndex);
  setItems(reordered);

  // API call to persist
  try {
    await api.reorder(reordered.map((item, idx) => ({ id: item.id, index: idx + 1 })));
  } catch {
    setItems(items); // Rollback on error
  }
}, [items]);

// Wrapper component
<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
  <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
    {items.map((item) => (
      <SortableItem key={item.id} item={item} />
    ))}
  </SortableContext>
</DndContext>

// Sortable item component
function SortableItem({ item }: { item: Item }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 px-4 py-3 rounded-lg border transition-all",
        isDragging ? "border-primary bg-primary/5 shadow-lg z-50" : "border-border hover:border-muted-foreground/30"
      )}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Content */}
      <span className="flex-1">{item.text}</span>
    </div>
  );
}
```

**Key Features**:
- `distance: 8` activation constraint prevents accidental drags
- Keyboard accessibility via `KeyboardSensor`
- Visual feedback during drag (`isDragging` state)
- Optimistic updates with rollback on error
- Drag handle isolated from item content

**Use For**:
- Reorderable SLT lists
- Lesson ordering
- Module ordering
- Any sortable content lists

---

### AndamioSaveButton

**File**: `src/components/andamio/andamio-save-button.tsx`

**Extracted From**: Codebase-wide save button standardization (2025-12)

**Purpose**: Standardized save button with consistent styling, loading states, and icon. Replaces 10+ duplicate save button implementations.

**Pattern Replaced**:
```tsx
<AndamioButton onClick={handleSave} disabled={isSaving}>
  {isSaving ? (
    <>
      <LoadingIcon className="h-4 w-4 mr-2 animate-spin" />
      Saving...
    </>
  ) : (
    <>
      <SaveIcon className="h-4 w-4 mr-2" />
      Save Changes
    </>
  )}
</AndamioButton>
```

**Usage**:
```tsx
import { AndamioSaveButton } from "~/components/andamio";

// Default full save button
<AndamioSaveButton onClick={handleSave} isSaving={isPending} />
// Shows: [SaveIcon] Save Changes → [Spinner] Saving...

// Compact mode (for tight spaces like wizard steps)
<AndamioSaveButton onClick={handleSave} isSaving={isPending} compact />
// Shows: [SaveIcon] Save → [Spinner] Saving...

// Custom labels
<AndamioSaveButton
  onClick={handleSave}
  isSaving={isPending}
  label="Save Draft"
  savingLabel="Saving Draft..."
/>

// With variant and disabled state
<AndamioSaveButton
  variant="outline"
  onClick={handleSave}
  isSaving={isPending}
  disabled={!hasChanges}
/>

// Conditionally show only when there are unsaved changes
{hasUnsavedChanges && (
  <AndamioSaveButton onClick={handleSave} isSaving={isPending} compact />
)}
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isSaving` | `boolean` | `false` | Whether save operation is in progress |
| `compact` | `boolean` | `false` | Use compact mode (smaller, just "Save") |
| `label` | `string` | "Save Changes" / "Save" | Custom button label |
| `savingLabel` | `string` | "Saving..." | Custom label while saving |
| `...buttonProps` | `AndamioButtonProps` | - | All AndamioButton props (variant, size, disabled, onClick, etc.) |

**Features**:
- Automatic SaveIcon / LoadingIcon swap based on `isSaving` state
- Loading spinner animates with `animate-spin`
- Inherits all AndamioButton props for flexibility
- Compact mode uses `size="sm"` automatically

---

### AndamioBackButton

**File**: `src/components/andamio/andamio-back-button.tsx`

**Extracted From**: Style review session (2024-12) - Found 29 occurrences

**Purpose**: Standardized back navigation button with consistent styling. Always ghost variant, small size, with BackIcon.

**Pattern Replaced**:
```tsx
<Link href="/some-path">
  <AndamioButton variant="ghost" size="sm">
    <BackIcon className="h-4 w-4 mr-1" />
    Back to Something
  </AndamioButton>
</Link>
```

**Usage**:
```tsx
import { AndamioBackButton } from "~/components/andamio";

// Basic (default label "Back")
<AndamioBackButton href="/courses" />

// Custom label
<AndamioBackButton href="/studio/project/abc/tasks" label="Back to Tasks" />
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `href` | `string` | required | The URL to navigate to |
| `label` | `string` | "Back" | The button label text |
| `className` | `string` | - | Optional className for styling |

**Features**:
- Automatically wraps in Next.js Link
- Ghost variant, small size (consistent across app)
- BackIcon with proper spacing

---

### AndamioAddButton

**File**: `src/components/andamio/andamio-add-button.tsx`

**Extracted From**: Style review session (2024-12) - Found 20+ occurrences

**Purpose**: Standardized add/create button with built-in loading state.

**Pattern Replaced**:
```tsx
<AndamioButton onClick={handleCreate} disabled={isCreating}>
  {isCreating ? (
    <LoadingIcon className="h-4 w-4 mr-2 animate-spin" />
  ) : (
    <AddIcon className="h-4 w-4 mr-2" />
  )}
  {isCreating ? "Creating..." : "Create Task"}
</AndamioButton>
```

**Usage**:
```tsx
import { AndamioAddButton } from "~/components/andamio";

// Default "Create" button
<AndamioAddButton onClick={handleCreate} isLoading={isCreating} />

// Custom label
<AndamioAddButton onClick={handleCreate} label="Create Task" isLoading={isCreating} />

// Compact for toolbars
<AndamioAddButton onClick={handleAdd} compact />
// Shows: [AddIcon] Add

// Inside a Link (for navigation)
<Link href="/new-item">
  <AndamioAddButton label="New Task" />
</Link>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isLoading` | `boolean` | `false` | Show loading state |
| `compact` | `boolean` | `false` | Use compact mode (smaller, "Add" label) |
| `label` | `string` | "Create" / "Add" | Custom button label |
| `loadingLabel` | `string` | "Creating..." | Custom label while loading |
| `...buttonProps` | `AndamioButtonProps` | - | All AndamioButton props |

**Features**:
- Automatic AddIcon / LoadingIcon swap based on `isLoading` state
- Loading spinner animates with `animate-spin`
- Compact mode for toolbars and tight spaces

---

### AndamioDeleteButton

**File**: `src/components/andamio/andamio-delete-button.tsx`

**Extracted From**: Style review session (2024-12) - Found 10 occurrences

**Purpose**: Standardized delete button with built-in confirmation dialog.

**Pattern Replaced**:
```tsx
<AndamioConfirmDialog
  trigger={
    <AndamioButton variant="ghost" size="sm" disabled={isDeleting}>
      <DeleteIcon className="h-4 w-4 text-destructive" />
    </AndamioButton>
  }
  title="Delete Task"
  description="Are you sure you want to delete this task?"
  confirmText="Delete"
  variant="destructive"
  onConfirm={handleDelete}
  isLoading={isDeleting}
/>
```

**Usage**:
```tsx
import { AndamioDeleteButton } from "~/components/andamio";

// Basic (auto-generates title and description)
<AndamioDeleteButton
  onConfirm={() => handleDelete(item.id)}
  itemName="task"
  isLoading={isDeleting}
/>
// Dialog shows: "Delete task?" / "Are you sure you want to delete this task?"

// Custom confirmation text
<AndamioDeleteButton
  onConfirm={handleDelete}
  title="Remove Module"
  description="This will permanently delete the module and all its lessons."
  isLoading={isDeleting}
/>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onConfirm` | `() => void \| Promise<void>` | required | Callback when deletion is confirmed |
| `itemName` | `string` | "item" | Name of item (for auto-generated text) |
| `title` | `string` | `Delete {itemName}?` | Custom dialog title |
| `description` | `string` | Auto-generated | Custom confirmation description |
| `isLoading` | `boolean` | `false` | Show loading state in dialog |
| `disabled` | `boolean` | `false` | Disable the trigger button |
| `className` | `string` | - | Optional className for trigger button |

**Features**:
- Built-in confirmation dialog (AndamioConfirmDialog)
- Destructive variant by default
- DeleteIcon with destructive color
- Auto-generates sensible confirmation text

---

### AndamioErrorAlert

**File**: `src/components/andamio/andamio-error-alert.tsx`

**Extracted From**: Style review session (2024-12) - Found 10+ occurrences

**Purpose**: Standardized error alert with consistent styling.

**Pattern Replaced**:
```tsx
<AndamioAlert variant="destructive">
  <AlertIcon className="h-4 w-4" />
  <AndamioAlertTitle>Error</AndamioAlertTitle>
  <AndamioAlertDescription>{error}</AndamioAlertDescription>
</AndamioAlert>
```

**Usage**:
```tsx
import { AndamioErrorAlert } from "~/components/andamio";

// Basic usage
{error && <AndamioErrorAlert error={error} />}

// Custom title
<AndamioErrorAlert error="Failed to save" title="Save Error" />
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `error` | `string` | required | The error message to display |
| `title` | `string` | "Error" | Optional custom title |
| `className` | `string` | - | Optional className for the alert |

**Features**:
- Destructive variant (red styling)
- AlertIcon included automatically
- Consistent structure across all error displays

---

### AndamioEditButton

**File**: `src/components/andamio/andamio-edit-button.tsx`

**Extracted From**: Style review session (2024-12) - Found 16 occurrences

**Purpose**: Standardized edit button with integrated Next.js Link for navigation.

**Pattern Replaced**:
```tsx
<Link href={`/studio/project/${id}/edit`}>
  <AndamioButton variant="ghost" size="sm">
    <EditIcon className="h-4 w-4" />
  </AndamioButton>
</Link>
```

**Usage**:
```tsx
import { AndamioEditButton } from "~/components/andamio";

// Icon only (default, for table rows)
<AndamioEditButton href={`/studio/project/${id}/edit`} />

// With label (for standalone buttons)
<AndamioEditButton href={`/studio/project/${id}/edit`} label="Edit Project" iconOnly={false} />
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `href` | `string` | required | The URL to navigate to |
| `label` | `string` | "Edit" | Button label (when not icon-only) |
| `iconOnly` | `boolean` | `true` | Show only icon (no label) |
| `...buttonProps` | `AndamioButtonProps` | - | All AndamioButton props |

**Features**:
- Automatically wraps in Next.js Link
- Ghost variant, small size by default
- Icon-only mode for table rows (default)
- Full label mode for standalone buttons

---

### AndamioRemoveButton

**File**: `src/components/andamio/andamio-remove-button.tsx`

**Extracted From**: Style review session (2024-12) - Found 17 occurrences

**Purpose**: Standardized remove/close button for list items (acceptance criteria, tags, etc.).

**Pattern Replaced**:
```tsx
<AndamioButton
  variant="ghost"
  size="sm"
  onClick={() => removeCriterion(index)}
  className="text-muted-foreground hover:text-destructive"
>
  <CloseIcon className="h-4 w-4" />
</AndamioButton>
```

**Usage**:
```tsx
import { AndamioRemoveButton } from "~/components/andamio";

// Basic usage (for list items)
<AndamioRemoveButton
  onClick={() => removeCriterion(index)}
  ariaLabel={`Remove criterion ${index + 1}`}
/>

// With visible label
<AndamioRemoveButton
  onClick={() => removeItem(id)}
  label="Remove"
/>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onClick` | `() => void` | required | Callback when button is clicked |
| `label` | `string` | - | Optional visible label |
| `ariaLabel` | `string` | "Remove" | Accessibility label |
| `...buttonProps` | `AndamioButtonProps` | - | All AndamioButton props |

**Features**:
- Ghost variant with muted color by default
- Hover state transitions to destructive color
- Compact size for inline list usage
- CloseIcon included automatically

---

### AndamioRowActions

**File**: `src/components/andamio/andamio-row-actions.tsx`

**Extracted From**: Style review session (2024-12) - Composite pattern

**Purpose**: Composite component combining edit and delete actions for table rows.

**Pattern Replaced**:
```tsx
<AndamioTableCell className="text-right">
  <div className="flex items-center justify-end gap-1">
    <Link href={`/edit/${id}`}>
      <AndamioButton variant="ghost" size="sm">
        <EditIcon className="h-4 w-4" />
      </AndamioButton>
    </Link>
    <AndamioConfirmDialog
      trigger={
        <AndamioButton variant="ghost" size="sm">
          <DeleteIcon className="h-4 w-4 text-destructive" />
        </AndamioButton>
      }
      onConfirm={() => handleDelete(id)}
      ...
    />
  </div>
</AndamioTableCell>
```

**Usage**:
```tsx
import { AndamioRowActions } from "~/components/andamio";

// Both edit and delete
<AndamioRowActions
  editHref={`/studio/project/${id}/draft-tasks/${task.index}`}
  onDelete={() => handleDelete(task.index)}
  itemName="task"
  deleteDescription={`Are you sure you want to delete "${task.title}"?`}
  isDeleting={deletingTaskIndex === task.index}
/>

// Edit only
<AndamioRowActions
  editHref={`/studio/course/${id}/edit`}
/>

// Delete only
<AndamioRowActions
  onDelete={() => handleDelete(id)}
  itemName="module"
  isDeleting={isDeleting}
/>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `editHref` | `string` | - | URL for edit button (shows edit button if provided) |
| `onDelete` | `() => void \| Promise<void>` | - | Delete callback (shows delete button if provided) |
| `itemName` | `string` | "item" | Name of item (for delete confirmation) |
| `deleteTitle` | `string` | `Delete {itemName}?` | Custom delete dialog title |
| `deleteDescription` | `string` | Auto-generated | Custom delete confirmation text |
| `isDeleting` | `boolean` | `false` | Show loading state in delete dialog |
| `disabled` | `boolean` | `false` | Disable both buttons |
| `className` | `string` | - | Additional className for container |

**Features**:
- Combines AndamioEditButton and AndamioDeleteButton
- Consistent horizontal gap between buttons
- Shows only the actions that are provided
- Built-in confirmation dialog for delete

---

### AndamioCardIconHeader

**File**: `src/components/andamio/andamio-card-icon-header.tsx`

**Extracted From**: Style review session (2024-12) - Found 20+ occurrences

**Purpose**: Standardized icon + title combination for card headers.

**Pattern Replaced**:
```tsx
<div className="flex items-center gap-2">
  <DatabaseIcon className="h-5 w-5 text-muted-foreground" />
  <AndamioCardTitle className="text-base">On-Chain Data</AndamioCardTitle>
</div>
```

**Usage**:
```tsx
import { AndamioCardIconHeader } from "~/components/andamio";

// Basic usage
<AndamioCardHeader>
  <AndamioCardIconHeader icon={DatabaseIcon} title="On-Chain Data" />
</AndamioCardHeader>

// With description
<AndamioCardHeader>
  <AndamioCardIconHeader
    icon={CourseIcon}
    title="Course Progress"
    description="Track your learning journey"
  />
</AndamioCardHeader>

// Custom icon color
<AndamioCardIconHeader
  icon={SuccessIcon}
  title="Completed"
  iconColor="text-success"
/>

// With right-aligned actions (wrap in flex justify-between)
<AndamioCardHeader>
  <div className="flex items-center justify-between">
    <AndamioCardIconHeader icon={DatabaseIcon} title="On-Chain Data" />
    <AndamioButton variant="ghost" size="icon-sm" onClick={refetch}>
      <RefreshIcon className="h-4 w-4" />
    </AndamioButton>
  </div>
</AndamioCardHeader>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `IconComponent` | required | Icon component from ~/components/icons |
| `title` | `string` | required | Card title text |
| `description` | `string` | - | Optional description text |
| `iconColor` | `string` | "text-muted-foreground" | Icon color class |
| `className` | `string` | - | Additional className for container |

**Features**:
- Consistent icon sizing (h-5 w-5)
- Automatic gap spacing
- Supports title-only or title + description layouts
- Works inside AndamioCardHeader

---

### AndamioActionFooter

**File**: `src/components/andamio/andamio-action-footer.tsx`

**Extracted From**: Style review session (2024-12) - Found 12+ occurrences

**Purpose**: Standardized footer for action buttons in cards/forms.

**Pattern Replaced**:
```tsx
<div className="flex justify-end gap-2 pt-4 border-t">
  <AndamioButton variant="outline">Cancel</AndamioButton>
  <AndamioSaveButton onClick={handleSave} isSaving={isSaving} />
</div>
```

**Usage**:
```tsx
import { AndamioActionFooter } from "~/components/andamio";

// Basic right-aligned buttons
<AndamioActionFooter>
  <AndamioButton variant="outline">Cancel</AndamioButton>
  <AndamioSaveButton onClick={handleSave} isSaving={isSaving} />
</AndamioActionFooter>

// With border divider (inside card content)
<AndamioCardContent>
  {/* form fields */}
  <AndamioActionFooter showBorder>
    <AndamioButton variant="outline">Cancel</AndamioButton>
    <AndamioButton>Submit</AndamioButton>
  </AndamioActionFooter>
</AndamioCardContent>

// Split layout (destructive left, confirm right)
<AndamioActionFooter align="between">
  <AndamioDeleteButton onConfirm={handleDelete} itemName="item" />
  <div className="flex gap-2">
    <AndamioButton variant="outline">Cancel</AndamioButton>
    <AndamioButton>Confirm</AndamioButton>
  </div>
</AndamioActionFooter>

// Left-aligned buttons
<AndamioActionFooter align="start">
  <AndamioButton>Action</AndamioButton>
</AndamioActionFooter>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | required | Content (buttons) |
| `align` | `"start" \| "end" \| "between" \| "center"` | "end" | Alignment of children |
| `showBorder` | `boolean` | `false` | Show top border as divider |
| `className` | `string` | - | Additional className |

**Features**:
- Consistent gap-2 spacing between buttons
- Optional border-t divider with pt-4 padding
- Multiple alignment options
- Works inside cards, dialogs, or standalone

---

## Guidelines for Extraction

When reviewing routes, look for these patterns that should be extracted:

1. **Error/Not Found States** - Any `AndamioAlert variant="destructive"` pattern with title and description
2. **Empty States** - Centered content with icon, title, description, and optional action
3. **Stat Displays** - Icon + value + label patterns in cards or grids
4. **Repeated Card Layouts** - Any card structure used in multiple places
5. **Loading States** - Skeleton patterns that repeat across components

When extracting:
1. Create the component in `src/components/andamio/` with `andamio-` prefix
2. Export from `src/components/andamio/index.ts`
3. Document in this file with props table and usage examples
4. Update the original code to use the new component
