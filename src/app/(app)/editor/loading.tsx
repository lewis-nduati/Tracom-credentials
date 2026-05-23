/**
 * Loading state for the Editor page.
 *
 * Matches the editor layout: page header, tab bar, then a card
 * containing the editor content area.
 */
export default function EditorLoading() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="space-y-2">
        <div className="h-8 w-48 rounded motion-safe:animate-pulse bg-muted" />
        <div className="h-5 w-80 rounded motion-safe:animate-pulse bg-muted" />
      </div>

      {/* Tab bar */}
      <div className="flex gap-1">
        {["Edit", "Preview", "JSON"].map((tab) => (
          <div
            key={tab}
            className="h-9 w-20 rounded motion-safe:animate-pulse bg-muted"
          />
        ))}
      </div>

      {/* Editor card */}
      <div className="rounded-sm border">
        <div className="p-6 space-y-4">
          <div className="h-5 w-16 rounded motion-safe:animate-pulse bg-muted" />
          {/* Toolbar skeleton */}
          <div className="flex gap-2 border-b pb-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-8 rounded motion-safe:animate-pulse bg-muted"
              />
            ))}
          </div>
          {/* Editor content area */}
          <div className="h-96 w-full rounded motion-safe:animate-pulse bg-muted" />
        </div>
      </div>
    </div>
  );
}
