import Link from "next/link";
import type { LoginRole } from "@/features/auth/loginRoles";

const links: Array<{ role: LoginRole; label: string }> = [
  { role: "client", label: "Client" },
  { role: "provider", label: "Provider" },
  { role: "staff", label: "Staff" },
];

export function RoleLoginNav({ activeRole }: { activeRole?: LoginRole }) {
  return (
    <nav aria-label="Choose a sign-in context" className="mt-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink/60">
        I am signing in as
      </p>
      <div className="mt-2 grid grid-cols-3 border-y border-ink">
        {links.map(({ role, label }) => {
          const active = activeRole === role;
          return (
            <Link
              key={role}
              href={`/login/${role}`}
              aria-current={active ? "page" : undefined}
              className={[
                "flex min-h-11 items-center justify-center border-r border-ink px-2 font-body text-[11px] font-semibold uppercase tracking-[0.07em] transition-colors last:border-r-0",
                "focus-visible:relative focus-visible:z-10",
                active
                  ? "bg-ink text-paper"
                  : "bg-transparent text-ink hover:bg-cream hover:text-cobalt",
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
