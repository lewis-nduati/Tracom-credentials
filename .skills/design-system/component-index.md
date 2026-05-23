# Component Index

Quick reference for Andamio components. For full usage docs, see `extracted-components.md`.

## State Components
| Component | Purpose |
|-----------|---------|
| `AndamioNotFoundCard` | 404/error states |
| `AndamioEmptyState` | Empty data states |
| `AndamioPageLoading` | Full-page loading skeleton |
| `AndamioStudioLoading` | Studio layout loading skeleton |
| `AndamioCardLoading` | Card-level loading skeleton |
| `AndamioListLoading` | List item loading skeleton |
| `AndamioSectionLoading` | Section-level loading skeleton |
| `AndamioInlineLoading` | Minimal inline spinner |
| `AndamioErrorAlert` | Error messages |

## Stats & Cards
| Component | Purpose |
|-----------|---------|
| `AndamioStatCard` | Single metric display |
| `AndamioDashboardStat` | Dashboard metric |
| `StudioHubCard` | Studio entry point card |
| `StudioCourseCard` | Course card in studio |
| `StudioModuleCard` | Module card in studio |
| `CourseModuleCard` | Module display card |

> **Note**: `StudioHubCard`, `StudioCourseCard`, and `StudioModuleCard` are in `~/components/studio/`, not `~/components/andamio/`.
| `AccountDetailsCard` | User account info |
| `AndamioCardIconHeader` | Card header with icon |

## Buttons & Actions
| Component | Purpose |
|-----------|---------|
| `AndamioSaveButton` | Save with loading state |
| `AndamioBackButton` | Navigation back |
| `AndamioAddButton` | Add/create action |
| `AndamioEditButton` | Edit action |
| `AndamioDeleteButton` | Delete with confirm |
| `AndamioRemoveButton` | Remove (no confirm) |
| `AndamioRowActions` | Table row action menu |
| `AndamioActionFooter` | Card/dialog footer |

## Layout Patterns
| Component | Purpose |
|-----------|---------|
| `Master-Detail Split Pane` | List + preview layout |
| `Selectable List Item` | Clickable list item |
| `Stats Grid` | Dashboard stats grid |
| `Welcome Panel` | Studio landing panel |

## Form & Input
| Component | Purpose |
|-----------|---------|
| `AndamioSearchInput` | Search field |

## Typography & Display
| Component | Purpose |
|-----------|---------|
| `AndamioText` | Styled paragraph text |
| `AndamioHeading` | Semantic heading with decoupled visual size |
| `AndamioCode` | Formatted JSON/code block display |
| `AndamioSectionDescription` | Centered, constrained section description |
| `CopyId` | Copyable ID with truncation and feedback |
| `AndamioStatusIcon` | Status indicator icon |
| `AndamioBreadcrumb` | Navigation breadcrumbs |

## Dashboard Summaries
| Component | Purpose |
|-----------|---------|
| `EnrolledCoursesSummary` | Student's enrolled courses |
| `PendingReviewsSummary` | Teacher's pending reviews |
| `CredentialsSummary` | User's credentials |
| `OwnedCoursesSummary` | Owner's courses |
| `ContributingProjectsSummary` | Contributor's projects |
| `ManagingProjectsSummary` | Manager's projects |

## Hooks
| Hook | Purpose |
|------|---------|
| `useModuleWizardData` | Module wizard state |
| `useWizardNavigation` | Wizard step navigation |

## Access Control
| Component | Purpose |
|-----------|---------|
| `RequireCourseAccess` | Role-based course access gate |
