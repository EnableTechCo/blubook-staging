import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Empty, WorkspaceHeader } from "@/features/dashboard/ui";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Work Groups · BluBook" };
export const dynamic = "force-dynamic";

interface GroupProfile {
  id: string;
  name: string;
  internal: boolean;
  services: { name: string }[];
}

const groupSelect = "id,name,internal,services(name)";

// The work group is the anonymous face of the partners inside it, so a profile
// is safe to show in full: it names services, never businesses.
//
// Who sees which groups differs by role, and the difference is the point.
// A client sees every group, because any of them could deliver work it buys.
// A partner sees only the groups it belongs to — including a premium partner,
// whose wider sight of client identity does not extend to the rest of the
// network. Sales Operations is BluBook's own desk and appears to nobody here.
//
// Staff manage groups at /dashboard/work-groups instead; this page is read-only.
export default async function WorkGroupProfilesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type === "staff") redirect("/dashboard/work-groups");

  const isProvider = profile.user_type === "service_provider";
  const supabase = await createClient();

  // Inactive services are already withheld from non-staff by services_select,
  // so neither branch filters on active: RLS has done it.
  const groups = isProvider
    ? await (async () => {
        // work_group_members_select scopes this to the caller's own provider
        // row, so a partner cannot reach a group it does not belong to.
        const { data } = await supabase
          .from("work_group_members")
          .select(`service_groups(${groupSelect})`)
          .returns<{ service_groups: GroupProfile | null }[]>();

        return (data ?? [])
          .map((row) => row.service_groups)
          .filter((group): group is GroupProfile => group !== null && !group.internal)
          .sort((left, right) => left.name.localeCompare(right.name));
      })()
    : await (async () => {
        const { data } = await supabase
          .from("service_groups")
          .select(groupSelect)
          .eq("active", true)
          .eq("internal", false)
          .order("name")
          .returns<GroupProfile[]>();

        return data ?? [];
      })();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <WorkspaceHeader
        eyebrow="Reports"
        title="Work Groups"
        description={
          isProvider
            ? "The groups your practice delivers through. Requests reach you when they are routed to one of them."
            : "Every service request is routed to the work group that owns its service, then delivered by a partner inside that group."
        }
      />

      {groups.length === 0 ? (
        <Empty>
          {isProvider
            ? "Your practice is not in a work group yet, so no requests will be routed to you. Your BluBook contact can add you to one."
            : "No work groups are active yet."}
        </Empty>
      ) : (
        <ul className="grid border-l border-t border-ink sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group, index) => (
            <li key={group.id} className="flex flex-col border-b border-r border-ink bg-paper p-6">
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-rust">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="mt-8 block font-heading text-[1.65rem] font-normal leading-tight text-ink">
                {group.name}
              </span>
              <span className="mt-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-cobalt">
                Premium Partner
              </span>

              <div className="mt-6 border-t border-ink pt-3">
                <p className="text-[9px] uppercase tracking-[0.14em] text-ink/50">
                  {group.services.length === 0
                    ? "No services yet"
                    : `${group.services.length} service${group.services.length === 1 ? "" : "s"}`}
                </p>
                {group.services.length > 0 ? (
                  <ul className="mt-3 space-y-1">
                    {group.services.map((service) => (
                      <li key={service.name} className="text-[13px] leading-6 text-ink/60">
                        {service.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-[13px] leading-6 text-ink/45">
                    This group is being set up. Your BluBook contact can tell you when it opens.
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
