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

// The work group is the anonymous face of the partners inside it: a client
// sees which group delivers a service, never which practice. These profiles are
// therefore safe to show in full — they name services, never businesses.
//
// Staff have their own management view at /dashboard/work-groups, which is
// where groups are created and partners assigned. This page is read-only.
export default async function WorkGroupProfilesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type === "staff") redirect("/dashboard/work-groups");

  const supabase = await createClient();
  const { data } = await supabase
    .from("service_groups")
    .select("id,name,internal,services(name)")
    .eq("active", true)
    // Sales Operations is BluBook's own desk, so it never appears here.
    .eq("internal", false)
    // Filters the embedded services without dropping groups that have none —
    // Capital and Customer Care exist before any service is attached to them.
    .eq("services.active", true)
    .order("name")
    .returns<GroupProfile[]>();

  const groups = data ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <WorkspaceHeader
        eyebrow="Reports"
        title="Work Groups"
        description="Every service request is routed to the work group that owns its service, then delivered by a partner inside that group."
      />

      {groups.length === 0 ? (
        <Empty>No work groups are active yet.</Empty>
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
