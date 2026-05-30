import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-brand-navy px-6">
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
        aria-hidden="true"
      >
        <span className="text-[clamp(10rem,45vw,32rem)] font-black leading-none text-white/[0.05]">
          404
        </span>
      </div>
      <div className="relative z-10 max-w-sm space-y-5 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
          Tracom Credentials
        </p>
        <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
          Page not found
        </h1>
        <p className="text-base leading-relaxed text-white/60">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-md bg-white px-6 py-2.5 text-sm font-semibold text-brand-navy transition-all hover:bg-white/90 active:scale-[0.98]"
          >
            Go to Home
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-white/50 transition-colors hover:text-white/80"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
