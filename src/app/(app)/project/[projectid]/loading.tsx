import { AndamioPageLoading } from "~/components/andamio";

/**
 * Loading state for project detail page.
 * Shows a detail skeleton matching the project overview layout.
 */
export default function ProjectDetailLoading() {
  return <AndamioPageLoading variant="detail" />;
}
