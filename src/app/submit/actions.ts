"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SubmitState = { error: string | null };

export async function submitEssay(
  _prevState: SubmitState,
  formData: FormData
): Promise<SubmitState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/submit");
  }

  const schoolName = (formData.get("school_name") as string)?.trim();
  const prompt = (formData.get("prompt") as string)?.trim();
  const essayType = formData.get("essay_type") as string;
  const wordLimitRaw = (formData.get("word_limit") as string)?.trim();
  const draftNumberRaw = (formData.get("draft_number") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const deadline = (formData.get("deadline") as string)?.trim();
  const feedbackRequest = (formData.get("feedback_request") as string)?.trim();

  if (!schoolName || !prompt || !essayType || !content) {
    return { error: "School, prompt, essay type, and essay text are required." };
  }
  if (!["common_app", "supplemental", "other"].includes(essayType)) {
    return { error: "Invalid essay type." };
  }

  const wordLimit = wordLimitRaw ? parseInt(wordLimitRaw, 10) : null;
  if (wordLimit !== null && (Number.isNaN(wordLimit) || wordLimit <= 0)) {
    return { error: "Word limit must be a positive number." };
  }

  const draftNumber = draftNumberRaw ? parseInt(draftNumberRaw, 10) : 1;
  if (Number.isNaN(draftNumber) || draftNumber <= 0) {
    return { error: "Draft number must be a positive number." };
  }

  const { error } = await supabase.from("essays").insert({
    student_id: user.id,
    school_name: schoolName,
    prompt,
    essay_type: essayType,
    word_limit: wordLimit,
    draft_number: draftNumber,
    content,
    deadline: deadline || null,
    feedback_request: feedbackRequest || null,
  });

  if (error) {
    return { error: `Could not submit your essay: ${error.message}` };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?submitted=1");
}
