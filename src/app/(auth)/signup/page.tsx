import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignupForm } from "./signup-form";

export const metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4">
      <Link href="/" className="mb-8 font-serif text-2xl font-semibold text-primary">
        Draft to Admit
      </Link>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Free essay reviews — no catch, no credit card.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignupForm />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
