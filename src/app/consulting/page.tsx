export default function ConsultingPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      {/* Hero */}

      <section className="text-center">
        <h1 className="text-5xl font-bold">
          Andamio Consulting for Educational Institutions
        </h1>

        <p className="mx-auto mt-6 max-w-3xl text-lg text-gray-600">
          TRACOM helps universities, colleges, TVETs, NGOs, and corporate
          academies deploy production-ready Andamio-powered digital credential
          platforms on Cardano.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <a
            href="#pricing"
            className="rounded-xl bg-black px-6 py-3 text-white"
          >
            View Packages
          </a>

          <a
            href="#payment"
            className="rounded-xl border px-6 py-3"
          >
            Book Consultation
          </a>
        </div>
      </section>

      {/* Services */}

      <section className="mt-24">
        <h2 className="mb-8 text-3xl font-bold">
          Our Consulting Services
        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border p-6">
            <h3 className="text-xl font-semibold">
              Andamio Deployment
            </h3>

            <p className="mt-3">
              Deploy a production-ready Andamio instance for your institution.
            </p>
          </div>

          <div className="rounded-xl border p-6">
            <h3 className="text-xl font-semibold">
              Cardano Mainnet Setup
            </h3>

            <p className="mt-3">
              Configure wallets, API keys and launch on Cardano Mainnet.
            </p>
          </div>

          <div className="rounded-xl border p-6">
            <h3 className="text-xl font-semibold">
              Course Migration
            </h3>

            <p className="mt-3">
              Import your existing learning content into Andamio.
            </p>
          </div>

          <div className="rounded-xl border p-6">
            <h3 className="text-xl font-semibold">
              Credential Design
            </h3>

            <p className="mt-3">
              Design blockchain-backed certificates and digital badges.
            </p>
          </div>

          <div className="rounded-xl border p-6">
            <h3 className="text-xl font-semibold">
              Staff Training
            </h3>

            <p className="mt-3">
              Train administrators and instructors to manage the platform.
            </p>
          </div>

          <div className="rounded-xl border p-6">
            <h3 className="text-xl font-semibold">
              Ongoing Support
            </h3>

            <p className="mt-3">
              Maintenance, upgrades and post-deployment technical support.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}

      <section
        id="pricing"
        className="mt-24"
      >
        <h2 className="text-center text-4xl font-bold">
          Consulting Packages
        </h2>

        <p className="mt-4 text-center text-gray-600">
          Flexible engagement options for institutions adopting Andamio.
        </p>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          <div className="rounded-xl border p-8">
            <h3 className="text-2xl font-bold">
              Starter
            </h3>

            <p className="mt-4 text-5xl font-bold">
              $250 USD
            </p>

            <ul className="mt-8 space-y-2">
              <li>✅ Discovery Workshop</li>
              <li>✅ Andamio Deployment</li>
              <li>✅ Mainnet Configuration</li>
              <li>✅ Administrator Training</li>
            </ul>

            <a
              href="#payment"
              className="mt-8 block rounded-xl bg-black py-3 text-center text-white"
            >
              Choose Starter
            </a>
          </div>

          <div className="rounded-xl border-2 border-blue-600 p-8">
            <div className="mb-3 inline-block rounded-full bg-blue-600 px-3 py-1 text-sm text-white">
              Most Popular
            </div>

            <h3 className="text-2xl font-bold">
              Professional
            </h3>

            <p className="mt-4 text-5xl font-bold">
              $750 USD
            </p>

            <ul className="mt-8 space-y-2">
              <li>✅ Everything in Starter</li>
              <li>✅ Course Migration</li>
              <li>✅ Credential Design</li>
              <li>✅ Staff Training</li>
              <li>✅ 90 Days Support</li>
            </ul>

            <a
              href="#payment"
              className="mt-8 block rounded-xl bg-blue-600 py-3 text-center text-white"
            >
              Choose Professional
            </a>
          </div>

          <div className="rounded-xl border p-8">
            <h3 className="text-2xl font-bold">
              Enterprise
            </h3>

            <p className="mt-4 text-5xl font-bold">
              Custom Quote
            </p>

            <ul className="mt-8 space-y-2">
              <li>✅ Multi-campus Deployments</li>
              <li>✅ Custom Integrations</li>
              <li>✅ Dedicated Support</li>
              <li>✅ Long-term Maintenance</li>
            </ul>

            <a
              href="#payment"
              className="mt-8 block rounded-xl bg-black py-3 text-center text-white"
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* Consultation */}

      <section
        id="payment"
        className="mt-24"
      >
        <div className="rounded-2xl border p-10">
          <h2 className="text-3xl font-bold">
            Book a Discovery Consultation
          </h2>

          <p className="mt-4 text-gray-600">
            Schedule a one-hour consultation to discuss your institution's
            requirements, deployment strategy, implementation roadmap and the
            most suitable consulting package.
          </p>

          <div className="mt-8 grid gap-4">
            <input
              className="rounded-lg border p-3"
              placeholder="Institution Name"
            />

            <input
              className="rounded-lg border p-3"
              placeholder="Contact Person"
            />

            <input
              className="rounded-lg border p-3"
              placeholder="Email Address"
            />

            <input
              className="rounded-lg border p-3"
              placeholder="Phone Number"
            />

            <select className="rounded-lg border p-3">
              <option>Starter Package</option>
              <option>Professional Package</option>
              <option>Enterprise Package</option>
            </select>
          </div>

          <div className="mt-8 rounded-xl bg-gray-100 p-8">
            <h3 className="text-xl font-semibold">
              Consultation Fee
            </h3>

            <p className="mt-3 text-5xl font-bold">
              $50 USD
            </p>

            <p className="mt-4 text-gray-600">
              The consultation fee is credited toward your deployment project if
              you proceed with implementation.
            </p>

            <a
              href="https://lewoverse.gumroad.com/l/gorbnx"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 block rounded-xl bg-black py-4 text-center text-lg font-semibold text-white transition hover:bg-gray-800"
            >
              Book Consultation • $50 USD
            </a>

            <p className="mt-4 text-center text-sm text-gray-500">
              Secure checkout powered by Gumroad.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}