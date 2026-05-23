# Centralized Icon System

## Overview

All icons in the Andamio T3 App Template must be imported from the centralized icon system at `~/components/icons`. Direct imports from `lucide-react` are prohibited in application code.

## Rules

### Rule 1: No Direct Lucide Imports

**CRITICAL: Never import icons directly from lucide-react in application code.**

```tsx
// ❌ WRONG - Direct lucide-react import
import { Award, Target, BookOpen } from "lucide-react";

// ✅ CORRECT - Import from centralized icons
import { CredentialIcon, SLTIcon, CourseIcon } from "~/components/icons";
```

### Rule 2: Use Semantic Icon Names

Icons have semantic names that describe their purpose in the Andamio context, not their visual appearance.

```tsx
// ❌ WRONG - Using visual names
<Award className="h-4 w-4" />
<Target className="h-4 w-4" />

// ✅ CORRECT - Using semantic names
<CredentialIcon className="h-4 w-4" />
<SLTIcon className="h-4 w-4" />
```

### Rule 3: Exceptions

The following locations MAY import directly from lucide-react:
- `src/components/icons/` - The icon system definitions themselves
- `src/components/ui/` - shadcn/ui primitives (internal implementation)

## Icon Categories

### Entity Icons - Andamio Domain Concepts

| Semantic Name | Lucide Icon | Use For |
|---------------|-------------|---------|
| `CourseIcon` | BookOpen | Courses, learning containers |
| `ModuleIcon` | Layers | Course modules |
| `CredentialIcon` | Award | Verifiable credentials, achievements |
| `AchievementIcon` | Trophy | Major accomplishments |
| `SLTIcon` | Target | Student Learning Targets |
| `LessonIcon` | FileText | Lesson content |
| `AssignmentIcon` | ClipboardList | Assignment tasks |
| `IntroductionIcon` | FileEdit | Module introductions |
| `DiplomaIcon` | ScrollText | Completed/accepted assignments |
| `LearnerIcon` | GraduationCap | Students, learners |
| `TeacherIcon` | Users | Instructors, teachers |
| `InstructorIcon` | Crown | Course owners |
| `OwnerIcon` | Crown | Entity owner (courses, projects) |
| `AccessTokenIcon` | Key | Access tokens, on-chain identity |
| `KeyIcon` | KeyRound | API keys, authentication keys |
| `WalletIcon` | Wallet | Blockchain wallets |
| `UserIcon` | User | Generic user/person |
| `ManagerIcon` | UserCog | Project managers |
| `ContributorIcon` | UserCheck | Project contributors |
| `BlockIcon` | Ban | Blacklisting/blocking actions |
| `MailIcon` | Mail | Communication, notifications |
| `PaymentIcon` | CreditCard | Payment methods, billing |
| `DeveloperIcon` | Code2 | API users, builders |
| `ProjectIcon` | FolderKanban | Projects |
| `TaskIcon` | ListChecks | Project tasks |
| `TreasuryIcon` | Coins | Treasury, funding |
| `OnChainIcon` | Blocks | Blockchain/on-chain status |
| `TransactionIcon` | Hash | Blockchain transactions |
| `TokenIcon` | Coins | Tokens |
| `SignatureIcon` | PenLine | Wallet/cryptographic signatures |

### Status Icons - State Indicators

| Semantic Name | Lucide Icon | Use For |
|---------------|-------------|---------|
| `SuccessIcon` | CheckCircle | Success states |
| `CompletedIcon` | Check | Step/task completion |
| `CheckIcon` | Check | Generic checkmark (alias) |
| `VerifiedIcon` | CheckCircle2 | Verified states |
| `ErrorIcon` | XCircle | Error states |
| `AlertIcon` | AlertCircle | General alerts (circle) |
| `WarningIcon` | AlertTriangle | Important warnings (triangle) |
| `InfoIcon` | Info | Informational messages |
| `SecurityAlertIcon` | ShieldAlert | Security warnings |
| `LoadingIcon` | Loader2 | Loading/async states |
| `PendingIcon` | Clock | Pending/waiting states |
| `NeutralIcon` | Circle | Neutral indicators |
| `LockedIcon` | Lock | Locked/unavailable |
| `LiveIcon` | CheckCircle | Published/active |
| `DraftIcon` | FileEdit | Draft status |

### Action Icons - User Operations

