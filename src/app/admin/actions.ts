"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { SCORE_CATEGORIES, type InlineComment } from "@/lib/types";
import { sendFeedbackReadyEmail } from "@/lib/email";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Not authorized");
  return { supabase, adminId: user.id };
}

export async function addInlineComment(input: {
  essayId: string;
  startIndex: number;
  endIndex: number;
  commentText: string;
}): Promise<
  { comment: InlineComment; error?: never } | { comment?: never; error: string }
> {
  try {
    const { supabase, adminId } = await requireAdmin();

    const text = input.commentText.trim();
    if (!text) return { error: "Comment text is required." };
    if (
      !Number.isInteger(input.startIndex) ||
      !Number.isInteger(input.endIndex) ||
      input.startIndex < 0 ||
      input.endIndex <= input.startIndex
    ) {
      return { error: "Invalid highlight range." };
    }

    const { data: essay } = await supabase
      .from("essays")
      .select("id, content")
      .eq("id", input.essayId)
      .single();
    if (!essay) return { error: "Essay not found." };
    if (input.endIndex > essay.content.length) {
      return { error: "Highlight range is outside the essay." };
    }

    const { data, error } = await supabase
      .from("inline_comments")
      .insert({
        essay_id: input.essayId,
        reviewer_id: adminId,
        start_index: input.startIndex,
        end_index: input.endIndex,
        comment_text: text,
      })
      .select()
      .single();

    if (error) return { error: error.message };
    revalidatePath(`/admin/review/${input.essayId}`);
    return { comment: data as InlineComment };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

export async function deleteInlineComment(input: {
  commentId: string;
  essayId: string;
}): Promise<{ error: string | null }> {
  try {
    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from("inline_comments")
      .delete()
      .eq("id", input.commentId);
    if (error) return { error: error.message };
    revalidatePath(`/admin/review/${input.essayId}`);
    return { error: null };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Something went wrong.",
    };
  }
}

export async function submitFeedback(input: {
  essayId: string;
  scores: Record<string, number>;
  summary: string;
}): Promise<{ error: string | null }> {
  try {
    const { supabase, adminId } = await requireAdmin();

    const summary = input.summary.trim();
    if (!summary) return { error: "An overall summary is required." };

    const scores: Record<string, number> = {};
    for (const { key, label } of SCORE_CATEGORIES) {
      const value = input.scores[key];
      if (!Number.isInteger(value) || value < 0 || value > 100) {
        return { error: `${label} must be a whole number from 0 to 100.` };
      }
      scores[key] = value;
    }

    const overall = Math.round(
      SCORE_CATEGORIES.reduce((sum, { key }) => sum + scores[key], 0) /
        SCORE_CATEGORIES.length
    );

    const { error } = await supabase.from("feedback").upsert(
      {
        essay_id: input.essayId,
        reviewer_id: adminId,
        overall_score: overall,
        ...scores,
        summary,
      },
      { onConflict: "essay_id" }
    );
    if (error) return { error: error.message };

    const { error: statusError } = await supabase
      .from("essays")
      .update({ status: "complete" })
      .eq("id", input.essayId);
    if (statusError) return { error: statusError.message };

    await sendFeedbackReadyEmail(input.essayId);

    revalidatePath("/admin");
    revalidatePath(`/admin/review/${input.essayId}`);
    revalidatePath("/dashboard");
    return { error: null };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Something went wrong.",
    };
  }
}

export async function markInReview(essayId: string) {
  const { supabase } = await requireAdmin();
  await supabase
    .from("essays")
    .update({ status: "in_review" })
    .eq("id", essayId)
    .eq("status", "pending");
  revalidatePath("/admin");
}
