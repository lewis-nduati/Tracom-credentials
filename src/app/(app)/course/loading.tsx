import { AndamioPageLoading } from "~/components/andamio";

/**
 * Loading state for course pages.
 * Shows a card grid skeleton matching the courses layout.
 */
export default function CourseLoading() {
  return <AndamioPageLoading variant="cards" itemCount={6} />;
}
