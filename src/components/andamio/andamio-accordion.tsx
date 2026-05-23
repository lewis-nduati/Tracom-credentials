/**
 * Andamio wrapper for shadcn/ui Accordion
 *
 * Re-exports all Accordion components with consistent naming.
 *
 * Usage:
 * import { AndamioAccordion, AndamioAccordionItem, AndamioAccordionTrigger, AndamioAccordionContent } from "~/components/andamio";
 *
 * Future (after extraction to @andamio/ui):
 * import { AndamioAccordion, AndamioAccordionItem, AndamioAccordionTrigger, AndamioAccordionContent } from "@andamio/ui";
 */

// Re-export all accordion components with Andamio prefix
export {
  Accordion as AndamioAccordion,
  AccordionItem as AndamioAccordionItem,
  AccordionTrigger as AndamioAccordionTrigger,
  AccordionContent as AndamioAccordionContent,
} from "~/components/ui/accordion";
