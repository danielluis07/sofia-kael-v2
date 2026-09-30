"use client";

import { useId, useRef, useState } from "react";
import { CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ContactFormContent } from "@/content/site";

type FieldName = "name" | "email" | "phone" | "reason";
type ContactControl = HTMLInputElement | HTMLTextAreaElement;

export function ContactForm({ copy }: { copy: ContactFormContent }) {
  const id = useId();
  const attempted = useRef(false);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  function errorFor(control: ContactControl) {
    const { valueMissing, typeMismatch, patternMismatch } = control.validity;
    if (valueMissing) {
      if (control.name === "name") return copy.errors.nameRequired;
      if (control.name === "email") return copy.errors.emailRequired;
      if (control.name === "reason") return copy.errors.reasonRequired;
    }
    if (typeMismatch) return copy.errors.emailInvalid;
    if (patternMismatch) return copy.errors.phoneInvalid;
    return undefined;
  }

  function errorProps(name: FieldName) {
    return {
      id: `${id}-${name}`,
      "aria-invalid": errors[name] ? true : undefined,
      "aria-describedby": errors[name] ? `${id}-${name}-error` : undefined,
    };
  }

  function errorMessage(name: FieldName) {
    return errors[name] ? (
      <FieldError id={`${id}-${name}-error`}>
        <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} />
        <span>{errors[name]}</span>
      </FieldError>
    ) : null;
  }

  if (submitted) {
    return (
      <div role="status" tabIndex={-1} ref={(panel) => { panel?.focus(); }} className="flex flex-col gap-6 border border-rule bg-surface p-8">
        <h3 className="font-serif text-display-m">{copy.success.title}</h3>
        <p className="max-w-prose text-body text-ink-soft">{copy.success.body}</p>
      </div>
    );
  }

  return (
    <form
      noValidate
      // A client action renders an inert no-JS action. Never send or store values.
      action={() => { setSubmitted(true); }}
      onSubmit={(event) => {
        attempted.current = true;
        const nextErrors: Partial<Record<FieldName, string>> = {};
        let firstInvalid: ContactControl | undefined;
        for (const element of Array.from(event.currentTarget.elements)) {
          if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) continue;
          const error = errorFor(element);
          if (error) {
            nextErrors[element.name as FieldName] = error;
            firstInvalid ??= element;
          }
        }
        setErrors(nextErrors);
        if (firstInvalid) {
          event.preventDefault();
          firstInvalid.focus();
        }
      }}
      onChange={(event) => {
        if (!attempted.current) return;
        const control = event.target;
        if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) || control.type === "radio") return;
        setErrors((previous) => ({ ...previous, [control.name]: errorFor(control) }));
      }}
    >
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor={`${id}-name`}>{copy.labels.name}</FieldLabel>
          <Input name="name" required autoComplete="name" maxLength={100} {...errorProps("name")} />
          {errorMessage("name")}
        </Field>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor={`${id}-email`}>{copy.labels.email}</FieldLabel>
          <Input name="email" type="email" required autoComplete="email" maxLength={254} {...errorProps("email")} />
          {errorMessage("email")}
        </Field>
        <Field data-invalid={!!errors.phone}>
          <FieldLabel htmlFor={`${id}-phone`}>{copy.labels.phone}</FieldLabel>
          <Input name="phone" type="tel" autoComplete="tel" maxLength={30} pattern={String.raw`(?=(?:\D*[0-9]){7,15}\D*$)\+?[0-9\s\(\)\.\-]+`} {...errorProps("phone")} />
          {errorMessage("phone")}
        </Field>
        <Field data-invalid={!!errors.reason}>
          <FieldLabel htmlFor={`${id}-reason`}>{copy.labels.reason}</FieldLabel>
          <Textarea name="reason" required maxLength={2000} rows={3} {...errorProps("reason")} />
          {errorMessage("reason")}
        </Field>
        <FieldSet>
          <FieldLegend>{copy.labels.preferredTime}</FieldLegend>
          <FieldGroup className="flex-wrap gap-x-6 gap-y-2 sm:flex-row">
            {Object.entries(copy.preferredTimes).map(([value, label]) => (
              <FieldLabel key={value} variant="choice" className="min-h-11">
                <input type="radio" name="preferredTime" value={value} defaultChecked={value === "noPreference"} className="size-4 shrink-0 accent-oxblood" />
                {label}
              </FieldLabel>
            ))}
          </FieldGroup>
        </FieldSet>
        <Button type="submit" className="self-start">{copy.submit}</Button>
      </FieldGroup>
    </form>
  );
}
