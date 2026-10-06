import { AndamioHeading, AndamioText } from "~/components/andamio";
import { GuillocheBackdrop } from "~/components/landing/landing-hero";

export default function Hero() {
  return (
    <section className="bg-brand-navy relative overflow-hidden px-6 pt-28 pb-24 text-white">
      <GuillocheBackdrop opacity={0.08} />

      <div className="relative z-10 mx-auto max-w-6xl">
        <AndamioText variant="overline" as="div" className="text-white/50">
          About
        </AndamioText>

        <AndamioHeading
          level={1}
          size="display"
          className="mt-8 max-w-3xl text-white"
        >
          A certificate an employer can check
        </AndamioHeading>

        <AndamioText
          variant="lead"
          className="mt-8 max-w-2xl leading-9 text-white/80"
        >
          Tracom trains payments and software professionals in Kenya. Tracom
          Credentials is the platform we use to issue what those graduates earn:
          a record that sits in the graduate&apos;s own wallet, which anyone can
          verify without going through us.
        </AndamioText>
      </div>
    </section>
  );
}
