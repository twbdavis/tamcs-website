import {
  WORKOUT_SECTION_COLORS,
  WORKOUT_SECTION_LABELS,
  type WorkoutSection,
} from "@/lib/content-types";

export function SetView({ sections }: { sections: WorkoutSection[] }) {
  const total = sections.reduce(
    (sum, s) => sum + (s.total_yardage ?? 0),
    0,
  );

  return (
    <div className="grid gap-4">
      {sections.length === 0 ? (
        <p className="text-sm text-muted-foreground">No sections.</p>
      ) : (
        sections.map((s) => {
          const color = WORKOUT_SECTION_COLORS[s.section_type];
          return (
            <div
              key={s.id}
              className="overflow-hidden rounded-lg border bg-card shadow-sm"
            >
              <div
                className={`flex items-center justify-between gap-2 px-4 py-2 ${color.bg} ${color.text}`}
              >
                <span className="text-sm font-semibold uppercase tracking-wide">
                  {WORKOUT_SECTION_LABELS[s.section_type]}
                </span>
                {s.total_yardage !== null ? (
                  <span className="text-xs font-medium opacity-90">
                    {s.total_yardage.toLocaleString()} yd
                  </span>
                ) : null}
              </div>
              <pre className="whitespace-pre-wrap break-words p-4 font-sans text-sm">
                {s.content || "—"}
              </pre>
            </div>
          );
        })
      )}
      {sections.length > 0 ? (
        <div className="flex items-baseline justify-between rounded-lg border bg-muted/40 p-4">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Total yardage
          </span>
          <span className="text-xl font-bold">{total.toLocaleString()}</span>
        </div>
      ) : null}
    </div>
  );
}
