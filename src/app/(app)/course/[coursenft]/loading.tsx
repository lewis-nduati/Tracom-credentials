import { AndamioPageLoading } from "~/components/andamio";

/**
 * Loading state for course detail page.
 * Shows a detail skeleton matching the course overview layout.
 */
export default function CourseDetailLoading() {
  return <AndamioPageLoading variant="detail" />;
}
