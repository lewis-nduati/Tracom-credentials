import { AndamioPageLoading } from "~/components/andamio";

/**
 * Loading state for project pages.
 * Shows a table skeleton matching the projects table layout.
 */
export default function ProjectLoading() {
  return <AndamioPageLoading variant="table" itemCount={5} />;
}
