import { Progress } from "@/components/ui/progress";
import { SCORE_CATEGORIES, type Feedback } from "@/lib/types";

export function ScoreGrid({ feedback }: { feedback: Feedback }) {
  return (
    <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center justify-center rounded-xl border bg-primary px-8 py-6 text-primary-foreground">
        <span className="text-4xl font-bold tabular-nums">
          {feedback.overall_score}
        </span>
        <span className="mt-1 text-xs uppercase tracking-wide opacity-80">
          Overall / 100
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {SCORE_CATEGORIES.map(({ key, label }) => (
          <div key={key}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span>{label}</span>
              <span className="font-medium tabular-nums">{feedback[key]}</span>
            </div>
            <Progress value={feedback[key]} />
          </div>
        ))}
      </div>
    </div>
  );
}
