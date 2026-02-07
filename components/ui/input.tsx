import * as React from "react"
import { cn } from "@/lib/utils"

/* ─── Base shadcn Input (used by sidebar internals) ─── */
function RawInput({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

/* ─── Labeled Input (used by app pages) ─── */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

function Input({ label, helperText, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-foreground/80">
          {label}
          {props.required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}
      <input
        className={cn(
          'w-full px-4 py-2.5 border border-border rounded-xl bg-background text-foreground text-sm transition-all duration-200 placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring',
          error && 'border-destructive focus:ring-destructive/30 focus:border-destructive',
          className
        )}
        {...props}
      />
      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

/* ─── Textarea ─── */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

function Textarea({ label, helperText, error, className, ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-foreground/80">
          {label}
          {props.required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}
      <textarea
        className={cn(
          'w-full px-4 py-2.5 border border-border rounded-xl bg-background text-foreground text-sm transition-all duration-200 placeholder:text-muted-foreground resize-y',
          'focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring',
          error && 'border-destructive focus:ring-destructive/30 focus:border-destructive',
          className
        )}
        {...props}
      />
      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

/* ─── Select ─── */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  helperText?: string;
  error?: string;
}

function Select({ label, options, helperText, error, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-foreground/80">
          {label}
          {props.required && <span className="text-destructive ml-0.5">*</span>}
        </label>
      )}
      <select
        className={cn(
          'w-full px-4 py-2.5 border border-border rounded-xl bg-background text-foreground text-sm transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring',
          error && 'border-destructive focus:ring-destructive/30 focus:border-destructive',
          className
        )}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

// Export RawInput as "Input" for shadcn sidebar compatibility AND
// the labeled Input for app pages. The sidebar imports { Input } but
// only uses it as a base input. Pages also import { Input } but use label prop.
// Since our Input component works both ways (with and without label), we export it.
export { Input, Textarea, Select, RawInput }
