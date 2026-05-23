import { AndamioPageLoading } from "~/components/andamio";

/**
 * Loading state for the Task Detail page.
 *
 * Shows a detail-style skeleton while task data loads.
 * The task page is not yet implemented, so this uses the
 * generic detail variant as a sensible default.
 */
export default function TaskDetailLoading() {
  return <AndamioPageLoading variant="detail" />;
}
