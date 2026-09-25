import { WorkspaceHeader } from "@/components/ui/Workspace";

/**
 * What a client sees between submitting their onboarding and being approved.
 * Every dashboard page shows this instead of its own content, so there is
 * nothing to act on — and nothing that could reach a partner — until then.
 */
export function AwaitingApproval({ name }: { name: string | null }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <WorkspaceHeader
        eyebrow="Account pending approval"
        title={name ? `Thank you, ${name}` : "Thank you"}
        description="Your onboarding is with the BluBook team. Once they approve your account, your services are switched on and this workspace opens."
      />
      <section className="workspace-panel p-5 sm:p-6">
        <h2 className="font-heading text-lg">What happens next</h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-6 text-ink/75">
          <li>The BluBook team checks the details you submitted.</li>
          <li>They approve your account and activate the services you chose.</li>
          <li>You receive a welcome message and your compliance checklist in your BluBook inbox.</li>
        </ol>
        <p className="mt-4 text-sm leading-6 text-ink/60">
          There is nothing more you need to do for now. Sign in again at any time to check whether your account is ready.
        </p>
      </section>
    </div>
  );
}
