import { AndamioHeading, AndamioText } from "~/components/andamio";

export default function Story() {
  return (
    <section className="bg-background px-6 py-28">
      <div className="mx-auto grid max-w-6xl gap-16 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <AndamioText
            variant="overline"
            as="div"
            className="text-brand-navy mb-3"
          >
            Why we built it
          </AndamioText>

          <AndamioHeading level={2} size="2xl" className="text-pretty">
            Paper proves very little
          </AndamioHeading>
        </div>

        <div className="space-y-8">
          <AndamioText variant="lead" className="leading-8">
            A printed certificate can be copied, and the only way to confirm one
            is genuine is to write to the institution that issued it and wait
            for an answer. For a graduate applying for a role abroad, that wait
            is often longer than the hiring window.
          </AndamioText>

          <AndamioText variant="lead" className="leading-8">
            So we moved the record. Every credential a Tracom graduate earns is
            issued to a wallet the graduate controls. It travels with them when
            they change jobs or countries, and the employer on the other end can
            confirm it in seconds.
          </AndamioText>

          <AndamioText variant="lead" className="leading-8">
            The platform runs on Andamio and settles on Cardano. Graduates never
            have to know that. Nothing in enrollment or certification asks them
            to learn it. The source code and its development history are
            public.
          </AndamioText>
        </div>
      </div>
    </section>
  );
}
