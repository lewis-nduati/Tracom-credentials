/**
 * Centralized Icon System
 *
 * All icons should be imported from this module, not directly from lucide-react.
 * This enables:
 * 1. Easy customization of icon sets
 * 2. Consistent semantic naming across the app
 * 3. Single source of truth for all icons
 *
 * @example
 * ```tsx
 * // ✅ CORRECT - Import from centralized icons
 * import { CredentialIcon, SLTIcon, CourseIcon } from "~/components/icons";
 *
 * // ❌ WRONG - Direct lucide-react imports
 * import { Award, Target, BookOpen } from "lucide-react";
 * ```
 *
 * Icon Categories:
 * - Entity Icons: Andamio domain concepts (Course, Module, Credential, SLT, etc.)
 * - Status Icons: State indicators (Success, Error, Pending, Loading, etc.)
 * - Action Icons: User operations (Add, Edit, Delete, Save, etc.)
 * - Navigation Icons: Direction and navigation (Back, Forward, Expand, etc.)
 * - UI Icons: General interface elements (Search, Settings, Menu, etc.)
 */

// =============================================================================
// Entity Icons - Andamio Domain Concepts
// =============================================================================
export {
  // Course & Learning
  CourseIcon,
  ModuleIcon,
  CredentialIcon,
  AchievementIcon,
  SLTIcon,
  LessonIcon,
  AssignmentIcon,
  IntroductionIcon,
  DiplomaIcon,
  // Users & Roles
  LearnerIcon,
  TeacherIcon,
  InstructorIcon,
  OwnerIcon,
  AccessTokenIcon,
  KeyIcon,
  WalletIcon,
  UserIcon,
  ManagerIcon,
  ContributorIcon,
  BlockIcon,
  MailIcon,
  PaymentIcon,
  BillingIcon,
  DeveloperIcon,
  // Projects & Contributions
  ProjectIcon,
  TaskIcon,
  TreasuryIcon,
  // Blockchain
  OnChainIcon,
  TransactionIcon,
  TokenIcon,
  SignatureIcon,
  TerminalIcon,
} from "./entity-icons";

// =============================================================================
// Status Icons - State Indicators
// =============================================================================
export {
  // Completion & Success
  SuccessIcon,
  CompletedIcon,
  CheckIcon,
  VerifiedIcon,
  // Errors & Warnings
  ErrorIcon,
  AlertIcon,
  WarningIcon,
  InfoIcon,
  SecurityAlertIcon,
  // Progress & Loading
  LoadingIcon,
  PendingIcon,
  NeutralIcon,
  // Availability
  LockedIcon,
  LiveIcon,
  DraftIcon,
} from "./status-icons";

// =============================================================================
// Action Icons - User Operations
// =============================================================================
export {
  // CRUD
  AddIcon,
  EditIcon,
  DeleteIcon,
  SaveIcon,
  UndoIcon,
  // Content Actions
  SendIcon,
  CopyIcon,
  DownloadIcon,
  UploadIcon,
  FolderIcon,
  ShareIcon,
  StarIcon,
  RefreshIcon,
  PreviewIcon,
  // Reordering
  DragHandleIcon,
  SkipIcon,
  // Special Actions
  SparkleIcon,
  CelebrateIcon,
  TipIcon,
  AssessIcon,
  // Session Actions
  LogOutIcon,
} from "./action-icons";

// =============================================================================
// Navigation Icons - Direction & Navigation
// =============================================================================
export {
  // Directional
  BackIcon,
  ForwardIcon,
  NextIcon,
  PreviousIcon,
  // Expand & Collapse
  ExpandIcon,
  CollapseIcon,
  // External & Links
  ExternalLinkIcon,
  MoreIcon,
  // Close
  CloseIcon,
} from "./navigation-icons";

// =============================================================================
// UI Icons - General Interface
// =============================================================================
export {
  // Search & Filter
  SearchIcon,
  FilterIcon,
  // Settings
  SettingsIcon,
  ShieldIcon,
  // View Options
  ListViewIcon,
  TableViewIcon,
  GridViewIcon,
  // Empty States
  EmptyIcon,
  ImagePlaceholderIcon,
  VideoIcon,
  // Data & Analytics
  ChartIcon,
  HistoryIcon,
  // Layout
  DashboardIcon,
  LayoutIcon,
  MenuIcon,
  SidebarIcon,
  MonitorIcon,
  // Theme & Display Mode
  LightModeIcon,
  DarkModeIcon,
  ThemeIcon,
  // Navigation & Discovery
  SitemapIcon,
  GlobalIcon,
  ExploreIcon,
  // Data & System
  DatabaseIcon,
  ServerIcon,
  SortIcon,
  LinkIcon,
  // Special & Misc
  TestIcon,
  CalendarIcon,
} from "./ui-icons";

// =============================================================================
// Type Export for Icon Components
// =============================================================================
export type { LucideIcon } from "lucide-react";
