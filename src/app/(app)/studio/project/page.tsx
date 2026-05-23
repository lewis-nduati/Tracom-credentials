import { redirect } from "next/navigation";

/**
 * Redirect /studio/project to /studio
 * The unified studio page now handles both courses and projects.
 */
export default function StudioProjectRedirect() {
  redirect("/studio");
}
