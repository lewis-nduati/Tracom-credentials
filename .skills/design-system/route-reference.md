# Route & Layout Reference

Bi-directional reference mapping all routes to their layouts and vice versa.

---

## Layout Summary

| Layout | Route Group | Routes | Description |
|--------|-------------|--------|-------------|
| Landing | `/` (root) | 1 | Marketing page, no sidebar |
| App Shell | `(app)/*` | 12 | Sidebar + content area |
| Studio Shell | `(studio)/*` | 16 | Persistent sidebar + StudioHeader + split-pane workspace |

**Total Routes**: 29

---

## Layouts → Routes

### 1. Landing Layout (1 route)

No sidebar, marketing-style full-page layout.

| Route | Purpose |
|-------|---------|
| `/` | Landing/marketing page |

**Characteristics**:
- Full viewport sections
- Centered content (max-w-3xl)
- Marketing copy and CTAs
- No sidebar navigation

---

### 2. App Shell Layout (12 routes)

Sidebar navigation with scrollable content area.

**Components**: `AppLayout`, `AppSidebar`

```
┌─────────┬────────────────────────┐
│ Sidebar │  Content (scrollable)  │
│  256px  │  AndamioPageHeader     │
│         │  Page content...       │
└─────────┴────────────────────────┘
```

#### Dashboard & Core
| Route | Purpose | Page Pattern |
|-------|---------|--------------|
| `/dashboard` | User overview | Standard |
| `/credentials` | On-chain credentials display | Standard |
| `/sitemap` | Route documentation | Standard |
| `/components` | Component showcase | Standard |
| `/editor` | Editor demo | Standard |

#### Course Browsing
| Route | Purpose | Page Pattern |
|-------|---------|--------------|
| `/course` | Course list | Standard with cards |
| `/course/[coursenft]` | Course detail | Detail page |
| `/course/[coursenft]/[modulecode]` | Module detail | Detail page |
| `/course/[coursenft]/[modulecode]/[moduleindex]` | Lesson view | Detail page |
| `/course/[coursenft]/[modulecode]/assignment` | Assignment view | Detail page |

#### Project Browsing
| Route | Purpose | Page Pattern |
|-------|---------|--------------|
| `/project` | Project list | Standard with cards |
| `/project/[projectid]` | Project detail | Detail page |
| `/project/[projectid]/[taskhash]` | Task detail | Detail page |

---

### 3. Studio Shell Layout (16 routes)

Persistent sidebar (courses + projects list) + StudioHeader + split-pane workspace.

**Components**: `StudioSidebarLayout`, `StudioHeader`, `StudioProvider`

```
┌─────────────────┬────────────────────────┐
│ Studio Sidebar   │ StudioHeader           │
│ (resizable 20%) ├────────────────────────┤
│                  │  Workspace             │
│ Courses          │  (full height)         │
│ - Course 1       │                        │
│ - Course 2       │                        │
│                  │                        │
│ Projects         │                        │
│ - Project 1      │                        │
│                  │                        │
│ [Search...]      │                        │
└─────────────────┴────────────────────────┘
```

#### Studio Home
| Route | Purpose | Page Pattern |
|-------|---------|--------------|
| `/studio` | Studio welcome + create flows | Welcome / Create forms |

#### Course Studio
| Route | Purpose | Page Pattern |
|-------|---------|--------------|
| `/studio/course` | Course studio landing | Redirect to `/studio` |
| `/studio/course/[coursenft]` | Course editor (tabs: Course, Credentials, Commitments, Settings) | Editor |
| `/studio/course/[coursenft]/teacher` | Instructor dashboard — review submissions | Standard |
| `/studio/course/[coursenft]/new` | New module wizard | **Wizard** (sidebar hides) |
| `/studio/course/[coursenft]/[modulecode]` | Module wizard editor | **Wizard** (sidebar hides) |
| `/studio/course/[coursenft]/[modulecode]/introduction` | Introduction editor | **Wizard** (sidebar hides) |
| `/studio/course/[coursenft]/[modulecode]/slts` | SLT management | **Wizard** (sidebar hides) |
| `/studio/course/[coursenft]/[modulecode]/assignment` | Assignment editor | **Wizard** (sidebar hides) |
| `/studio/course/[coursenft]/[modulecode]/[moduleindex]` | Lesson editor | **Wizard** (sidebar hides) |

#### Project Studio
| Route | Purpose | Page Pattern |
|-------|---------|--------------|
| `/studio/project/[projectid]` | Project dashboard (tabs: settings, treasury, blacklist) | Editor |
| `/studio/project/[projectid]/commitments` | Commitment review (list + detail panels) | Master-Detail |
| `/studio/project/[projectid]/draft-tasks` | Draft tasks list | Standard |
| `/studio/project/[projectid]/draft-tasks/new` | New draft task | Form |
| `/studio/project/[projectid]/draft-tasks/[taskindex]` | Edit draft task | Form |
| `/studio/project/[projectid]/manage-contributors` | Contributor management | Standard |

**Note**: The studio sidebar hides automatically when in wizard mode (module editing routes).

---

## Routes → Layouts

### By URL Path (alphabetical)

