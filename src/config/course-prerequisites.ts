export interface CoursePrerequisite {
  studentStateId: string;
  courseName: string;
}

export const COURSE_PREREQUISITES: Record<string, CoursePrerequisite> = {
  // Course 2 — POS Developer Fundamentals requires Course 1 — Introduction to Blockchain
  "13cf61af0106efa3ba64ff51cfd847fb8f74538d06cb78b4df04535e": {
    studentStateId: "c234d083882062432c67e44cfa14b50953f3c7a1e95638f1ad208f45",
    courseName: "Introduction to Blockchain",
  },
  // Course 3 — Secure Payments and Cybersecurity requires Course 2 — POS Developer Fundamentals
  "a27bf6143a1f064dfac7fefcfb43c1ea3ca317d9a1ad228e6d0049bf": {
    studentStateId: "c292279d5552d5a2779cc6a0f1a1c639ee5ac5397df70230dda070c4",
    courseName: "POS Developer Fundamentals",
  },
};
