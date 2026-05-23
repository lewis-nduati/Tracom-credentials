import { AndamioPageLoading } from "~/components/andamio";

/**
 * Loading state for the dashboard page.
 * Shows a content-style skeleton while dashboard data loads.
 */
export default function DashboardLoading() {
  return <AndamioPageLoading variant="content" />;
}
