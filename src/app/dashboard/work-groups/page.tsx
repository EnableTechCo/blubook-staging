import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { fieldStyles, labelStyles } from "@/components/ui/formStyles";
import { Empty, Section, WorkspaceHeader } from "@/features/dashboard/ui";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";
import {
  saveWorkGroup,
  setProviderTier,
  setServiceGroup,
  toggleGroupMember,
} from "@/features/workgroups/actions";

export const metadata: Metadata = { title: "Work groups · BluBook" };
export const dynamic = "force-dynamic";

interface Group {
  id: string;
  name: string;
  slug: string;
}
interface ServiceRow {
  id: string;
  name: string;
  group_id: string | null;
}
interface ProviderRow {
  id: string;
  business_name: string;
  status: string;
  tier: "standard" | "premium";
}

export default async function WorkGroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.user_type !== "staff") redirect("/dashboard");

  const { error } = await searchParams;

  const supabase = await createClient();
  const [groupsResult, servicesResult, providersResult, membersResult] = await Promise.all([
    supabase.from("service_groups").select("id,name,slug").eq("active", true).order("name").returns<Group[]>(),
    supabase.from("services").select("id,name,group_id").eq("active", true).order("name").returns<ServiceRow[]>(),
    supabase
      .from("providers")
      .select("id,business_name,status,tier")
      .order("business_name")
      .returns<ProviderRow[]>(),
    supabase
      .from("work_group_members")
      .select("work_group_id,provider_id")
      .returns<{ work_group_id: string; provider_id: string }[]>(),
  ]);

  const groups = groupsResult.data ?? [];
  const services = servicesResult.data ?? [];
  const providers = providersResult.data ?? [];
  const members = membersResult.data ?? [];

  const membersOf = (groupId: string) =>
    members.filter((m) => m.work_group_id === groupId).map((m) => m.provider_id);
  const servicesOf = (groupId: string) => services.filter((s) => s.group_id === groupId);
  const ungrouped = services.filter((s) => !s.group_id);

  return (
    <div className="mx-auto max-w-[92rem] space-y-8">
      <WorkspaceHeader
        eyebrow="Operations / Routing"
        title="Work groups"
        description="A request is sent to the work group that owns its service, then assigned to a partner inside that group. Partners still need the matching service capability."
      />

      {error ? (
        <p
          role="alert"
          className="border-l-[3px] border-clay bg-clay/10 px-4 py-3 text-[13px] leading-6 text-ink"
        >
          {error}
        </p>
      ) : null}

      <Section title="New work group" subtitle="Groups own services and contain the partners who deliver them">
        <form action={saveWorkGroup} className="flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1">
            <label htmlFor="name" className={labelStyles}>
              Name
            </label>
            <input id="name" name="name" required maxLength={120} className={fieldStyles} />
          </div>
          <Button type="submit">Create group</Button>
        </form>
      </Section>

      <Section
        title="Partner tiers"
        subtitle="Premium partners see the business identity of every client in their work groups. Standard partners see only the Customer ID."
      >
        {providers.length === 0 ? (
          <p className="text-sm text-ink/55">No providers registered.</p>
        ) : (
          <ul className="grid gap-px border border-ink bg-ink sm:grid-cols-2">
            {providers.map((provider) => {
              const premium = provider.tier === "premium";
              return (
                <li
                  key={provider.id}
                  className="flex items-center justify-between gap-3 bg-paper px-4 py-3 text-sm"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">
                      {provider.business_name}
                    </span>
                    <span
                      className={`text-[10px] uppercase tracking-[0.12em] ${
                        premium ? "text-rust" : "text-ink/45"
                      }`}
                    >
                      {premium ? "Premium partner" : "Standard partner"}
                    </span>
                  </span>
                  <form action={setProviderTier}>
                    <input type="hidden" name="providerId" value={provider.id} />
                    <input type="hidden" name="tier" value={premium ? "standard" : "premium"} />
                    <button
                      type="submit"
                      className={`text-xs underline-offset-4 hover:underline ${
                        premium ? "text-ink/55 hover:text-clay" : "text-rust"
                      }`}
                    >
                      {premium ? "Make standard" : "Make premium"}
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      {groups.length === 0 ? (
        <Empty>
          No work groups yet. Create one, give it services, then add the partners who deliver them.
        </Empty>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const groupMembers = membersOf(group.id);
            const groupServices = servicesOf(group.id);

            return (
              <Section
                key={group.id}
                title={group.name}
                subtitle={`${groupServices.length} service${groupServices.length === 1 ? "" : "s"} · ${groupMembers.length} partner${groupMembers.length === 1 ? "" : "s"}`}
              >
                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <p className={labelStyles}>Services routed here</p>
                    {groupServices.length === 0 ? (
                      <p className="mt-2 text-sm text-ink/55">
                        No services yet — assign one below.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-1">
                        {groupServices.map((service) => (
                          <li
                            key={service.id}
                            className="flex items-center justify-between gap-3 border-b border-ink/12 py-2 text-sm"
                          >
                            <span>{service.name}</span>
                            <form action={setServiceGroup}>
                              <input type="hidden" name="serviceId" value={service.id} />
                              <input type="hidden" name="groupId" value="" />
                              <button
                                type="submit"
                                className="text-xs text-ink/55 underline-offset-4 hover:text-clay hover:underline"
                              >
                                Remove
                              </button>
                            </form>
                          </li>
                        ))}
                      </ul>
                    )}

                    {ungrouped.length > 0 ? (
                      <form action={setServiceGroup} className="mt-4 flex flex-wrap items-end gap-2">
                        <input type="hidden" name="groupId" value={group.id} />
                        <div className="min-w-48 flex-1">
                          <label htmlFor={`svc-${group.id}`} className={labelStyles}>
                            Add a service
                          </label>
                          <select
                            id={`svc-${group.id}`}
                            name="serviceId"
                            defaultValue=""
                            className={fieldStyles}
                          >
                            <option value="" disabled>
                              Choose a service…
                            </option>
                            {ungrouped.map((service) => (
                              <option key={service.id} value={service.id}>
                                {service.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button type="submit" variant="secondary">
                          Add
                        </Button>
                      </form>
                    ) : null}
                  </div>

                  <div>
                    <p className={labelStyles}>Partners in this group</p>
                    {providers.length === 0 ? (
                      <p className="mt-2 text-sm text-ink/55">No providers registered.</p>
                    ) : (
                      <ul className="mt-2 space-y-1">
                        {providers.map((provider) => {
                          const isMember = groupMembers.includes(provider.id);
                          return (
                            <li
                              key={provider.id}
                              className="flex items-center justify-between gap-3 border-b border-ink/12 py-2 text-sm"
                            >
                              <span className={isMember ? "font-medium text-ink" : "text-ink/55"}>
                                {provider.business_name}
                                {provider.status !== "active" ? (
                                  <span className="ml-2 text-[10px] uppercase tracking-[0.1em] text-ink/40">
                                    {provider.status}
                                  </span>
                                ) : null}
                              </span>
                              <form action={toggleGroupMember}>
                                <input type="hidden" name="groupId" value={group.id} />
                                <input type="hidden" name="providerId" value={provider.id} />
                                <input type="hidden" name="member" value={isMember ? "false" : "true"} />
                                <button
                                  type="submit"
                                  className={`text-xs underline-offset-4 hover:underline ${
                                    isMember ? "text-ink/55 hover:text-clay" : "text-rust"
                                  }`}
                                >
                                  {isMember ? "Remove" : "Add"}
                                </button>
                              </form>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </Section>
            );
          })}
        </div>
      )}

      {ungrouped.length > 0 ? (
        <Section
          title="Services without a work group"
          subtitle="These match any capable partner, as before"
        >
          <ul className="flex flex-wrap gap-2">
            {ungrouped.map((service) => (
              <li
                key={service.id}
                className="border border-ink/25 px-3 py-1.5 text-sm text-ink/65"
              >
                {service.name}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}
