/**
 * Andamio wrapper for shadcn/ui Table
 *
 * Re-exports all Table components with consistent naming.
 *
 * Usage:
 * import { AndamioTable, AndamioTableHeader, AndamioTableBody } from "~/components/andamio";
 */

// Re-export all table components with Andamio prefix
export {
  Table as AndamioTable,
  TableHeader as AndamioTableHeader,
  TableBody as AndamioTableBody,
  TableFooter as AndamioTableFooter,
  TableHead as AndamioTableHead,
  TableRow as AndamioTableRow,
  TableCell as AndamioTableCell,
  TableCaption as AndamioTableCaption,
} from "~/components/ui/table";
