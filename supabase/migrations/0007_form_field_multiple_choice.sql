-- 0007_form_field_multiple_choice.sql
-- Adds 'multiple_choice' (Google-Forms-style single-select) to the
-- form_fields.field_type check constraint.
--
-- Safe to re-run.

do $$
begin
  alter table public.form_fields
    drop constraint if exists form_fields_field_type_check;
exception when others then null;
end $$;

alter table public.form_fields
  add constraint form_fields_field_type_check
  check (field_type in (
    'text','textarea','select','radio','checkbox',
    'number','email','multiple_choice'
  ));
