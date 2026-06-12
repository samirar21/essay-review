import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ESSAY_TYPE_LABELS, type Essay, type Feedback } from "@/lib/types";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const profile = await requireProfile();
  const { submitted } = await searchParams;
  const supabase = await createClient();

  const { data: essays } = await supabase
    .from("essays")
    .select("*, feedback(overall_score)")
    .eq("student_id", profile.id)
    .order("created_at", { ascending: false });

  const rows = (essays ?? []) as (Essay & {
    feedback: Pick<Feedback, "overall_score">[] | null;
  })[];

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-semibold">
              Hi, {profile.name.split(" ")[0]}
            </h1>
            <p className="mt-1 text-muted-foreground">
              Your essays and feedback, all in one place.
            </p>
          </div>
          <Button asChild>
            <Link href="/submit">Submit a new essay</Link>
          </Button>
        </div>

        {submitted ? (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Your essay was submitted! You&apos;ll get an email when feedback is
            ready.
          </div>
        ) : null}

        {rows.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No essays yet</CardTitle>
              <CardDescription>
                Submit your first essay and it will show up here with its
                review status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/submit">Submit an essay</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {rows.map((essay) => {
              const score = essay.feedback?.[0]?.overall_score;
              return (
                <Card key={essay.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-medium">{essay.school_name}</h2>
                        <StatusBadge status={essay.status} />
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                        {ESSAY_TYPE_LABELS[essay.essay_type]} · Draft{" "}
                        {essay.draft_number} · Submitted{" "}
                        {new Date(essay.created_at).toLocaleDateString()}
                        {essay.deadline
                          ? ` · Deadline ${new Date(
                              essay.deadline + "T00:00:00"
                            ).toLocaleDateString()}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {typeof score === "number" ? (
                        <div className="text-center">
                          <div className="text-2xl font-bold tabular-nums text-primary">
                            {score}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            overall
                          </div>
                        </div>
                      ) : null}
                      <Button
                        asChild
                        variant={essay.status === "complete" ? "default" : "outline"}
                      >
                        <Link href={`/dashboard/essay/${essay.id}`}>
                          {essay.status === "complete"
                            ? "View feedback"
                            : "View essay"}
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
