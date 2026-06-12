import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ESSAY_TYPE_LABELS,
  STATUS_LABELS,
  type Essay,
  type EssayStatus,
  type Profile,
} from "@/lib/types";

export const metadata = { title: "Review queue" };

const FILTERS: { value: "all" | EssayStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: STATUS_LABELS.pending },
  { value: "in_review", label: STATUS_LABELS.in_review },
  { value: "complete", label: STATUS_LABELS.complete },
];

export default async function AdminQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireProfile({ requireAdmin: true });
  const { status } = await searchParams;
  const filter = FILTERS.some((f) => f.value === status) ? status : "all";

  const supabase = await createClient();
  let query = supabase
    .from("essays")
    .select("*, profiles!essays_student_id_fkey(name, email)")
    .order("created_at", { ascending: true });
  if (filter !== "all") {
    query = query.eq("status", filter);
  }
  const { data: essays } = await query;

  const rows = (essays ?? []) as (Essay & {
    profiles: Pick<Profile, "name" | "email"> | null;
  })[];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold">Review queue</h1>
        <p className="mt-1 text-muted-foreground">
          {rows.length} {rows.length === 1 ? "essay" : "essays"}
          {filter !== "all"
            ? ` · ${STATUS_LABELS[filter as EssayStatus].toLowerCase()}`
            : ""}
        </p>

        <div className="mt-6 flex gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f.value}
              href={f.value === "all" ? "/admin" : `/admin?status=${f.value}`}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                filter === f.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card hover:bg-muted"
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>

        <div className="mt-6 grid gap-3">
          {rows.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                Nothing here. Enjoy the quiet while it lasts.
              </CardContent>
            </Card>
          ) : (
            rows.map((essay) => (
              <Card key={essay.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{essay.school_name}</span>
                      <StatusBadge status={essay.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {essay.profiles?.name ?? "Unknown"} (
                      {essay.profiles?.email ?? "—"}) ·{" "}
                      {ESSAY_TYPE_LABELS[essay.essay_type]} · Draft{" "}
                      {essay.draft_number} · Submitted{" "}
                      {new Date(essay.created_at).toLocaleDateString()}
                      {essay.deadline ? (
                        <span className="font-medium text-destructive">
                          {" "}
                          · Due{" "}
                          {new Date(
                            essay.deadline + "T00:00:00"
                          ).toLocaleDateString()}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <Button asChild>
                    <Link href={`/admin/review/${essay.id}`}>
                      {essay.status === "complete" ? "Edit review" : "Review"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
