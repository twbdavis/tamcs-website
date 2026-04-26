"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { EditFieldForm } from "@/components/admin/form-field-editor";
import {
  deleteFieldAction,
  moveFieldAction,
} from "@/app/actions/forms";
import type { FormField } from "@/lib/content-types";

const TYPE_LABELS: Record<FormField["field_type"], string> = {
  text: "Short text",
  textarea: "Long text",
  email: "Email",
  number: "Number",
  select: "Dropdown",
  radio: "Radio",
  checkbox: "Checkboxes",
  multiple_choice: "Multiple choice",
};

export function FormFieldRow({
  field,
  isFirst,
  isLast,
}: {
  field: FormField;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded-lg border bg-card p-4">
        <EditFieldForm field={field} onDone={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{field.label}</span>
            <span className="rounded bg-muted px-1.5 py-0.5 text-xs uppercase text-muted-foreground">
              {TYPE_LABELS[field.field_type]}
            </span>
            {field.is_required ? (
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
                Required
              </span>
            ) : null}
          </div>
          {field.placeholder ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Placeholder: {field.placeholder}
            </p>
          ) : null}
          {field.options.length > 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              Options: {field.options.join(", ")}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <form action={moveFieldAction}>
            <input type="hidden" name="id" value={field.id} />
            <input type="hidden" name="form_id" value={field.form_id} />
            <input type="hidden" name="direction" value="up" />
            <Button
              type="submit"
              variant="outline"
              size="icon-sm"
              aria-label="Move up"
              disabled={isFirst}
            >
              ↑
            </Button>
          </form>
          <form action={moveFieldAction}>
            <input type="hidden" name="id" value={field.id} />
            <input type="hidden" name="form_id" value={field.form_id} />
            <input type="hidden" name="direction" value="down" />
            <Button
              type="submit"
              variant="outline"
              size="icon-sm"
              aria-label="Move down"
              disabled={isLast}
            >
              ↓
            </Button>
          </form>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
          <form
            action={deleteFieldAction}
            onSubmit={(e) => {
              if (!window.confirm(`Delete "${field.label}"?`))
                e.preventDefault();
            }}
          >
            <input type="hidden" name="id" value={field.id} />
            <input type="hidden" name="form_id" value={field.form_id} />
            <Button
              type="submit"
              variant="destructive"
              size="icon-sm"
              aria-label="Delete field"
            >
              <Trash2 />
            </Button>
          </form>
        </div>
      </div>
    </li>
  );
}
