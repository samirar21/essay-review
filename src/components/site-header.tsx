import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/(auth)/actions";
import type { Profile } from "@/lib/types";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    profile = data as Profile | null;
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-serif text-lg font-semibold text-primary">
          Draft to Admit
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {profile ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/submit">Submit an essay</Link>
              </Button>
              {profile.role === "admin" ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/admin">Admin</Link>
                </Button>
              ) : null}
              <form action={logout}>
                <Button type="submit" variant="outline" size="sm">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
