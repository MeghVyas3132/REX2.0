'use client';

import React from 'react';
import './form.css';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, success, className = '', ...props }, ref) => {
    return (
      <div className="form-field">
        {label && <label className="form-label">{label}</label>}
        <input
          ref={ref}
          className={`form-input ${error ? 'error' : ''} ${success ? 'success' : ''} ${className}`.trim()}
          {...props}
        />
        {error && <div className="form-error">{error}</div>}
      </div>
    );
  },
);

Input.displayName = 'Input';

export interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  success?: boolean;
}

export const TextArea = React.forwardRef<
  HTMLTextAreaElement,
  TextAreaProps
>(({ label, error, success, className = '', ...props }, ref) => {
  return (
    <div className="form-field">
      {label && <label className="form-label">{label}</label>}
      <textarea
        ref={ref}
        className={`form-textarea ${error ? 'error' : ''} ${success ? 'success' : ''} ${className}`.trim()}
        {...props}
      />
      {error && <div className="form-error">{error}</div>}
    </div>
  );
});

TextArea.displayName = 'TextArea';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="form-field">
        {label && <label className="form-label">{label}</label>}
        <select
          ref={ref}
          className={`form-select ${error ? 'error' : ''} ${className}`.trim()}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <div className="form-error">{error}</div>}
      </div>
    );
  },
);

Select.displayName = 'Select';
