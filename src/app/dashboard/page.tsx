import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signOut } from "@/features/auth/actions";
import { getCurrentProfile } from "@/services/profiles";

export const metadata: Metadata = { title: "Dashboard · BluBook" };

// Depends on the request's session; never prerender.
export const dynamic = "force-dynamic";

const roleLabel: Record<string, string> = {
  client: "Client",
  service_provider: "Service provider",
  staff: "BluBook staff",
};

export default async function DashboardPage() {
  const profile = await getCurrentProfile();

  // Middleware already guards this route; this is a defensive fallback.
  if (!profile) redirect("/login");

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-6 p-8">
      <div>
        <p className="text-sm font-medium text-sky-700">Signed in</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {profile.full_name ?? profile.email ?? "Your account"}
        </h1>
      </div>

      <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
        <dt className="text-slate-500">Account type</dt>
        <dd className="font-medium">{roleLabel[profile.user_type] ?? profile.user_type}</dd>
        {profile.staff_role ? (
          <>
            <dt className="text-slate-500">Staff role</dt>
            <dd className="font-medium capitalize">{profile.staff_role}</dd>
          </>
        ) : null}
        <dt className="text-slate-500">Email</dt>
        <dd className="font-medium">{profile.email ?? "—"}</dd>
        <dt className="text-slate-500">Status</dt>
        <dd className="font-medium capitalize">{profile.status}</dd>
      </dl>

      <form action={signOut}>
        <button
          type="submit"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
