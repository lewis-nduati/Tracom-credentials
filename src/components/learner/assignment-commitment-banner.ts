import {
  LoadingIcon,
  PendingIcon,
  SuccessIcon,
} from "~/components/icons";
import type { CommitmentNetworkStatus } from "~/lib/assignment-status";

export interface BannerConfig {
  icon: typeof SuccessIcon;
  iconClass: string;
  bannerClass: string;
  title: string;
  subtitle: string;
}

/**
 * Map a commitment network status to the banner shown in the read-only branch
 * of `AssignmentCommitment`.
 *
 * Returns null when the status does not render a banner (e.g., ACCEPTED and
 * DENIED are handled by dedicated branches upstream; PENDING_TX_COMMIT is the
 * active submit-flow state and does not render a banner).
 *
 * Extracted as a pure module so it can be unit-tested without React rendering
 * (the repo uses `tsx --test` + `node:test`, no RTL). See
 * `assignment-commitment-banner.test.ts`.
 */
export function getBannerConfig(
  networkStatus: CommitmentNetworkStatus,
): BannerConfig | null {
  switch (networkStatus) {
    case "PENDING_APPROVAL":
      return {
        icon: PendingIcon,
        iconClass: "text-secondary",
        bannerClass: "bg-secondary/10 border-secondary/30",
        title: "Pending Teacher Review",
        subtitle:
          "Your assignment has been submitted and is awaiting review by your teacher.",
      };
    case "CREDENTIAL_CLAIMED":
      return {
        icon: SuccessIcon,
        iconClass: "text-primary",
        bannerClass: "bg-primary/10 border-primary/20",
        title: "Credential Claimed",
        subtitle: "You have claimed your credential for this assignment.",
      };
    case "IN_PROGRESS":
      return {
        icon: PendingIcon,
        iconClass: "text-secondary",
        bannerClass: "bg-secondary/10 border-secondary/30",
        title: "In Progress",
        subtitle:
          "Your assignment is in progress. Submit your work when ready.",
      };
    default:
      // PENDING_TX_* states (except PENDING_TX_COMMIT which is handled in the
      // submit flow). TS does not narrow the template-literal branch via
      // startsWith; this runtime check is authoritative. Keep the explicit
      // `!== "PENDING_TX_COMMIT"` guard — not derivable from the type.
      if (
        networkStatus.startsWith("PENDING_TX_") &&
        networkStatus !== "PENDING_TX_COMMIT"
      ) {
        return {
          icon: LoadingIcon,
          iconClass: "animate-spin text-secondary",
          bannerClass: "bg-muted/30",
          title: "Processing transaction...",
          subtitle: "Your transaction is being confirmed on the blockchain.",
        };
      }
      return null;
  }
}
