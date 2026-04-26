import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>
          New to TAMCS? Sign up to get started.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div
          role="note"
          className="rounded-md border border-[#500000]/30 bg-[#500000]/5 px-3 py-2 text-sm text-[#500000]"
        >
          Account registration is only available to registered members of
          Texas A&amp;M Club Swimming. You must use your{" "}
          <span className="font-semibold">@tamu.edu</span> email address to
          sign up.
        </div>
        <SignupForm />
      </CardContent>
    </Card>
  );
}
