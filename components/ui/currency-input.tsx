'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import * as React from 'react';

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number;
  onChange?: (value: number) => void;
  currency?: string;
  locale?: string;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value = 0, onChange, currency = 'MYR', locale = 'en-US', ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('');
    const [isFocused, setIsFocused] = React.useState(false);

    // Format number to currency string with thousands separator
    const formatCurrency = (num: number): string => {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
    };

    // Parse currency string to number
    const parseCurrency = (str: string): number => {
      // Remove all non-digit characters except decimal point
      const cleaned = str.replace(/[^\d.]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    };

    // Format as you type - add thousands separator while maintaining cursor position
    const formatAsYouType = (input: string): string => {
      // Remove all non-digit and non-decimal characters
      const cleaned = input.replace(/[^\d.]/g, '');
      
      // Handle multiple decimal points - keep only the first one
      const parts = cleaned.split('.');
      let integerPart = parts[0] || '';
      const decimalPart = parts[1] !== undefined ? parts[1].slice(0, 2) : undefined;
      
      // Add thousands separator to integer part
      if (integerPart) {
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      }
      
      // Combine back
      if (decimalPart !== undefined) {
        return `${integerPart}.${decimalPart}`;
      }
      
      // If user typed a decimal point, show it
      if (parts.length > 1) {
        return `${integerPart}.`;
      }
      
      return integerPart || '0';
    };

    // Update display value when value prop changes (only when not focused)
    React.useEffect(() => {
      if (!isFocused && value !== undefined) {
        setDisplayValue(formatCurrency(value));
      }
    }, [value, locale, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      
      // Allow empty input
      if (input === '') {
        setDisplayValue('0');
        onChange?.(0);
        return;
      }
      
      // Format as user types
      const formatted = formatAsYouType(input);
      setDisplayValue(formatted);
      
      // Parse and send the numeric value to parent
      const numericValue = parseCurrency(formatted);
      onChange?.(numericValue);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Select all text on focus for easy editing
      setTimeout(() => e.target.select(), 0);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      // Format with full decimal places on blur
      const numericValue = parseCurrency(displayValue);
      setDisplayValue(formatCurrency(numericValue));
      props.onBlur?.(e);
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
          {currency}
        </span>
        <Input
          type="text"
          inputMode="decimal"
          className={cn('pl-16 font-mono', className)}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };
