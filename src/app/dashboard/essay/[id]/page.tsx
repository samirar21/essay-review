import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { StatusBadge } from "@/components/status-badge";
import { ScoreGrid } from "@/components/score-grid";
import { AnnotatedEssay } from "@/components/essay/annotated-essay";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ESSAY_TYPE_LABELS,
  type Essay,
  type Feedback,
  type InlineComment,
} from "@/lib/types";

export const metadata = { title: "Essay feedback" };

export default async function EssayFeedbackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: essay } = await supabase
    .from("essays")
    .select("*")
    .eq("id", id)
    .single<Essay>();

  // RLS already restricts access; the explicit check keeps admins from
  // landing on the student view by accident.
  if (!essay || (essay.student_id !== profile.id && profile.role !== "admin")) {
    notFound();
  }

  const [{ data: feedback }, { data: comments }] = await Promise.all([
    supabase.from("feedback").select("*").eq("essay_id", id).maybeSingle<Feedback>(),
    supabase
      .from("inline_comments")
      .select("*")
      .eq("essay_id", id)
      .order("start_index"),
  ]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link href="/dashboard">← Back to dashboard</Link>
        </Button>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-3xl font-semibold">
            {essay.school_name}
          </h1>
          <StatusBadge status={essay.status} />
        </div>
        <p className="mb-8 text-sm text-muted-foreground">
          {ESSAY_TYPE_LABELS[essay.essay_type]} · Draft {essay.draft_number}
          {essay.word_limit ? ` · ${essay.word_limit} word limit` : ""} ·
          Submitted {new Date(essay.created_at).toLocaleDateString()}
        </p>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">Prompt</CardTitle>
            <CardDescription className="text-sm leading-relaxed text-foreground/80">
              {essay.prompt}
            </CardDescription>
          </CardHeader>
        </Card>

        {feedback ? (
          <>
            <section className="mb-8">
              <h2 className="mb-4 font-serif text-xl font-semibold">Scores</h2>
              <ScoreGrid feedback={feedback} />
            </section>

            <section className="mb-8">
              <h2 className="mb-4 font-serif text-xl font-semibold">
                Reviewer summary
              </h2>
              <Card>
                <CardContent className="p-6">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {feedback.summary}
                  </p>
                </CardContent>
              </Card>
            </section>

            <Separator className="my-8" />

            <section>
              <h2 className="mb-4 font-serif text-xl font-semibold">
                Your essay, annotated
              </h2>
              <AnnotatedEssay
                content={essay.content}
                comments={(comments ?? []) as InlineComment[]}
              />
            </section>
          </>
        ) : (
          <>
            <Card className="mb-8 border-dashed">
              <CardContent className="p-6 text-sm text-muted-foreground">
                {essay.status === "in_review"
                  ? "Your essay is being reviewed right now. You'll get an email as soon as feedback is ready."
                  : "Your essay is in the queue. You'll get an email as soon as feedback is ready."}
              </CardContent>
            </Card>
            <section>
              <h2 className="mb-4 font-serif text-xl font-semibold">
                Your essay
              </h2>
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <p className="whitespace-pre-wrap font-serif text-base leading-relaxed">
                  {essay.content}
                </p>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
