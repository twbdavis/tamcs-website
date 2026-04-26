"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitResponseAction } from "@/app/actions/forms";
import type { FormField } from "@/lib/content-types";

const TEXTAREA_CLASS =
  "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const SELECT_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function FormRenderer({
  formId,
  fields,
  preview = false,
}: {
  formId: string;
  fields: FormField[];
  preview?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [submitted, setSubmitted] = useState(false);

  const [state, formAction, pending] = useActionState(
    submitResponseAction,
    null,
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) {
      toast.success(state.success);
      setSubmitted(true);
    }
  }, [state]);

  if (submitted) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center">
        <h2 className="text-xl font-semibold">Thanks for your response!</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your submission has been recorded.
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      action={preview ? undefined : formAction}
      onSubmit={(e) => {
        if (preview) {
          e.preventDefault();
          toast.message("Preview mode — submission disabled");
        }
      }}
      className="grid gap-5"
    >
      <input type="hidden" name="form_id" value={formId} />

      {fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          This form has no fields yet.
        </p>
      ) : (
        fields.map((f) => <FieldInput key={f.id} field={f} />)
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={pending || fields.length === 0}>
          {pending ? "Submitting…" : preview ? "Submit (preview)" : "Submit"}
        </Button>
      </div>
    </form>
  );
}

function FieldInput({ field }: { field: FormField }) {
  const name = `field_${field.id}`;
  const reqMark = field.is_required ? (
    <span className="ml-1 text-red-600">*</span>
  ) : null;

  switch (field.field_type) {
    case "textarea":
      return (
        <div className="grid gap-1.5">
          <Label htmlFor={name}>
            {field.label}
            {reqMark}
          </Label>
          <textarea
            id={name}
            name={name}
            placeholder={field.placeholder ?? ""}
            required={field.is_required}
            rows={4}
            className={TEXTAREA_CLASS}
          />
        </div>
      );

    case "select":
      return (
        <div className="grid gap-1.5">
          <Label htmlFor={name}>
            {field.label}
            {reqMark}
          </Label>
          <select
            id={name}
            name={name}
            required={field.is_required}
            defaultValue=""
            className={SELECT_CLASS}
          >
            <option value="" disabled>
              Choose one…
            </option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      );

    case "radio":
      return (
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">
            {field.label}
            {reqMark}
          </legend>
          <div className="grid gap-1.5">
            {field.options.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={name}
                  value={opt}
                  required={field.is_required}
                  className="size-4"
                />
                {opt}
              </label>
            ))}
          </div>
        </fieldset>
      );

    case "multiple_choice":
      return (
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">
            {field.label}
            {reqMark}
          </legend>
          <div className="grid gap-2">
            {field.options.map((opt) => (
              <label
                key={opt}
                className="flex cursor-pointer items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm transition-colors hover:bg-muted/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <input
                  type="radio"
                  name={name}
                  value={opt}
                  required={field.is_required}
                  className="size-4"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </fieldset>
      );

    case "checkbox":
      return (
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">
            {field.label}
            {reqMark}
          </legend>
          <div className="grid gap-1.5">
            {field.options.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name={name}
                  value={opt}
                  className="size-4"
                />
                {opt}
              </label>
            ))}
          </div>
        </fieldset>
      );

    case "number":
      return (
        <div className="grid gap-1.5">
          <Label htmlFor={name}>
            {field.label}
            {reqMark}
          </Label>
          <Input
            id={name}
            name={name}
            type="number"
            placeholder={field.placeholder ?? ""}
            required={field.is_required}
          />
        </div>
      );

    case "email":
      return (
        <div className="grid gap-1.5">
          <Label htmlFor={name}>
            {field.label}
            {reqMark}
          </Label>
          <Input
            id={name}
            name={name}
            type="email"
            placeholder={field.placeholder ?? ""}
            required={field.is_required}
          />
        </div>
      );

    case "text":
    default:
      return (
        <div className="grid gap-1.5">
          <Label htmlFor={name}>
            {field.label}
            {reqMark}
          </Label>
          <Input
            id={name}
            name={name}
            type="text"
            placeholder={field.placeholder ?? ""}
            required={field.is_required}
          />
        </div>
      );
  }
}
