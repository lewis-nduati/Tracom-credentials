import { AndamioPageLoading } from "~/components/andamio";

/**
 * Loading state for the Contributor page.
 *
 * Shows a detail-style skeleton while contributor data loads.
 * The contributor page is not yet implemented, so this uses the
 * generic detail variant as a sensible default.
 */
export default function ContributorLoading() {
  return <AndamioPageLoading variant="detail" />;
}
