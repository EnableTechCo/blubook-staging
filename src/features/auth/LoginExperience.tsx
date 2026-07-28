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
      <p className="flex items-center gap-3 font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-[oklch(60.5%_0.128_40)]">
        <span className="h-px w-7 bg-[oklch(60.5%_0.128_40)]" aria-hidden="true" />
        {copy.eyebrow}
      </p>
      <h1 className="mt-3 max-w-[11ch] font-heading text-[clamp(2.65rem,7vh,4.75rem)] font-normal leading-[0.88] tracking-[-0.052em] text-[oklch(22%_0.012_60)]">
        {copy.title}{" "}
        <em className="font-normal text-[oklch(60.5%_0.128_40)]">{copy.emphasis}</em>
      </h1>
      <p className="mt-4 max-w-[32rem] font-body text-[13px] leading-5 text-[oklch(22%_0.012_60/0.68)]">
        {copy.introduction}
      </p>

      <RoleLoginNav activeRole={activeRole} />
      <LoginForm submitLabel={copy.submitLabel} />
    </AuthShell>
  );
}
