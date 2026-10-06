import Link from "next/link";

import { AndamioHeading, AndamioText } from "~/components/andamio";
import { GuillocheBackdrop } from "~/components/landing/landing-hero";
import { BRANDING } from "~/config/branding";

export default function BuiltOnAndamio() {
  return (
    <section className="bg-brand-navy relative overflow-hidden px-6 py-20">
      <GuillocheBackdrop opacity={0.08} />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <AndamioText variant="overline" as="div" className="text-white/50">
              Powered by Andamio
            </AndamioText>

            <AndamioHeading
              level={2}
              size="2xl"
              className="mt-3 max-w-xl text-white"
            >
              Built on an open protocol
            </AndamioHeading>

            <AndamioText className="mt-6 max-w-xl leading-8 text-white/70">
              Tracom Credentials runs on Andamio, an open protocol for courses
              and credentials on Cardano. A Tracom credential doesn&apos;t depend
              on this website staying online. The record is public, and anyone
              can check it.
            </AndamioText>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row lg:justify-end">
            <Link
              href="/course"
              className="text-brand-navy transition-standard rounded-md bg-white px-7 py-3 text-center font-semibold hover:bg-white/90 active:scale-[0.98]"
            >
              Browse courses
            </Link>

            <a
              href={BRANDING.links.andamio}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-standard rounded-md border border-white/30 px-7 py-3 text-center font-semibold text-white hover:border-white/60 hover:bg-white/10 active:scale-[0.98]"
            >
              About Andamio
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
