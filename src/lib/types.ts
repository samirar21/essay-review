export type Role = "student" | "admin";
export type EssayType = "common_app" | "supplemental" | "other";
export type EssayStatus = "pending" | "in_review" | "complete";

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface Essay {
  id: string;
  student_id: string;
  school_name: string;
  prompt: string;
  essay_type: EssayType;
  word_limit: number | null;
  draft_number: number;
  content: string;
  deadline: string | null;
  feedback_request: string | null;
  status: EssayStatus;
  created_at: string;
}

export interface Feedback {
  id: string;
  essay_id: string;
  reviewer_id: string;
  overall_score: number;
  uniqueness_score: number;
  voice_score: number;
  hook_score: number;
  authenticity_score: number;
  flow_score: number;
  conciseness_score: number;
  summary: string;
  created_at: string;
}

export interface InlineComment {
  id: string;
  essay_id: string;
  reviewer_id: string;
  start_index: number;
  end_index: number;
  comment_text: string;
  created_at: string;
}

export const ESSAY_TYPE_LABELS: Record<EssayType, string> = {
  common_app: "Common App",
  supplemental: "Supplemental",
  other: "Other",
};

export const STATUS_LABELS: Record<EssayStatus, string> = {
  pending: "Pending",
  in_review: "In Review",
  complete: "Complete",
};

export const SCORE_CATEGORIES = [
  { key: "uniqueness_score", label: "Uniqueness" },
  { key: "voice_score", label: "Voice" },
  { key: "hook_score", label: "Hook" },
  { key: "authenticity_score", label: "Authenticity" },
  { key: "flow_score", label: "Flow" },
  { key: "conciseness_score", label: "Conciseness" },
] as const;

export type ScoreKey = (typeof SCORE_CATEGORIES)[number]["key"];
