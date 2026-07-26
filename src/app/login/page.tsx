import type { Metadata } from "next";
import { LoginExperience } from "@/features/auth/LoginExperience";
import { neutralLoginCopy } from "@/features/auth/loginRoles";

export const metadata: Metadata = { title: "Sign in · BluBook" };

export default function LoginPage() {
  return <LoginExperience copy={neutralLoginCopy} />;
}
