import React, { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="form-row">
      {label && <label className="form-label">{label}</label>}
      <textarea
        className={cn("textarea", error ? "input-error" : undefined, className)}
        {...props}
      />
      {error && <span className="error-text">{error}</span>}
    </div>
  );
}
