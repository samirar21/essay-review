"use client";

import { useMemo, useState } from "react";
import { buildSegments } from "@/lib/segments";
import { cn } from "@/lib/utils";
import type { InlineComment } from "@/lib/types";

/**
 * Student-facing essay view: highlighted passages are clickable and
 * reveal the reviewer's comment in the panel alongside.
 */
export function AnnotatedEssay({
  content,
  comments,
}: {
  content: string;
  comments: InlineComment[];
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...comments].sort((a, b) => a.start_index - b.start_index),
    [comments]
  );
  const segments = useMemo(
    () => buildSegments(content.length, sorted),
    [content.length, sorted]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <p className="whitespace-pre-wrap font-serif text-base leading-relaxed">
          {segments.map((seg) => {
            const text = content.slice(seg.start, seg.end);
            if (seg.commentIds.length === 0) {
              return <span key={seg.start}>{text}</span>;
            }
            const isActive = seg.commentIds.includes(activeId ?? "");
            return (
              <button
                key={seg.start}
                type="button"
                onClick={() =>
                  setActiveId(
                    isActive && seg.commentIds.length === 1
                      ? null
                      : seg.commentIds[0]
                  )
                }
                className={cn(
                  "inline cursor-pointer rounded-sm px-0 text-left font-serif text-base leading-relaxed transition-colors",
                  isActive
                    ? "bg-primary/30 ring-1 ring-primary"
                    : "bg-amber-200/70 hover:bg-amber-300/70"
                )}
              >
                {text}
              </button>
            );
          })}
        </p>
        {sorted.length === 0 ? null : (
          <p className="mt-4 text-xs text-muted-foreground">
            Highlighted passages have comments — click one to read it.
          </p>
        )}
      </div>

      <aside className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Inline comments ({sorted.length})
        </h3>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No inline comments on this draft.
          </p>
        ) : (
          sorted.map((comment, i) => {
            const isActive = comment.id === activeId;
            const excerpt = content.slice(
              comment.start_index,
              comment.end_index
            );
            return (
              <button
                key={comment.id}
                type="button"
                onClick={() => setActiveId(isActive ? null : comment.id)}
                className={cn(
                  "block w-full rounded-lg border p-3 text-left text-sm transition-colors",
                  isActive
                    ? "border-primary bg-accent"
                    : "bg-card hover:bg-muted/60"
                )}
              >
                <span className="mb-1 block text-xs font-medium text-muted-foreground">
                  #{i + 1} · “
                  {excerpt.length > 60 ? excerpt.slice(0, 60) + "…" : excerpt}”
                </span>
                {comment.comment_text}
              </button>
            );
          })
        )}
      </aside>
    </div>
  );
}