| Route | Layout | Page Pattern |
|-------|--------|--------------|
| `/` | Landing | Marketing |
| `/components` | App Shell | Standard |
| `/course` | App Shell | Standard |
| `/course/[coursenft]` | App Shell | Detail |
| `/course/[coursenft]/[modulecode]` | App Shell | Detail |
| `/course/[coursenft]/[modulecode]/[moduleindex]` | App Shell | Detail |
| `/course/[coursenft]/[modulecode]/assignment` | App Shell | Detail |
| `/credentials` | App Shell | Standard |
| `/dashboard` | App Shell | Standard |
| `/editor` | App Shell | Standard |
| `/project` | App Shell | Standard |
| `/project/[projectid]` | App Shell | Detail |
| `/project/[projectid]/[taskhash]` | App Shell | Detail |
| `/sitemap` | App Shell | Standard |
| `/studio` | **Studio Shell** | Welcome / Create |
| `/studio/course` | **Studio Shell** | Redirect |
| `/studio/course/[coursenft]` | **Studio Shell** | Editor |
| `/studio/course/[coursenft]/teacher` | **Studio Shell** | Standard |
| `/studio/course/[coursenft]/new` | **Studio Shell** | Wizard |
| `/studio/course/[coursenft]/[modulecode]` | **Studio Shell** | Wizard |
| `/studio/course/[coursenft]/[modulecode]/introduction` | **Studio Shell** | Wizard |
| `/studio/course/[coursenft]/[modulecode]/slts` | **Studio Shell** | Wizard |
| `/studio/course/[coursenft]/[modulecode]/assignment` | **Studio Shell** | Wizard |
| `/studio/course/[coursenft]/[modulecode]/[moduleindex]` | **Studio Shell** | Wizard |
| `/studio/project/[projectid]` | **Studio Shell** | Editor |
| `/studio/project/[projectid]/commitments` | **Studio Shell** | Master-Detail |
| `/studio/project/[projectid]/draft-tasks` | **Studio Shell** | Standard |
| `/studio/project/[projectid]/draft-tasks/[taskindex]` | **Studio Shell** | Form |
| `/studio/project/[projectid]/draft-tasks/new` | **Studio Shell** | Form |
| `/studio/project/[projectid]/manage-contributors` | **Studio Shell** | Standard |

---

## Page Patterns Within Layouts

Some pages use additional patterns within their layout:

### Split-Pane Pattern (Studio)
- **Route**: All `/studio/*` routes
- **Left Panel**: Persistent sidebar with courses + projects (resizable, 20% default)
- **Right Panel**: Page content
- **Components**: `AndamioResizablePanelGroup`, `CourseListItem`, `ProjectListItem`, `SectionHeader`
- **Search**: Bottom-docked search input filters both lists
- **Create**: Context-based create forms via `StudioProvider` / `useStudioContext`

### Master-Detail Pattern
- **Route**: `/studio/project/[projectid]/commitments`
- **Left Panel**: Commitment list (selectable items)
- **Right Panel**: Commitment detail with evidence rendering
- **Components**: `ResizablePanelGroup`, `ContentDisplay`

### Wizard Pattern
- **Routes**: `/studio/course/[coursenft]/[modulecode]`, `/new`, `/introduction`, `/slts`, `/assignment`, `/[moduleindex]`
- **Left Panel**: Step outline with progress
- **Right Panel**: Current step content
- **Components**: `StudioOutlinePanel`, step components, `WizardContext`
- **Note**: Studio sidebar hides automatically in wizard mode

### Card Grid Pattern
- **Routes**: `/course`, `/project`
- **Layout**: Responsive grid of cards
- **Components**: Course/project cards

### Detail Page Pattern
- **Routes**: `/course/[id]`, `/project/[id]`, etc.
- **Layout**: Breadcrumb + content sections
- **Components**: `CourseBreadcrumb`, section headers

### Form Pattern
- **Routes**: `/studio/project/[id]/draft-tasks/*`
- **Layout**: Form fields with actions
- **Components**: Form inputs, submit buttons

---

## File Locations

### Layouts
```
src/app/layout.tsx              # Root (providers only)
src/app/(app)/layout.tsx        # App Shell
src/app/(studio)/layout.tsx     # Studio Shell
```

### Layout Components
```
src/components/layout/app-layout.tsx      # App Shell wrapper
src/components/layout/app-sidebar.tsx     # Sidebar navigation
src/components/layout/studio-header.tsx   # Studio header with breadcrumbs
src/app/(studio)/studio/layout.tsx        # Studio persistent sidebar layout
src/app/(studio)/studio/studio-context.tsx # Studio create mode context
```

---

## Architecture Notes

**Route Group Meaning**:
- `(app)` = Standard app pages for browsing/viewing (sidebar nav)
- `(studio)` = Dense creation/editing workspace (persistent sidebar + StudioHeader)

**Studio Sidebar Behavior**:
- Persistent sidebar shows all courses + projects with search
- Sidebar hides automatically in wizard mode (module editing routes)
- Create flows triggered via context (`StudioProvider`) — no URL params needed

---

## Adding New Routes

1. **Determine the layout**: Is it viewing/browsing (App Shell) or creating/editing (Studio Shell)?

2. **Choose page pattern**: Standard, Detail, Master-Detail, Wizard, Form, Card Grid?

3. **Add to correct route group**:
   - `src/app/(app)/your-route/page.tsx` for App Shell
   - `src/app/(studio)/your-route/page.tsx` for Studio Shell

4. **Update this document** with the new route

5. **Add to navigation** if applicable:
   - `src/components/layout/app-sidebar.tsx` for sidebar nav
   - Breadcrumb configuration if using StudioHeader
