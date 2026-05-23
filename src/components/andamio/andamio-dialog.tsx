/**
 * Andamio wrapper for shadcn/ui Dialog
 *
 * Re-exports all Dialog components with consistent naming.
 *
 * Usage:
 * import { AndamioDialog, AndamioDialogContent, AndamioDialogHeader } from "~/components/andamio";
 */

// Re-export all dialog components with Andamio prefix
export {
  Dialog as AndamioDialog,
  DialogClose as AndamioDialogClose,
  DialogContent as AndamioDialogContent,
  DialogDescription as AndamioDialogDescription,
  DialogFooter as AndamioDialogFooter,
  DialogHeader as AndamioDialogHeader,
  DialogOverlay as AndamioDialogOverlay,
  DialogPortal as AndamioDialogPortal,
  DialogTitle as AndamioDialogTitle,
  DialogTrigger as AndamioDialogTrigger,
} from "~/components/ui/dialog";
