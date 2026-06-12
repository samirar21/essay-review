import type { InlineComment } from "@/lib/types";

export interface Segment {
  start: number;
  end: number;
  /** ids of comments covering this segment; empty = plain text */
  commentIds: string[];
}

/**
 * Splits an essay of the given length into contiguous segments at every
 * comment boundary, so overlapping highlights render correctly.
 */
export function buildSegments(
  contentLength: number,
  comments: Pick<InlineComment, "id" | "start_index" | "end_index">[]
): Segment[] {
  const clamp = (n: number) => Math.max(0, Math.min(contentLength, n));

  const boundaries = new Set<number>([0, contentLength]);
  for (const c of comments) {
    boundaries.add(clamp(c.start_index));
    boundaries.add(clamp(c.end_index));
  }

  const points = [...boundaries].sort((a, b) => a - b);
  const segments: Segment[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    if (start >= end) continue;
    const commentIds = comments
      .filter((c) => clamp(c.start_index) <= start && clamp(c.end_index) >= end)
      .map((c) => c.id);
    segments.push({ start, end, commentIds });
  }

  return segments;
}
