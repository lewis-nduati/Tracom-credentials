import { redirect } from "next/navigation";

/**
 * Redirect /studio/course to /studio
 * The unified studio page now handles both courses and projects.
 */
export default function StudioCourseRedirect() {
  redirect("/studio");
}
