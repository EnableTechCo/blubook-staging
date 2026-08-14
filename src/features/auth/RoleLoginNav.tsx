import Link from "next/link";
import type { LoginRole } from "@/features/auth/loginRoles";

const links: Array<{ role: LoginRole; label: string }> = [
  { role: "client", label: "Client" },
  { role: "provider", label: "Provider" },
  { role: "staff", label: "Staff" },
];

export function RoleLoginNav({ activeRole }: { activeRole?: LoginRole }) {
  return (
    <nav aria-label="Choose a sign-in context" className="mt-5">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink/60">
        I am signing in as
      </p>
      <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl border border-ink/10 bg-cream/55 p-1">
        {links.map(({ role, label }) => {
          const active = activeRole === role;
          return (
            <Link
              key={role}
              href={`/login/${role}`}
              aria-current={active ? "page" : undefined}
              className={[
                "flex min-h-10 items-center justify-center rounded-lg border px-2 font-body text-[11px] font-semibold uppercase tracking-[0.07em] transition-colors",
                "focus-visible:relative focus-visible:z-10",
                active
                  ? "border-cobalt/15 bg-paper-light text-cobalt shadow-sm"
                  : "border-transparent bg-transparent text-ink/60 hover:bg-paper-light/70 hover:text-cobalt",
              ].join(" ")}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
