"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addFieldAction,
  updateFieldAction,
} from "@/app/actions/forms";
import { OptionsEditor } from "@/components/admin/options-editor";
import type { FormField, FormFieldType } from "@/lib/content-types";

const SELECT_CLASS =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

const TYPES: { value: FormFieldType; label: string }[] = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
  { value: "select", label: "Dropdown" },
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "radio", label: "Radio buttons" },
  { value: "checkbox", label: "Checkboxes" },
];

const HAS_OPTIONS: FormFieldType[] = [
  "select",
  "radio",
  "checkbox",
  "multiple_choice",
];

export function NewFieldForm({ formId }: { formId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<FormFieldType>("text");
  const [resetKey, setResetKey] = useState(0);
  const [state, formAction, pending] = useActionState(addFieldAction, null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) {
      toast.success(state.success);
      formRef.current?.reset();
      setType("text");
      // Force the OptionsEditor to drop its internal state.
      setResetKey((k) => k + 1);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3">
      <input type="hidden" name="form_id" value={formId} />
      <FieldFormBody
        key={resetKey}
        type={type}
        onTypeChange={setType}
        idPrefix="new"
      />
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add field"}
        </Button>
      </div>
    </form>
  );
}

export function EditFieldForm({
  field,
  onDone,
}: {
  field: FormField;
  onDone?: () => void;
}) {
  const [type, setType] = useState<FormFieldType>(field.field_type);
  const [state, formAction, pending] = useActionState(updateFieldAction, null);

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    if (state?.success) {
      toast.success(state.success);
      onDone?.();
    }
  }, [state, onDone]);

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="id" value={field.id} />
      <input type="hidden" name="form_id" value={field.form_id} />
      <FieldFormBody
        type={type}
        onTypeChange={setType}
        idPrefix={`edit-${field.id}`}
        defaults={{
          label: field.label,
          placeholder: field.placeholder ?? "",
          options: field.options,
          is_required: field.is_required,
        }}
      />
      <div className="flex justify-end gap-2">
        {onDone ? (
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function FieldFormBody({
  type,
  onTypeChange,
  idPrefix,
  defaults,
}: {
  type: FormFieldType;
  onTypeChange: (t: FormFieldType) => void;
  idPrefix: string;
  defaults?: {
    label?: string;
    placeholder?: string;
    options?: string[];
    is_required?: boolean;
  };
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">
        <div className="grid gap-1.5">
          <Label htmlFor={`${idPrefix}-label`}>Label</Label>
          <Input
            id={`${idPrefix}-label`}
            name="label"
            required
            defaultValue={defaults?.label ?? ""}
            placeholder="What's your name?"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`${idPrefix}-type`}>Type</Label>
          <select
            id={`${idPrefix}-type`}
            name="field_type"
            value={type}
            onChange={(e) => onTypeChange(e.target.value as FormFieldType)}
            className={SELECT_CLASS}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!HAS_OPTIONS.includes(type) ? (
        <div className="grid gap-1.5">
          <Label htmlFor={`${idPrefix}-placeholder`}>
            Placeholder (optional)
          </Label>
          <Input
            id={`${idPrefix}-placeholder`}
            name="placeholder"
            defaultValue={defaults?.placeholder ?? ""}
          />
        </div>
      ) : (
        <div className="grid gap-1.5">
          <Label>Options</Label>
          <OptionsEditor initial={defaults?.options ?? []} />
        </div>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_required"
          defaultChecked={defaults?.is_required ?? false}
          className="size-4"
        />
        Required
      </label>
    </>
  );
}
