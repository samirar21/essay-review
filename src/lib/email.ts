import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

/**
 * Emails the student that feedback is ready. Called from the admin
 * feedback action, so the admin session can read the student's profile
 * under RLS. Email failures are logged but never block the review —
 * the feedback is already saved.
 */
export async function sendFeedbackReadyEmail(essayId: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping notification");
    return;
  }

  const supabase = await createClient();
  const { data: essay } = await supabase
    .from("essays")
    .select("school_name, essay_type, draft_number, profiles!essays_student_id_fkey(name, email)")
    .eq("id", essayId)
    .single();

  // Without generated DB types, Supabase types the to-one join as an array.
  const joined = essay?.profiles as unknown;
  const student = (Array.isArray(joined) ? joined[0] : joined) as
    | { name: string; email: string }
    | null;
  if (!essay || !student?.email) {
    console.error(`[email] could not load student for essay ${essayId}`);
    return;
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const feedbackUrl = `${siteUrl}/dashboard/essay/${essayId}`;
  const firstName = student.name.split(" ")[0];

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Draft to Admit <onboarding@resend.dev>",
      to: student.email,
      subject: `Your essay feedback is ready — ${essay.school_name}`,
      html: `
        <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; color: #1f2937;">
          <h1 style="font-size: 20px; color: #134e5e; margin-bottom: 4px;">Draft to Admit</h1>
          <p style="font-size: 13px; color: #6b7280; margin-top: 0;">Free essay reviews from a real student who's been through it.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="font-size: 15px; line-height: 1.6;">Hi ${firstName},</p>
          <p style="font-size: 15px; line-height: 1.6;">
            Your feedback is ready for your <strong>${essay.school_name}</strong> essay
            (draft ${essay.draft_number}). I've left inline comments, scored it across
            six categories, and written an overall summary.
          </p>
          <p style="margin: 28px 0;">
            <a href="${feedbackUrl}"
               style="background-color: #134e5e; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 15px; font-family: Arial, sans-serif;">
              View your feedback
            </a>
          </p>
          <p style="font-size: 13px; color: #6b7280; line-height: 1.6;">
            If the button doesn't work, copy this link into your browser:<br />
            <a href="${feedbackUrl}" style="color: #134e5e;">${feedbackUrl}</a>
          </p>
          <p style="font-size: 15px; line-height: 1.6;">Good luck with your application!</p>
        </div>
      `,
    });
    if (error) {
      console.error(`[email] Resend error for essay ${essayId}:`, error);
    }
  } catch (e) {
    console.error(`[email] failed to send for essay ${essayId}:`, e);
  }
}
