import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
          error
            ? 'border-red-500 dark:border-red-600 focus-visible:ring-red-500 dark:focus-visible:ring-red-600 bg-red-50 dark:bg-red-950/20'
            : 'border-input focus-visible:ring-ring',
          className
        )}
        ref={ref}
        aria-invalid={error ? 'true' : 'false'}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea };

