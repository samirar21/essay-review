import Link from "next/link";
import { notFound } from "next/navigation";
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
import { ReviewWorkbench } from "./review-workbench";
import {
  ESSAY_TYPE_LABELS,
  type Essay,
  type Feedback,
  type InlineComment,
  type Profile,
} from "@/lib/types";

export const metadata = { title: "Review essay" };

export default async function AdminReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireProfile({ requireAdmin: true });
  const supabase = await createClient();

  const { data: essay } = await supabase
    .from("essays")
    .select("*, profiles!essays_student_id_fkey(name, email)")
    .eq("id", id)
    .single<Essay & { profiles: Pick<Profile, "name" | "email"> | null }>();

  if (!essay) notFound();

  // Opening a pending essay moves it into review.
  if (essay.status === "pending") {
    await supabase
      .from("essays")
      .update({ status: "in_review" })
      .eq("id", id)
      .eq("status", "pending");
    essay.status = "in_review";
  }

  const [{ data: feedback }, { data: comments }] = await Promise.all([
    supabase.from("feedback").select("*").eq("essay_id", id).maybeSingle<Feedback>(),
    supabase
      .from("inline_comments")
      .select("*")
      .eq("essay_id", id)
      .order("start_index"),
  ]);

  const wordCount = essay.content.trim().split(/\s+/).length;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
          <Link href="/admin">← Back to queue</Link>
        </Button>

        <div className="mb-2 flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-3xl font-semibold">
            {essay.school_name}
          </h1>
          <StatusBadge status={essay.status} />
        </div>
        <p className="mb-6 text-sm text-muted-foreground">
          {essay.profiles?.name} ({essay.profiles?.email}) ·{" "}
          {ESSAY_TYPE_LABELS[essay.essay_type]} · Draft {essay.draft_number} ·{" "}
          {wordCount} words
          {essay.word_limit ? ` / ${essay.word_limit} limit` : ""}
          {essay.deadline
            ? ` · Due ${new Date(essay.deadline + "T00:00:00").toLocaleDateString()}`
            : ""}
        </p>

        <div className="mb-8 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm leading-relaxed text-foreground/80">
                {essay.prompt}
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                What they want feedback on
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm leading-relaxed text-foreground/80">
                {essay.feedback_request || "No specific request."}
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <ReviewWorkbench
          essayId={essay.id}
          content={essay.content}
          initialComments={(comments ?? []) as InlineComment[]}
          existingFeedback={feedback ?? null}
        />
      </main>
    </div>
  );
}
