import { AndamioPageLoading } from "~/components/andamio";

/**
 * Global loading state for the (app) route group.
 * Shows instantly during navigation to any page in the app.
 */
export default function AppLoading() {
  return <AndamioPageLoading variant="list" />;
}
