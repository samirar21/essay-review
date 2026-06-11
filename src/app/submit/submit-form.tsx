"use client";

import { useActionState, useState } from "react";
import { submitEssay, type SubmitState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function SubmitForm() {
  const [state, formAction, pending] = useActionState<SubmitState, FormData>(
    submitEssay,
    { error: null }
  );
  const [content, setContent] = useState("");
  const [wordLimit, setWordLimit] = useState("");

  const words = countWords(content);
  const limit = parseInt(wordLimit, 10);
  const overLimit = !Number.isNaN(limit) && limit > 0 && words > limit;

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="school_name">School name</Label>
          <Input
            id="school_name"
            name="school_name"
            placeholder="e.g. Brown University, or Common App"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="essay_type">Essay type</Label>
          <Select name="essay_type" required defaultValue="common_app">
            <SelectTrigger id="essay_type">
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="common_app">Common App</SelectItem>
              <SelectItem value="supplemental">Supplemental</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prompt">Essay prompt</Label>
        <Textarea
          id="prompt"
          name="prompt"
          placeholder="Paste the exact prompt you're responding to"
          rows={2}
          required
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="word_limit">Word limit</Label>
          <Input
            id="word_limit"
            name="word_limit"
            type="number"
            min={1}
            placeholder="650"
            value={wordLimit}
            onChange={(e) => setWordLimit(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="draft_number">Draft number</Label>
          <Input
            id="draft_number"
            name="draft_number"
            type="number"
            min={1}
            defaultValue={1}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deadline">Deadline (optional)</Label>
          <Input id="deadline" name="deadline" type="date" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="content">Your essay</Label>
          <span
            className={`text-xs ${overLimit ? "font-medium text-destructive" : "text-muted-foreground"}`}
          >
            {words} {words === 1 ? "word" : "words"}
            {!Number.isNaN(limit) && limit > 0 ? ` / ${limit}` : ""}
          </span>
        </div>
        <Textarea
          id="content"
          name="content"
          placeholder="Paste your full essay here"
          rows={14}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        {overLimit ? (
          <p className="text-xs text-destructive">
            Heads up — you&apos;re over your word limit. You can still submit.
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="feedback_request">
          What feedback are you looking for? (optional)
        </Label>
        <Textarea
          id="feedback_request"
          name="feedback_request"
          placeholder="e.g. Does my opening hook work? Is the ending too cliché? Does it answer the prompt?"
          rows={3}
        />
      </div>

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Submitting…" : "Submit for review"}
      </Button>
    </form>
  );
}
