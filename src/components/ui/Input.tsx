import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix"> {
  label?: string;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, prefix, suffix, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-xs font-medium text-eg-text-sub">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="pointer-events-none absolute start-3 text-eg-muted">{prefix}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-sm border border-eg-border bg-[#131c25] px-3 py-2 text-[13px] text-eg-text placeholder:text-eg-muted focus:border-eg-blue/70 focus:outline-none",
              prefix && "ps-9",
              suffix && "pe-9",
              error && "border-[#c9454f]",
              className
            )}
            {...props}
          />
          {suffix && <span className="absolute end-3 text-eg-text-sub">{suffix}</span>}
        </div>
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-xs font-medium text-eg-text-sub">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "w-full resize-none rounded-sm border border-eg-border bg-[#131c25] px-3 py-2 text-[13px] text-eg-text placeholder:text-eg-muted focus:border-eg-blue/70 focus:outline-none",
            error && "border-[#c9454f]",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