| Semantic Name | Lucide Icon | Use For |
|---------------|-------------|---------|
| `AddIcon` | Plus | Add/create actions |
| `EditIcon` | Pencil | Edit actions |
| `DeleteIcon` | Trash2 | Delete actions |
| `SaveIcon` | Save | Save actions |
| `UndoIcon` | Undo2 | Undo/discard changes |
| `SendIcon` | Send | Submit/send actions |
| `CopyIcon` | Copy | Copy to clipboard |
| `DownloadIcon` | Download | Download/import content |
| `ShareIcon` | Share | Share content |
| `StarIcon` | Star | Favorite/bookmark |
| `RefreshIcon` | RefreshCw | Refresh/retry |
| `PreviewIcon` | Eye | Preview/view |
| `DragHandleIcon` | GripVertical | Drag to reorder |
| `SkipIcon` | SkipForward | Skip step |
| `SparkleIcon` | Sparkles | Special/featured actions |
| `CelebrateIcon` | PartyPopper | Success celebrations |
| `TipIcon` | Lightbulb | Tips/hints |
| `AssessIcon` | ClipboardCheck | Assessment/review |
| `LogOutIcon` | LogOut | Sign out/disconnect |

### Navigation Icons - Direction & Navigation

| Semantic Name | Lucide Icon | Use For |
|---------------|-------------|---------|
| `BackIcon` | ArrowLeft | Navigate back |
| `ForwardIcon` | ArrowRight | Navigate forward |
| `NextIcon` | ChevronRight | Next item |
| `PreviousIcon` | ChevronLeft | Previous item |
| `ExpandIcon` | ChevronDown | Expand content |
| `CollapseIcon` | ChevronUp | Collapse content |
| `ExternalLinkIcon` | ExternalLink | External links |
| `MoreIcon` | MoreHorizontal | More options |
| `CloseIcon` | X | Close/dismiss |

### UI Icons - General Interface

| Semantic Name | Lucide Icon | Use For |
|---------------|-------------|---------|
| `SearchIcon` | Search | Search functionality |
| `FilterIcon` | Filter | Filter options |
| `SettingsIcon` | Settings | Settings/config |
| `ShieldIcon` | Shield | Security features |
| `ListViewIcon` | List | List view toggle |
| `TableViewIcon` | Table | Table view toggle |
| `GridViewIcon` | Grid3x3 | Grid view toggle |
| `EmptyIcon` | Inbox | Empty states |
| `ImagePlaceholderIcon` | ImageIcon | Image placeholders |
| `VideoIcon` | Video | Video content |
| `ChartIcon` | BarChart3 | Analytics/charts |
| `HistoryIcon` | History | History/logs |
| `DashboardIcon` | LayoutDashboard | Dashboard views |
| `LayoutIcon` | Layout | Generic layout |
| `MenuIcon` | Menu | Navigation menu |
| `SidebarIcon` | PanelLeft | Sidebar toggle |
| `MonitorIcon` | Monitor | Display/screen |
| `LightModeIcon` | Sun | Light theme |
| `DarkModeIcon` | Moon | Dark theme |
| `ThemeIcon` | Palette | Theme customization |
| `SitemapIcon` | Map | Site structure |
| `GlobalIcon` | Globe | Worldwide/public scope |
| `ExploreIcon` | Compass | Discovery/exploration |
| `DatabaseIcon` | Database | Data storage |
| `ServerIcon` | Server | Backend/server |
| `SortIcon` | ArrowUpDown | Sort toggle |
| `LinkIcon` | Link | Linked relationships |
| `TestIcon` | Beaker | Testing functionality |
| `CalendarIcon` | Calendar | Date/schedule |

## Adding New Icons

When you need a new icon:

1. **Check if a semantic icon already exists** in `~/components/icons`
2. **If not, add it to the appropriate category file**:
   - `entity-icons.ts` - Domain entities
   - `status-icons.ts` - State indicators
   - `action-icons.ts` - User actions
   - `navigation-icons.ts` - Navigation
   - `ui-icons.ts` - General UI
3. **Export from index.ts**
4. **Use a semantic name** that describes the PURPOSE, not the visual

Example:
```typescript
// In entity-icons.ts
/** Badges - achievement badges */
export { Medal as BadgeIcon } from "lucide-react";

// In index.ts, add to exports
export { BadgeIcon } from "./entity-icons";
```

## Verification Commands

```bash
# Find any remaining direct lucide-react imports (should only be in icons/ and ui/)
grep -r "from \"lucide-react\"" src/app src/components --include="*.tsx" | grep -v "src/components/icons/" | grep -v "src/components/ui/"

# This should return NO results for a compliant codebase
```

## Benefits

1. **Single source of truth** - Change an icon mapping once, updates everywhere
2. **Easy library swap** - Replace Lucide with another library by updating mappings
3. **Semantic clarity** - `CredentialIcon` is clearer than remembering "Award = credential"
4. **Discoverability** - All available icons visible in one import location
5. **Consistency** - Same icon used for same concept across the app
