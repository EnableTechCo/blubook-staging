import "server-only";
import { createClient } from "@/lib/supabase/server";
import { INTAKE_STAGE_BY_SLUG, describeAnswer } from "@/features/onboarding/intakeStages";

/**
 * What each work group was told about this client at onboarding, on the
 * customer record. Read under the caller's session: staff see it, the client
 * sees its own, a partner sees none of it.
 *
 * Answers are labelled through the intake specification; a key the
 * specification no longer defines is still shown, under its raw key, so a
 * reworded question never hides an answer that was given.
 */

interface IntakeRow {
  answers: Record<string, unknown>;
  updated_at: string;
  service_groups: { slug: string; name: string } | null;
}

export async function WorkGroupIntake({ clientId }: { clientId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("client_work_group_intake")
    .select("answers,updated_at,service_groups(slug,name)")
    .eq("client_id", clientId)
    .returns<IntakeRow[]>();

  const rows = (data ?? [])
    .filter((row) => row.service_groups)
    .sort((left, right) => left.service_groups!.name.localeCompare(right.service_groups!.name));

  return (
    <section className="mt-8" aria-labelledby="work-group-intake">
      <h2 id="work-group-intake" className="font-heading text-2xl">Work group intake</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">
        What each team was told about this client when it was onboarded. Captured once, at intake; a
        change is a matter for the team&apos;s own request thread.
      </p>

      {rows.length === 0 ? (
        <p className="workspace-empty mt-4 px-4 py-3 text-[13px] leading-5">
          No work group intake was recorded for this client.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((row) => {
            const group = row.service_groups!;
            const stage = INTAKE_STAGE_BY_SLUG.get(group.slug);
            const known = stage?.fields ?? [];
            const knownKeys = new Set(known.map((field) => field.key));
            const answered = known.filter((field) => row.answers[field.key] !== undefined && row.answers[field.key] !== "");
            const extra = Object.entries(row.answers).filter(([key]) => !knownKeys.has(key));
            return (
              <details
                key={group.slug}
                className="group overflow-hidden rounded-2xl border border-ink/10 bg-paper-light/75 shadow-surface"
              >
                <summary className="grid min-h-16 cursor-pointer list-none gap-2 px-5 py-4 sm:grid-cols-[13rem_minmax(0,1fr)_auto] sm:items-center [&::-webkit-details-marker]:hidden">
                  <h3 className="text-sm font-semibold">{group.name}</h3>
                  <p className="text-sm leading-6 text-ink/60">
                    {answered.length + extra.length} answer{answered.length + extra.length === 1 ? "" : "s"}
                    {stage ? ` of ${known.length} asked` : ""}
                  </p>
                  <span className="text-xs font-semibold text-cobalt">View</span>
                </summary>
                <dl className="grid gap-x-6 gap-y-3 border-t border-ink/10 px-5 py-5 sm:grid-cols-[minmax(10rem,16rem)_minmax(0,1fr)]">
                  {known.map((field) => (
                    <div key={field.key} className="contents">
                      <dt className="text-xs font-semibold text-ink/60">{field.label}</dt>
                      <dd className="text-sm text-ink">{describeAnswer(field, String(row.answers[field.key] ?? ""))}</dd>
                    </div>
                  ))}
                  {extra.map(([key, value]) => (
                    <div key={key} className="contents">
                      <dt className="font-mono text-xs text-ink/60">{key}</dt>
                      <dd className="text-sm text-ink">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            );
          })}
        </div>
      )}
    </section>
  );
}
