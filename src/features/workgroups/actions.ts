"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/services/profiles";
import { toPackageSlug } from "@/lib/validation/catalogue";

async function requireStaff(): Promise<string | null> {
  const profile = await getCurrentProfile();
  if (!profile) return "Not authenticated";
  if (profile.user_type !== "staff") return "Only staff can manage work groups.";
  return null;
}

const DUPLICATE = "23505";

// Create or rename a work group. Failures come back on the page as a query
// param, since the page is a server component with no action state.
export async function saveWorkGroup(formData: FormData): Promise<void> {
  const denied = await requireStaff();
  if (denied) redirect(`/dashboard/work-groups?error=${encodeURIComponent(denied)}`);

  const parsed = z
    .object({ name: z.string().trim().min(1, "A work group needs a name").max(120) })
    .safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    redirect(
      `/dashboard/work-groups?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid input")}`,
    );
  }

  const groupId = z.string().uuid().safeParse(formData.get("groupId"));
  const supabase = await createClient();

  const { error } = groupId.success
    ? await supabase.from("service_groups").update({ name: parsed.data.name }).eq("id", groupId.data)
    : await supabase
        .from("service_groups")
        .insert({ name: parsed.data.name, slug: toPackageSlug(parsed.data.name) });

  if (error) {
    const message =
      error.code === DUPLICATE ? "A work group with that name already exists." : error.message;
    redirect(`/dashboard/work-groups?error=${encodeURIComponent(message)}`);
  }

  revalidatePath("/dashboard/work-groups");
  redirect("/dashboard/work-groups");
}

// Move a service into a work group, or out of every group (empty value). A
// service without a group falls back to matching any capable provider.
export async function setServiceGroup(formData: FormData): Promise<void> {
  if (await requireStaff()) return;

  const parsed = z
    .object({
      serviceId: z.string().uuid(),
      groupId: z.union([z.string().uuid(), z.literal("")]),
    })
    .safeParse({ serviceId: formData.get("serviceId"), groupId: formData.get("groupId") ?? "" });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("services")
    .update({ group_id: parsed.data.groupId === "" ? null : parsed.data.groupId })
    .eq("id", parsed.data.serviceId);

  revalidatePath("/dashboard/work-groups");
}

// Add or remove a partner from a work group.
export async function toggleGroupMember(formData: FormData): Promise<void> {
  if (await requireStaff()) return;

  const parsed = z
    .object({
      groupId: z.string().uuid(),
      providerId: z.string().uuid(),
      member: z.enum(["true", "false"]),
    })
    .safeParse({
      groupId: formData.get("groupId"),
      providerId: formData.get("providerId"),
      member: formData.get("member"),
    });
  if (!parsed.success) return;

  const supabase = await createClient();
  if (parsed.data.member === "true") {
    await supabase
      .from("work_group_members")
      .insert({ work_group_id: parsed.data.groupId, provider_id: parsed.data.providerId });
  } else {
    await supabase
      .from("work_group_members")
      .delete()
      .eq("work_group_id", parsed.data.groupId)
      .eq("provider_id", parsed.data.providerId);
  }

  revalidatePath("/dashboard/work-groups");
}
