import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * Returns the signed-in user's profile, redirecting to /login if
 * there is no session. Pass requireAdmin to also enforce the admin role.
 */
export async function requireProfile(options?: {
  requireAdmin?: boolean;
}): Promise<Profile> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  if (options?.requireAdmin && profile.role !== "admin") {
    redirect("/dashboard");
  }

  return profile as Profile;
}
