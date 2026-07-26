"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ACCOUNT_UNAVAILABLE,
  SIGN_IN_ERROR,
  SIGN_IN_UNAVAILABLE,
  SIGN_UP_ERROR,
  SIGN_UP_UNAVAILABLE,
} from "@/features/auth/authMessages";
import { createClient } from "@/lib/supabase/server";
import { credentialsSchema, signUpSchema } from "@/lib/validation/auth";

// Returned to the calling form via useActionState. undefined means success
// (the action redirects); a value carries a safe message to display.
export type AuthState = { error: string } | undefined;

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your sign-in details." };
  }

  try {
    const supabase = await createClient();
    const { data: authData, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) return { error: SIGN_IN_ERROR };
    if (!authData.user) return { error: SIGN_IN_UNAVAILABLE };

    // The route choice is presentational only. The authenticated profile remains
    // authoritative, and unavailable profiles are signed out before redirect.
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      return { error: SIGN_IN_UNAVAILABLE };
    }

    if (profile.status === "suspended") {
      await supabase.auth.signOut();
      return { error: ACCOUNT_UNAVAILABLE };
    }
  } catch {
    return { error: SIGN_IN_UNAVAILABLE };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the account details." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      // Seeds raw_user_meta_data, which the handle_new_user trigger reads to
      // populate the profile row. user_type is intentionally omitted so it
      // defaults to 'client'.
      options: { data: { full_name: parsed.data.fullName } },
    });
    if (error) return { error: SIGN_UP_ERROR };
  } catch {
    return { error: SIGN_UP_UNAVAILABLE };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
