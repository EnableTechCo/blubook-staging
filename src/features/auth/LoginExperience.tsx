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
      <h1 className="mt-4 max-w-[15ch] font-heading text-[clamp(2.35rem,5vh,3.65rem)] font-normal leading-[0.95] tracking-[-0.042em] text-ink">
        {copy.title}{" "}
        <em className="font-normal text-cobalt">{copy.emphasis}</em>
      </h1>
      <p className="mt-4 max-w-[32rem] font-body text-[13px] leading-6 text-ink/65">
        {copy.introduction}
      </p>

      <RoleLoginNav activeRole={activeRole} />
      <LoginForm submitLabel={copy.submitLabel} />
    </AuthShell>
  );
}
