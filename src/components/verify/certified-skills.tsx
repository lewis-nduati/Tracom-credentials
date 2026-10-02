import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { AndamioText } from "~/components/andamio/andamio-text";
import { CheckIcon } from "~/components/icons";

/** What a credential certifies, in the words a hiring manager reads. */
export interface CertifiedSkills {
  moduleCode: string;
  moduleTitle: string;
  courseTitle: string;
  issuerName: string;
  /** The module's student learning targets, each an "I can…" statement. */
  targets: string[];
}

/**
 * Sample content until the lookup is wired up.
 *
 * The real version reads the module from the gateway's public course
 * endpoints (`/v2/course/user/modules/{course_id}` and
 * `/v2/course/user/slts/{course_id}/{module_code}`) by matching the
 * credential's asset name to the module's SLT hash. Until then every page
 * shows this, flagged as a sample so nobody mistakes it for the record.
 */
export const SAMPLE_CERTIFIED_SKILLS: CertifiedSkills = {
  moduleCode: "201",
  moduleTitle: "Anatomy of a POS System",
  courseTitle: "POS Developer Fundamentals",
  issuerName: "Tracom Academy",
  targets: [
    "I can name the parts of a POS terminal and say what each one does",
    "I can explain what runs on the terminal and what runs on the merchant's server",
    "I can tell a purchase, a refund, a void and a reversal apart",
  ],
};

export function CertifiedSkillsSection({
  skills,
  isSample,
}: {
  skills: CertifiedSkills;
  isSample: boolean;
}) {
  return (
    <section
      aria-labelledby="certified-skills-heading"
      className="flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <AndamioText variant="overline" as="div">
          What the holder demonstrated
        </AndamioText>
        {isSample ? (
          <AndamioBadge variant="outline">Sample details</AndamioBadge>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <AndamioHeading id="certified-skills-heading" level={2} size="2xl">
          {skills.moduleTitle}
        </AndamioHeading>
        <AndamioText variant="muted">
          Module {skills.moduleCode} of {skills.courseTitle}, issued by{" "}
          {skills.issuerName}
        </AndamioText>
      </div>

      <ul className="flex flex-col gap-3">
        {skills.targets.map((target) => (
          <li key={target} className="flex gap-3">
            <span className="bg-primary/10 text-primary mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
              <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <AndamioText className="text-foreground">{target}</AndamioText>
          </li>
        ))}
      </ul>

      <AndamioText
        variant="small"
        className="text-muted-foreground max-w-prose"
      >
        Each statement is a learning target the holder had to meet. A trainer
        reviewed their assignment against these targets before the credential
        was issued.
      </AndamioText>
    </section>
  );
}
