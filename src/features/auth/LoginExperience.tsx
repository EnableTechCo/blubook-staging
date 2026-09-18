import Link from "next/link";
import { AuthShell } from "@/features/auth/AuthShell";
import { LoginForm } from "@/features/auth/LoginForm";
import { RoleLoginNav } from "@/features/auth/RoleLoginNav";
import type { LoginExperienceCopy, LoginRole } from "@/features/auth/loginRoles";

export function LoginExperience({
  copy,
  activeRole,
  accountCreated = false,
}: {
  copy: LoginExperienceCopy;
  activeRole?: LoginRole;
  accountCreated?: boolean;
}) {
  return (
    <AuthShell panelTitle={copy.panelTitle} panelCopy={copy.panelCopy}>
      <p className="flex items-center gap-3 font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-cobalt">
        <span className="h-px w-7 bg-cobalt" aria-hidden="true" />
        {copy.eyebrow}
      </p>
      <h1 className="mt-4 max-w-[15ch] font-heading text-[clamp(2.35rem,5vh,3.65rem)] font-normal leading-[0.95] tracking-[-0.042em] text-ink">
        {copy.title}{" "}
        <em className="font-normal text-cobalt">{copy.emphasis}</em>
      </h1>
      <p className="mt-4 max-w-[32rem] font-body text-[13px] leading-6 text-ink/65">
        {copy.introduction}
      </p>

      {accountCreated ? (
        <p role="status" className="mt-5 rounded-xl border border-teal/20 bg-emerald-50 px-4 py-3 font-body text-xs leading-5 text-teal">
          Your account is ready. Sign in with the email and password you chose.
        </p>
      ) : null}

      <RoleLoginNav activeRole={activeRole} />
      <LoginForm submitLabel={copy.submitLabel} />

      {!activeRole || activeRole === "client" ? (
        <p className="mt-5 text-center font-body text-xs leading-5 text-ink/60">
          New to BluBook?{" "}
          <Link
            href="/signup"
            className="border-b border-ink font-semibold text-ink hover:border-cobalt hover:text-cobalt"
          >
            Create a Client account
          </Link>
        </p>
      ) : null}
    </AuthShell>
  );
}
