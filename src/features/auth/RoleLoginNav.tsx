import Link from "next/link";
import type { LoginRole } from "@/features/auth/loginRoles";

const links: Array<{ role: LoginRole; label: string }> = [
  { role: "client", label: "Client" },
  { role: "provider", label: "Provider" },
  { role: "staff", label: "Staff" },
];

export function RoleLoginNav({ activeRole }: { activeRole?: LoginRole }) {
  return (
    <nav aria-label="Choose a sign-in context" className="mt-9">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[oklch(22%_0.012_60/0.58)]">
        I am signing in as
      </p>
      <div className="mt-3 grid grid-cols-3 border-y border-[oklch(22%_0.012_60)]">
        {links.map(({ role, label }) => {
          const active = activeRole === role;
          return (
            <Link
              key={role}
              href={`/login/${role}`}
              aria-current={active ? "page" : undefined}
              className={[
                "flex min-h-12 items-center justify-center border-r border-[oklch(22%_0.012_60)] px-2 font-body text-[11px] font-semibold uppercase tracking-[0.07em] transition-colors last:border-r-0",
                "focus-visible:relative focus-visible:z-10",
                active
                  ? "bg-[oklch(22%_0.012_60)] text-[oklch(95.5%_0.014_85)]"
                  : "bg-transparent text-[oklch(22%_0.012_60)] hover:bg-[oklch(91.8%_0.022_82)] hover:text-[oklch(60.5%_0.128_40)]",
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
