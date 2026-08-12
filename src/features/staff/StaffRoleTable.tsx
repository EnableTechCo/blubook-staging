"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldStyles, labelStyles } from "@/components/ui/formStyles";
import { assignStaffRole, type AssignRoleState } from "@/features/staff/actions";

export interface StaffMember {
  id: string;
  full_name: string | null;
  email: string;
  staff_role: string | null;
  status: string;
}

const ROLES = [
  ["operations", "Operations"],
  ["sales_admin", "Sales admin"],
  ["sales_rep", "Sales rep"],
  ["marketing", "Marketing"],
  ["admin", "Administrator"],
] as const;

// What each role actually reaches, in the same words the nav uses. An
// administrator assigning a role should not have to remember the tranches.
const WHAT_IT_OPENS: Record<string, string> = {
  operations: "Onboarding, work groups, default documents, client financials, customer records",
  sales_admin: "The service catalogue and prices, and the onboarding queue to watch",
  sales_rep: "The customer list. Nothing else has been opened to this role yet",
  marketing: "The customer list. Nothing else has been opened to this role yet",
  admin: "Everything, including compliance thresholds, partner tiers and these roles",
};

function StaffRow({ member, isSelf }: { member: StaffMember; isSelf: boolean }) {
  const [state, action, pending] = useActionState<AssignRoleState, FormData>(
    assignStaffRole,
    undefined,
  );

  return (
    <li className="bg-paper px-5 py-4">
      <form action={action} aria-busy={pending} className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <input type="hidden" name="profileId" value={member.id} />

        <div className="min-w-0">
          <p className="truncate font-medium text-ink">
            {member.full_name ?? member.email}
            {isSelf ? <span className="ml-2 text-[11px] text-ink/45">(you)</span> : null}
          </p>
          <p className="truncate text-[13px] text-ink/55">{member.email}</p>
          <p className="mt-1 text-[13px] leading-5 text-ink/55">
            {member.staff_role
              ? WHAT_IT_OPENS[member.staff_role]
              : "No role assigned, so this account reaches only what every staff login reaches."}
          </p>
        </div>

        <div className="flex items-end gap-3">
          <div>
            <label htmlFor={`role-${member.id}`} className={labelStyles}>
              Role
            </label>
            <select
              id={`role-${member.id}`}
              name="role"
              defaultValue={member.staff_role ?? ""}
              className={fieldStyles}
            >
              {member.staff_role ? null : <option value="">No role</option>}
              {ROLES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "Saving…" : "Assign"}
          </Button>
        </div>

        {state && "error" in state ? (
          <p role="alert" className="sm:col-span-2 border-l-[3px] border-clay bg-clay/10 px-4 py-3 text-[13px] leading-6 text-ink">
            {state.error}
          </p>
        ) : null}
        {state && "ok" in state ? (
          <p
            role="status"
            className="sm:col-span-2 border border-cobalt bg-cobalt-wash px-4 py-3 text-[13px] leading-6 text-ink"
          >
            {state.message}
          </p>
        ) : null}
      </form>
    </li>
  );
}

export function StaffRoleTable({
  members,
  currentProfileId,
}: {
  members: StaffMember[];
  currentProfileId: string;
}) {
  return (
    <ul className="grid gap-px border border-ink bg-ink">
      {members.map((member) => (
        <StaffRow key={member.id} member={member} isSelf={member.id === currentProfileId} />
      ))}
    </ul>
  );
}
