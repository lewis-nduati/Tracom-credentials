import { GuillocheBackdrop } from "~/components/landing/landing-hero";

export default function ConsultingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">

      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-navy px-6 py-24 text-white">
        <GuillocheBackdrop opacity={0.08} />

        <div className="relative z-10 mx-auto max-w-6xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-white">
            Andamio Consulting for Educational Institutions
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg text-white/80">
            TRACOM helps universities, colleges, TVETs, NGOs, government programs,
professional associations, corporate academies, and training organizations
deploy production-ready Andamio-powered digital credential platforms on Cardano.
          </p>

          <div className="mt-10 flex justify-center gap-4">
            <a
              href="#pricing"
              className="rounded-xl bg-white px-6 py-3 font-semibold text-brand-navy transition hover:bg-white/90"
            >
              View Packages
            </a>

            <a
              href="#payment"
              className="rounded-xl border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Book Consultation
            </a>
          </div>
        </div>
      </section>


      {/* Services */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-bold">
          Our Consulting Services
        </h2>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {[
            [
              "Andamio Deployment",
              "Deploy a production-ready Andamio instance for your institution.",
            ],
            [
              "Cardano Mainnet Setup",
              "Configure wallets, API keys and launch on Cardano Mainnet.",
            ],
            [
              "Course Migration",
              "Import existing learning content into your credential platform.",
            ],
            [
              "Credential Design",
              "Design blockchain-backed certificates and digital badges.",
            ],
            [
              "Staff Training",
              "Train administrators and instructors to manage the platform.",
            ],
            [
              "Ongoing Support",
              "Maintenance, upgrades and technical support after deployment.",
            ],
          ].map(([title, description]) => (
            <div
              key={title}
              className="rounded-2xl border bg-white p-6 shadow-sm transition hover:-translate-y-1"
            >
              <h3 className="text-xl font-semibold">
                {title}
              </h3>

              <p className="mt-3 text-gray-600">
                {description}
              </p>
            </div>
          ))}

        </div>
      </section>


      {/* Pricing */}
      <section
        id="pricing"
        className="mx-auto max-w-6xl px-6 py-20"
      >
        <h2 className="text-center text-4xl font-bold">
          Consulting Packages
        </h2>

        <p className="mt-4 text-center text-gray-600">
          Flexible engagement options for institutions adopting Andamio.
        </p>


        <div className="mt-12 grid gap-8 md:grid-cols-3">

          {[
            {
              title: "Starter",
              price: "$250 USD",
              items: [
                "Discovery Workshop",
                "Andamio Deployment",
                "Mainnet Configuration",
                "Administrator Training",
              ],
            },
            {
              title: "Professional",
              price: "$750 USD",
              popular: true,
              items: [
                "Everything in Starter",
                "Course Migration",
                "Credential Design",
                "Staff Training",
                "90 Days Support",
              ],
            },
            {
              title: "Enterprise",
              price: "Custom Quote",
              items: [
                "Multi-campus Deployments",
                "Custom Integrations",
                "Dedicated Support",
                "Long-term Maintenance",
              ],
            },
          ].map((pkg) => (

            <div
              key={pkg.title}
              className={`rounded-2xl border p-8 bg-white ${
                pkg.popular
                  ? "border-blue-600 shadow-lg"
                  : ""
              }`}
            >

              {pkg.popular && (
                <div className="mb-4 inline-block rounded-full bg-blue-600 px-3 py-1 text-sm text-white">
                  Most Popular
                </div>
              )}

              <h3 className="text-2xl font-bold">
                {pkg.title}
              </h3>

              <p className="mt-4 text-4xl font-bold">
                {pkg.price}
              </p>

              <ul className="mt-8 space-y-3 text-gray-600">
                {pkg.items.map((item) => (
                  <li key={item}>
                    ✅ {item}
                  </li>
                ))}
              </ul>

              <a
                href="#payment"
                className="mt-8 block rounded-xl bg-[#0B1F3A] py-3 text-center font-semibold text-white transition hover:bg-black"
              >
                Choose {pkg.title}
              </a>

            </div>

          ))}

        </div>
      </section>


      {/* Consultation */}
      <section
        id="payment"
        className="mx-auto max-w-6xl px-6 py-20"
      >

        <div className="rounded-3xl bg-brand-navy p-10">

          <h2 className="text-3xl font-bold text-white">
            Book a Discovery Consultation
          </h2>


          <p className="mt-4 max-w-3xl text-white/80">
            Schedule a one-hour consultation to discuss your institution's
            requirements, deployment strategy, implementation roadmap and
            recommended package.
          </p>


          <div className="mt-10 rounded-2xl bg-white p-8 text-black">

            <h3 className="text-xl font-semibold">
              Consultation Fee
            </h3>


            <p className="mt-3 text-5xl font-bold">
              $50 USD
            </p>


            <p className="mt-4 text-gray-600">
              If you proceed with a deployment project, the consultation fee is
              credited toward your engagement.
            </p>


            <a
              href="https://www.paypal.com/ncp/payment/PJRMRFCYQC3H4"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 block rounded-xl bg-[#0B1F3A] py-4 text-center text-lg font-semibold text-white transition hover:bg-black"
            >
              Book Consultation • $50 USD
            </a>


            <p className="mt-4 text-center text-sm text-gray-500">
              Secure checkout powered by PayPal.
            </p>

          </div>

        </div>

      </section>

    </main>
  );
}