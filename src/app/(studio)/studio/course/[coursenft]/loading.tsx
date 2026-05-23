import { AndamioStudioLoading } from "~/components/andamio/andamio-loading";

/**
 * Loading state for course studio detail.
 * Shows a centered workspace skeleton while course data loads.
 */
export default function StudioCourseDetailLoading() {
  return <AndamioStudioLoading variant="centered" />;
}
