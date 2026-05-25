import Link from "next/link";
import { AndamioText } from "~/components/andamio/andamio-text";

export default function AppNotFound() {
  return (
    <div className="relative flex min-h-[60vh] items-center justify-center overflow-hidden px-6">
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
        aria-hidden="true"
      >
        <span className="text-[clamp(8rem,30vw,20rem)] font-black leading-none text-foreground/[0.04]">
          404
        </span>
      </div>
      <div className="relative z-10 max-w-sm space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
          Not found
        </p>
        <h1 className="text-3xl font-bold text-foreground">
          Page not found
        </h1>
        <AndamioText variant="muted" className="leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </AndamioText>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
