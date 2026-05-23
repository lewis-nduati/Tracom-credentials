/**
 * Andamio wrapper for shadcn/ui Select
 *
 * Re-exports all Select components with consistent naming.
 *
 * Usage:
 * import { AndamioSelect, AndamioSelectContent, AndamioSelectItem } from "~/components/andamio";
 */

// Re-export all select components with Andamio prefix
export {
  Select as AndamioSelect,
  SelectContent as AndamioSelectContent,
  SelectGroup as AndamioSelectGroup,
  SelectItem as AndamioSelectItem,
  SelectLabel as AndamioSelectLabel,
  SelectScrollDownButton as AndamioSelectScrollDownButton,
  SelectScrollUpButton as AndamioSelectScrollUpButton,
  SelectSeparator as AndamioSelectSeparator,
  SelectTrigger as AndamioSelectTrigger,
  SelectValue as AndamioSelectValue,
} from "~/components/ui/select";
