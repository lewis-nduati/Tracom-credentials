import Link from "next/link";
import { AndamioPageHeader } from "~/components/andamio";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { DashboardIcon } from "~/components/icons";

/**
 * 404 Not Found boundary for the (app) route group
 *
 * Shown when a user navigates to a route that does not exist within the app layout.
 * Provides a link back to the dashboard.
 */
export default function AppNotFound() {
  return (
    <div className="space-y-6">
      <AndamioPageHeader
        title="Page not found"
        description="The page you are looking for does not exist or has been moved"
      />

      <AndamioText variant="muted">
        Check the URL for typos, or navigate back to the dashboard to find what you need.
      </AndamioText>

      <AndamioButton asChild variant="outline">
        <Link href="/dashboard">
          <DashboardIcon className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </AndamioButton>
    </div>
  );
}
