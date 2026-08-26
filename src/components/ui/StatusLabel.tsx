const TONES: Record<string, string> = {
  new: "border-ink/20 bg-white text-ink/75",
  awaiting_assignment: "border-sun/45 bg-sun/20 text-ink",
  open: "border-sun/45 bg-sun/20 text-ink",
  assigned: "border-cobalt/30 bg-cobalt-wash/70 text-cobalt-deep",
  in_progress: "border-cobalt/30 bg-cobalt-wash/70 text-cobalt-deep",
  completed: "border-teal/35 bg-teal/10 text-teal",
  cancelled: "border-ink/20 bg-white text-ink/60",
  active: "border-teal/35 bg-teal/10 text-teal",
  pending: "border-sun/45 bg-sun/20 text-ink",
  suspended: "border-clay/35 bg-clay/10 text-clay",
  outstanding: "border-sun/45 bg-sun/20 text-ink",
  received: "border-cobalt/30 bg-cobalt-wash/70 text-cobalt-deep",
  verified: "border-teal/35 bg-teal/10 text-teal",
  rejected: "border-clay/35 bg-clay/10 text-clay",
  offered: "border-sun/45 bg-sun/20 text-ink",
  accepted: "border-teal/35 bg-teal/10 text-teal",
  withdrawn: "border-ink/20 bg-white text-ink/60",
  paid: "border-teal/35 bg-teal/10 text-teal",
  unpaid: "border-sun/45 bg-sun/20 text-ink",
};

export function StatusLabel({ status, label }: { status: string; label?: string }) {
  const tone = TONES[status] ?? "border-ink/20 bg-white text-ink/75";

  return (
    <span
      className={`inline-flex min-h-6 w-max items-center gap-1.5 rounded-md border px-2 py-1 font-body text-[11px] font-medium leading-none ${tone}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label ?? humanize(status)}
    </span>
  );
}

function humanize(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
