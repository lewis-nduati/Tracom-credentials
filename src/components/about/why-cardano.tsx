import { AndamioHeading, AndamioText } from "~/components/andamio";

export default function WhyCardano() {
  const benefits = [
    {
      title: "Verification without us",
      description:
        "An employer confirms a credential from the link itself. Nobody has to write to Tracom and wait for an answer.",
    },
    {
      title: "Forgery becomes detectable",
      description:
        "A credential carries proof of who issued it and when. Altering one after issue does not go unnoticed.",
    },
    {
      title: "It works across borders",
      description:
        "A graduate applying to a firm in Berlin or Kigali shares the same link, and it resolves the same way.",
    },
    {
      title: "The graduate holds the record",
      description:
        "The credential sits in a wallet they control. It stays with them when they change jobs, or when we change systems.",
    },
    {
      title: "Less work in the registry",
      description:
        "Confirmation requests and replacement certificates stop arriving as individual pieces of admin.",
    },
    {
      title: "Built on a standard, not a vendor",
      description:
        "Open Badges 3.0 means these records can be read by other providers. Nothing here depends on Tracom existing forever.",
    },
  ];

  return (
    <section className="bg-muted/40 px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 md:grid-cols-[1fr_1.2fr] md:items-end">
          <div>
            <AndamioText
              variant="overline"
              as="div"
              className="text-brand-navy mb-3"
            >
              Why it works this way
            </AndamioText>

            <AndamioHeading level={2} size="2xl" className="text-pretty">
              What a verifiable credential changes
            </AndamioHeading>
          </div>

          <AndamioText variant="lead" className="leading-8">
            A credential is only worth what somebody else can confirm about it.
            Everything below follows from moving that confirmation off our desk
            and into the record itself.
          </AndamioText>
        </div>

        <ul className="mt-16 grid gap-x-16 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <li key={benefit.title}>
              <AndamioHeading
                level={3}
                size="base"
                className="border-brand-navy/25 border-b pb-3"
              >
                {benefit.title}
              </AndamioHeading>

              <AndamioText variant="muted" className="mt-4 leading-7">
                {benefit.description}
              </AndamioText>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
