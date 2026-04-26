"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupAction } from "@/app/actions/auth";
import { TAMU_EMAIL_ERROR } from "@/lib/validations";

function isTamuEmail(value: string): boolean {
  return value.trim().toLowerCase().endsWith("@tamu.edu");
}

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, null);
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);

  const showEmailError = touched && email !== "" && !isTamuEmail(email);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) toast.success(state.success);
  }, [state]);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        // Server validation enforces this too; this just keeps users from
        // wasting a round-trip when the email is obviously wrong.
        if (!isTamuEmail(email)) {
          e.preventDefault();
          setTouched(true);
          toast.error(TAMU_EMAIL_ERROR);
        }
      }}
      className="grid gap-4"
      noValidate
    >
      <div className="grid gap-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched(true)}
          aria-invalid={showEmailError || undefined}
          aria-describedby="email-help"
          placeholder="netid@tamu.edu"
        />
        <p
          id="email-help"
          className={
            "text-xs " +
            (showEmailError ? "text-red-600" : "text-muted-foreground")
          }
        >
          {showEmailError ? TAMU_EMAIL_ERROR : "Must be a @tamu.edu address."}
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        <p className="text-xs text-muted-foreground">
          At least 8 characters, including a letter and a number.
        </p>
      </div>
      <Button
        type="submit"
        disabled={pending || (touched && !isTamuEmail(email))}
        className="w-full"
      >
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
