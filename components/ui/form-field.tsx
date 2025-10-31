import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';
import * as React from 'react';
import { Label } from './label';

interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  error,
  hint,
  required,
  htmlFor,
  icon,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label
          htmlFor={htmlFor}
          className={cn(
            'flex items-center gap-2',
            error && 'text-red-700 dark:text-red-400'
          )}
        >
          {icon}
          {label}
          {required && (
            <span className="text-red-500 dark:text-red-400" aria-label="required">
              *
            </span>
          )}
        </Label>
      )}
      {children}
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 animate-in slide-in-from-top-1 duration-200">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
