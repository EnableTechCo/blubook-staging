import { AuthShell } from "@/features/auth/AuthShell";
import { LoginForm } from "@/features/auth/LoginForm";
import { RoleLoginNav } from "@/features/auth/RoleLoginNav";
import type { LoginExperienceCopy, LoginRole } from "@/features/auth/loginRoles";

export function LoginExperience({
  copy,
  activeRole,
}: {
  copy: LoginExperienceCopy;
  activeRole?: LoginRole;
}) {
  return (
    <AuthShell panelTitle={copy.panelTitle} panelCopy={copy.panelCopy}>
      <p className="flex items-center gap-3 font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-cobalt">
        <span className="h-px w-7 bg-cobalt" aria-hidden="true" />
        {copy.eyebrow}
      </p>
      <h1 className="mt-3 max-w-[15ch] font-heading text-[clamp(2.4rem,6vh,4.25rem)] font-normal leading-[0.9] tracking-[-0.052em] text-ink">
        {copy.title}{" "}
        <em className="font-normal text-cobalt">{copy.emphasis}</em>
      </h1>
      <p className="mt-3 max-w-[32rem] font-body text-[13px] leading-5 text-ink/70">
        {copy.introduction}
      </p>

      <RoleLoginNav activeRole={activeRole} />
      <LoginForm submitLabel={copy.submitLabel} />
    </AuthShell>
  );
}
