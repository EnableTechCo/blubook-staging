const TONES: Record<string, string> = {
  new: "border-ink/35 bg-cream/50 text-ink/75",
  awaiting_assignment: "border-sun bg-sun/25 text-ink",
  assigned: "border-cobalt bg-cobalt-wash text-cobalt-deep",
  in_progress: "border-cobalt bg-cobalt-wash text-cobalt-deep",
  completed: "border-teal bg-teal/10 text-teal",
  cancelled: "border-ink/25 bg-cream text-ink/60",
  active: "border-teal bg-teal/10 text-teal",
  pending: "border-sun bg-sun/25 text-ink",
  suspended: "border-clay bg-clay/10 text-clay",
  outstanding: "border-sun bg-sun/25 text-ink",
  received: "border-cobalt bg-cobalt-wash text-cobalt-deep",
  verified: "border-teal bg-teal/10 text-teal",
  rejected: "border-clay bg-clay/10 text-clay",
  offered: "border-sun bg-sun/25 text-ink",
  accepted: "border-teal bg-teal/10 text-teal",
  withdrawn: "border-ink/25 bg-cream text-ink/60",
};

export function StatusLabel({ status }: { status: string }) {
  const tone = TONES[status] ?? "border-ink/35 bg-cream/50 text-ink/75";

  return (
    <span
      className={`inline-flex min-h-6 w-max items-center gap-1.5 border px-2 py-1 font-mono text-[10px] font-medium uppercase leading-none tracking-wide ${tone}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {humanize(status)}
    </span>
  );
}

function humanize(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
