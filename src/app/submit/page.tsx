import { requireProfile } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SubmitForm } from "./submit-form";

export const metadata = { title: "Submit an essay" };

export default async function SubmitPage() {
  await requireProfile();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-2xl">
              Submit an essay for review
            </CardTitle>
            <CardDescription>
              The more context you give me, the better the feedback. Reviews
              are usually back within a few days — flag your deadline if
              it&apos;s sooner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubmitForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
