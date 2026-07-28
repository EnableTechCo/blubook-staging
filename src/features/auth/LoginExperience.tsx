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
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cobalt">
        {copy.eyebrow}
      </p>
      <h1 className="mt-5 max-w-[12ch] font-heading text-[clamp(3.4rem,8vw,5.4rem)] font-normal leading-[0.84] tracking-[-0.05em]">
        {copy.title}{" "}
        <em className="font-normal text-cobalt">{copy.emphasis}</em>
      </h1>
      <p className="mt-6 max-w-lg font-body text-sm leading-7 text-ink/70">
        {copy.introduction}
      </p>

      <RoleLoginNav activeRole={activeRole} />
      <LoginForm submitLabel={copy.submitLabel} />
    </AuthShell>
  );
}
