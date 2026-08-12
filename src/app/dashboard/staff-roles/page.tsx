import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Empty, Section, WorkspaceHeader } from "@/features/dashboard/ui";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";
import { requireStaffRoute } from "@/services/staffRole";
import { StaffRoleTable, type StaffMember } from "@/features/staff/StaffRoleTable";

export const metadata: Metadata = { title: "Staff roles · BluBook" };
export const dynamic = "force-dynamic";

// Assigning a role became administrator-only when the privilege escalation was
// closed, which left the product with no way to do it at all. This is that way.
export default async function StaffRolesPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (await requireStaffRoute("/dashboard/staff-roles")) redirect("/dashboard");

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id,full_name,email,staff_role,status")
    .eq("user_type", "staff")
    .order("email")
    .returns<StaffMember[]>();
  const members = data ?? [];

  const admins = members.filter(
    (member) => member.staff_role === "admin" && member.status === "active",
  );

  return (
    <div className="mx-auto max-w-[92rem] space-y-8">
      <WorkspaceHeader
        eyebrow="Administration / Staff"
        title="Staff roles"
        description="A role decides which parts of the workspace a staff member can reach and change. Changes take effect on their next page load — nothing is copied onto a record, so withdrawing a role withdraws the access with it."
      />

      <Section
        title="Staff accounts"
        subtitle={`${members.length} account${members.length === 1 ? "" : "s"} · ${admins.length} administrator${admins.length === 1 ? "" : "s"}`}
      >
        {members.length === 0 ? (
          <Empty>No staff accounts.</Empty>
        ) : (
          <>
            {admins.length === 1 ? (
              <p className="mb-4 border-l-[3px] border-clay bg-clay/10 px-4 py-3 text-[13px] leading-6 text-ink">
                There is one administrator. Only an administrator can assign roles, so if this
                account is lost nobody can grant the role back from inside the product. The
                database refuses to demote the last one for the same reason — appoint a second.
              </p>
            ) : null}
            <StaffRoleTable members={members} currentProfileId={profile.id} />
          </>
        )}
      </Section>
    </div>
  );
}
