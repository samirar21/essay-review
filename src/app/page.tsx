import Link from "next/link";
import {
  FileText,
  Highlighter,
  Mail,
  MessageSquareText,
  PenLine,
  Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SCORE_CATEGORIES } from "@/lib/types";

const STEPS = [
  {
    icon: PenLine,
    title: "Submit your essay",
    description:
      "Paste your Common App, supplemental, or any application essay along with the prompt, word limit, and what kind of feedback you want.",
  },
  {
    icon: Highlighter,
    title: "I read it line by line",
    description:
      "I highlight specific passages and leave inline comments, score it across six categories, and write an overall summary of what's working and what isn't.",
  },
  {
    icon: Mail,
    title: "Get your feedback",
    description:
      "You'll get an email the moment your review is ready. Open your dashboard to see every comment, score, and suggestion.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-accent/60 to-background">
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-primary">
            100% free, always
          </p>
          <h1 className="mx-auto max-w-3xl font-serif text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Your college essay, reviewed by someone who just wrote theirs.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Free essay reviews from a real student who&apos;s been through it.
            Honest, specific, line-by-line feedback on your Common App and
            supplemental essays — not generic advice.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/signup">Submit your essay</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#how-it-works">How it works</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto w-full max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-center font-serif text-3xl font-semibold">
          How it works
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step) => (
            <Card key={step.title}>
              <CardHeader>
                <step.icon className="mb-2 h-6 w-6 text-primary" />
                <CardTitle>{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {step.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* What you get */}
      <section className="border-y bg-muted/40">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-center font-serif text-3xl font-semibold">
            What every review includes
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <MessageSquareText className="mb-2 h-6 w-6 text-primary" />
                <CardTitle>Inline comments</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  Specific passages of your essay are highlighted with comments
                  attached — so you know exactly which sentence I&apos;m talking
                  about, and why.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Sparkles className="mb-2 h-6 w-6 text-primary" />
                <CardTitle>Six-category scores</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {SCORE_CATEGORIES.map((c) => c.label).join(", ")} — each
                  scored out of 100, with an overall score so you can track
                  progress between drafts.
                </CardDescription>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <FileText className="mb-2 h-6 w-6 text-primary" />
                <CardTitle>An honest summary</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  A written overview of your essay&apos;s biggest strengths, its
                  weakest moments, and what I&apos;d change before you hit
                  submit.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
        <h2 className="font-serif text-3xl font-semibold">Who&apos;s reviewing?</h2>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          Just one person — me. I went through the college application process
          recently, read everything I could about what makes essays work, and
          wrote (and rewrote) my own until they did. I know how hard it is to
          get honest feedback that isn&apos;t from your parents or an expensive
          consultant. That&apos;s why this is free. Every essay gets my full
          attention, every comment is written by hand, and nothing you submit
          is ever shared with anyone.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/signup">Get your free review</Link>
        </Button>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <span className="font-serif font-semibold text-primary">
            Draft to Admit
          </span>
          <span>
            Free essay reviews from a real student who&apos;s been through it.
          </span>
        </div>
      </footer>
    </div>
  );
}
