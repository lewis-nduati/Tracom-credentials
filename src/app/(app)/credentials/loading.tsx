import { AndamioPageLoading } from "~/components/andamio";

/**
 * Loading state for credentials page.
 * Shows a card grid skeleton matching the credentials layout.
 */
export default function CredentialsLoading() {
  return <AndamioPageLoading variant="cards" itemCount={6} />;
}
