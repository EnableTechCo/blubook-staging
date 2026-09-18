import type { Metadata } from "next";
import { LoginExperience } from "@/features/auth/LoginExperience";
import { neutralLoginCopy } from "@/features/auth/loginRoles";

export const metadata: Metadata = { title: "Sign in · BluBook" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ accountCreated?: string }>;
}) {
  const { accountCreated } = await searchParams;
  return <LoginExperience copy={neutralLoginCopy} accountCreated={accountCreated === "1"} />;
}
