"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  addInlineComment,
  deleteInlineComment,
  submitFeedback,
} from "@/app/admin/actions";
import { buildSegments } from "@/lib/segments";
import { cn } from "@/lib/utils";
import {
  SCORE_CATEGORIES,
  type Feedback,
  type InlineComment,
  type ScoreKey,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface PendingSelection {
  start: number;
  end: number;
}

export function ReviewWorkbench({
  essayId,
  content,
  initialComments,
  existingFeedback,
}: {
  essayId: string;
  content: string;
  initialComments: InlineComment[];
  existingFeedback: Feedback | null;
}) {
  const router = useRouter();
  const essayRef = useRef<HTMLParagraphElement>(null);

  const [comments, setComments] = useState(initialComments);
  const [selection, setSelection] = useState<PendingSelection | null>(null);
  const [draft, setDraft] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [savingComment, startCommentSave] = useTransition();

  const [scores, setScores] = useState<Record<ScoreKey, string>>(() => {
    const init = {} as Record<ScoreKey, string>;
    for (const { key } of SCORE_CATEGORIES) {
      init[key] = existingFeedback ? String(existingFeedback[key]) : "";
    }
    return init;
  });
  const [summary, setSummary] = useState(existingFeedback?.summary ?? "");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, startSubmit] = useTransition();

  const segments = useMemo(
    () => buildSegments(content.length, comments),
    [content.length, comments]
  );

  const parsedScores = SCORE_CATEGORIES.map(({ key }) =>
    parseInt(scores[key], 10)
  );
  const allScoresValid = parsedScores.every(
    (n) => Number.isInteger(n) && n >= 0 && n <= 100
  );
  const overall = allScoresValid
    ? Math.round(
        parsedScores.reduce((a, b) => a + b, 0) / SCORE_CATEGORIES.length
      )
    : null;

  /**
   * Maps the browser selection to character offsets in the essay string.
   * Works because the rendered text inside the container is exactly
   * `content` — highlights are spans that add no extra text.
   */
  function handleMouseUp() {
    const container = essayRef.current;
    const sel = window.getSelection();
    if (!container || !sel || sel.isCollapsed || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    if (
      !container.contains(range.startContainer) ||
      !container.contains(range.endContainer)
    ) {
      return;
    }

    const preRange = range.cloneRange();
    preRange.selectNodeContents(container);
    preRange.setEnd(range.startContainer, range.startOffset);
    const start = preRange.toString().length;
    const length = range.toString().length;
    if (length === 0) return;

    setSelection({ start, end: start + length });
    setCommentError(null);
  }

  function saveComment() {
    if (!selection) return;
    const text = draft.trim();
    if (!text) {
      setCommentError("Write a comment first.");
      return;
    }
    startCommentSave(async () => {
      const result = await addInlineComment({
        essayId,
        startIndex: selection.start,
        endIndex: selection.end,
        commentText: text,
      });
      if (result.error !== undefined) {
        setCommentError(result.error);
        return;
      }
      const saved = result.comment;
      setComments((prev) =>
        [...prev, saved].sort((a, b) => a.start_index - b.start_index)
      );
      setSelection(null);
      setDraft("");
      window.getSelection()?.removeAllRanges();
    });
  }

  function removeComment(commentId: string) {
    startCommentSave(async () => {
      const result = await deleteInlineComment({ commentId, essayId });
      if (!result.error) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    });
  }

  function handleSubmitFeedback() {
    setSubmitError(null);
    const numericScores: Record<string, number> = {};
    for (const { key } of SCORE_CATEGORIES) {
      numericScores[key] = parseInt(scores[key], 10);
    }
    startSubmit(async () => {
      const result = await submitFeedback({
        essayId,
        scores: numericScores,
        summary,
      });
      if (result.error) {
        setSubmitError(result.error);
        return;
      }
      setSubmitted(true);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Essay with highlights */}
        <div>
          <h2 className="mb-3 font-serif text-xl font-semibold">Essay</h2>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <p
              ref={essayRef}
              onMouseUp={handleMouseUp}
              className="whitespace-pre-wrap font-serif text-base leading-relaxed"
            >
              {segments.map((seg) => (
                <span
                  key={seg.start}
                  className={cn(
                    seg.commentIds.length > 0 &&
                      "rounded-sm bg-amber-200/70"
                  )}
                >
                  {content.slice(seg.start, seg.end)}
                </span>
              ))}
            </p>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Select any passage to attach an inline comment.
          </p>
        </div>

        {/* Comment panel */}
        <aside className="space-y-4">
          <h2 className="font-serif text-xl font-semibold">Comments</h2>

          {selection ? (
            <Card className="border-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">New comment</CardTitle>
                <CardDescription className="text-xs">
                  “
                  {content.slice(selection.start, selection.end).length > 80
                    ? content.slice(selection.start, selection.start + 80) + "…"
                    : content.slice(selection.start, selection.end)}
                  ”
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  autoFocus
                  rows={3}
                  placeholder="Your comment on this passage"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                {commentError ? (
                  <p className="text-xs text-destructive">{commentError}</p>
                ) : null}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={saveComment}
                    disabled={savingComment}
                  >
                    {savingComment ? "Saving…" : "Add comment"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setSelection(null);
                      setDraft("");
                      window.getSelection()?.removeAllRanges();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
              Highlight text in the essay to add a comment.
            </p>
          )}

          {comments.map((comment, i) => {
            const excerpt = content.slice(
              comment.start_index,
              comment.end_index
            );
            return (
              <div
                key={comment.id}
                className="rounded-lg border bg-card p-3 text-sm"
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    #{i + 1} · “
                    {excerpt.length > 50 ? excerpt.slice(0, 50) + "…" : excerpt}
                    ”
                  </span>
                  <button
                    type="button"
                    onClick={() => removeComment(comment.id)}
                    className="text-muted-foreground transition-colors hover:text-destructive"
                    aria-label="Delete comment"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {comment.comment_text}
              </div>
            );
          })}
        </aside>
      </div>

      <Separator />

      {/* Scoring + summary */}
      <section>
        <h2 className="mb-4 font-serif text-xl font-semibold">
          Scores &amp; summary
        </h2>
        <Card>
          <CardContent className="space-y-6 p-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {SCORE_CATEGORIES.map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={key}>{label}</Label>
                  <Input
                    id={key}
                    type="number"
                    min={0}
                    max={100}
                    placeholder="0–100"
                    value={scores[key]}
                    onChange={(e) =>
                      setScores((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-muted p-4">
              <span className="text-sm font-medium">Overall score</span>
              <span className="text-2xl font-bold tabular-nums text-primary">
                {overall ?? "—"}
              </span>
              <span className="text-xs text-muted-foreground">
                auto-calculated average of the six categories
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Overall summary</Label>
              <Textarea
                id="summary"
                rows={6}
                placeholder="The big picture: what works, what doesn't, and what to do next."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
            </div>

            {submitError ? (
              <p className="text-sm text-destructive">{submitError}</p>
            ) : null}
            {submitted ? (
              <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">
                Feedback submitted — the student has been notified by email.
              </p>
            ) : null}

            <Button
              size="lg"
              onClick={handleSubmitFeedback}
              disabled={submitting || !allScoresValid || !summary.trim()}
            >
              {submitting
                ? "Submitting…"
                : existingFeedback
                  ? "Update feedback"
                  : "Submit feedback & notify student"}
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
