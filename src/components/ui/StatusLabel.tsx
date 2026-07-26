const TONES: Record<string, string> = {
  new: "border-slate-500 bg-slate-100 text-slate-700",
  awaiting_assignment: "border-amber-700 bg-amber-100 text-amber-800",
  assigned: "border-cobalt bg-cobalt-wash text-cobalt-deep",
  in_progress: "border-cobalt bg-cobalt-wash text-cobalt-deep",
  completed: "border-teal bg-emerald-50 text-teal",
  cancelled: "border-slate-400 bg-slate-200 text-slate-600",
  active: "border-teal bg-emerald-50 text-teal",
  pending: "border-amber-700 bg-amber-100 text-amber-800",
  suspended: "border-clay bg-red-50 text-clay",
  outstanding: "border-amber-700 bg-amber-100 text-amber-800",
  received: "border-cobalt bg-cobalt-wash text-cobalt-deep",
  verified: "border-teal bg-emerald-50 text-teal",
  rejected: "border-clay bg-red-50 text-clay",
  offered: "border-amber-700 bg-amber-100 text-amber-800",
  accepted: "border-teal bg-emerald-50 text-teal",
  withdrawn: "border-slate-400 bg-slate-200 text-slate-600",
};

export function StatusLabel({ status }: { status: string }) {
  const tone = TONES[status] ?? "border-slate-500 bg-slate-100 text-slate-700";

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
