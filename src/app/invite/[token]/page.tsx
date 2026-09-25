import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { LandingFooter } from "@/components/public/LandingFooter";
import { LandingHeader } from "@/components/public/LandingHeader";
import { WorkspaceHeader } from "@/components/ui/Workspace";
import { Button, buttonStyles } from "@/components/ui/Button";
import { signOut } from "@/features/auth/actions";
import { OnboardClientWizard } from "@/features/onboarding/OnboardClientWizard";
import { INVITATION_PROBLEM, findInvitation } from "@/features/onboarding/invitations";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadOnboardingCatalogue } from "@/services/onboardingCatalogue";
import { getCurrentProfile } from "@/services/profiles";

// The token is in the path, so no page this links to may learn it from the
// Referer header, and no search engine may index it.
export const metadata: Metadata = {
  title: "Complete your onboarding · BluBook",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <LandingHeader />
      <main className="px-5 pb-24 pt-32 lg:px-7 lg:pt-36">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
      <LandingFooter />
    </div>
  );
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Frame>
      <div className="max-w-2xl">
        <WorkspaceHeader eyebrow="BluBook onboarding" title={title} />
        <div className="mt-6 space-y-5 text-sm leading-6 text-ink/75">{children}</div>
      </div>
    </Frame>
  );
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Completing an invitation while signed in would swap that session for the
  // new client's, so ask for a clean start instead.
  const profile = await getCurrentProfile();
  if (profile) {
    return (
      <Notice title="You are already signed in">
        <p>
          You are signed in to BluBook as <strong>{profile.email}</strong>. To complete an invitation for a new
          business, sign out first, then open the invitation link again.
        </p>
        <form action={signOut}>
          <Button type="submit" variant="secondary">Sign out</Button>
        </form>
      </Notice>
    );
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return (
      <Notice title="Onboarding is unavailable">
        <p>Onboarding cannot be completed right now. Please try again later, or contact your BluBook representative.</p>
      </Notice>
    );
  }

  const lookup = await findInvitation(admin, token);
  if ("problem" in lookup) {
    return (
      <Notice title={lookup.problem === "accepted" ? "This invitation has been used" : "This link no longer works"}>
        <p>{INVITATION_PROBLEM[lookup.problem]}</p>
        {lookup.problem === "accepted" ? (
          <Link href="/login/client" className={buttonStyles()}>Sign in</Link>
        ) : null}
      </Notice>
    );
  }

  const catalogue = await loadOnboardingCatalogue(admin);
  const { invitation } = lookup;

  return (
    <Frame>
      <WorkspaceHeader
        eyebrow="BluBook onboarding"
        title={invitation.business_name ? `Welcome, ${invitation.business_name}` : "Welcome to BluBook"}
        description="Tell us about your business, choose your services and set your password. When you submit, the BluBook team reviews your details and switches your services on."
      />
      <OnboardClientWizard
        packages={catalogue.packages}
        lineItems={catalogue.lineItems}
        workGroups={catalogue.workGroups}
        invitation={{ token, email: invitation.email }}
      />
    </Frame>
  );
}
