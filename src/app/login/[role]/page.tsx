import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LoginExperience } from "@/features/auth/LoginExperience";
import {
  isLoginRole,
  loginRoleCopy,
  LOGIN_ROLES,
} from "@/features/auth/loginRoles";

export function generateStaticParams() {
  return LOGIN_ROLES.map((role) => ({ role }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ role: string }>;
}): Promise<Metadata> {
  const { role } = await params;
  if (!isLoginRole(role)) return {};
  const label = role === "staff" ? "Staff" : role === "provider" ? "Provider" : "Client";
  return { title: `${label} sign in · BluBook` };
}

export default async function RoleLoginPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  if (!isLoginRole(role)) notFound();

  return <LoginExperience copy={loginRoleCopy[role]} activeRole={role} />;
}
