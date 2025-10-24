'use client';

import { cn } from '@/lib/utils';
import { format, isValid } from 'date-fns';
import { Calendar, X } from 'lucide-react';
import * as React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export interface DateTimePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string;
  onChange?: (value: string) => void;
  showTimeSelect?: boolean;
}

const DateTimePicker = React.forwardRef<HTMLInputElement, DateTimePickerProps>(
  ({ className, value = '', onChange, showTimeSelect = true, disabled, ..._rest }, ref) => {
    const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);

    // Parse ISO string to Date
    React.useEffect(() => {
      if (value) {
        try {
          const date = new Date(value);
          if (isValid(date)) {
            setSelectedDate(date);
          }
        } catch {
          setSelectedDate(null);
        }
      } else {
        setSelectedDate(null);
      }
    }, [value]);

    const handleDateChange = (date: Date | null) => {
      setSelectedDate(date);
      if (date && isValid(date)) {
        // Convert to ISO string format
        const isoString = format(date, "yyyy-MM-dd'T'HH:mm:ss");
        onChange?.(isoString);
      } else {
        onChange?.('');
      }
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedDate(null);
      onChange?.('');
    };

    const formatDisplayValue = (): string => {
      if (!selectedDate) return '';
      try {
        if (showTimeSelect) {
          return format(selectedDate, 'MMM d, yyyy, h:mm a');
        }
        return format(selectedDate, 'MMM d, yyyy');
      } catch {
        return '';
      }
    };

    return (
      <div className="relative">
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          showTimeSelect={showTimeSelect}
          timeFormat="HH:mm"
          timeIntervals={15}
          dateFormat={showTimeSelect ? "MMMM d, yyyy h:mm aa" : "MMMM d, yyyy"}
          disabled={disabled}
          customInput={
            <button
              type="button"
              className={cn(
                'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                !selectedDate && 'text-muted-foreground',
                className
              )}
              disabled={disabled}
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDisplayValue() || 'Select date and time'}</span>
              </div>
              {selectedDate && (
                <X
                  className="h-4 w-4 opacity-50 hover:opacity-100"
                  onClick={handleClear}
                />
              )}
            </button>
          }
          popperClassName="react-datepicker-popper"
          calendarClassName="react-datepicker-calendar"
        />
        <style jsx global>{`
          .react-datepicker-popper {
            z-index: 50 !important;
          }
          
          .react-datepicker {
            font-family: inherit;
            border: 1px solid hsl(var(--border));
            border-radius: 0.5rem;
            background-color: hsl(var(--popover));
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
          }
          
          .react-datepicker__header {
            background-color: hsl(var(--muted));
            border-bottom: 1px solid hsl(var(--border));
            border-radius: 0.5rem 0.5rem 0 0;
            padding-top: 0.5rem;
          }
          
          .react-datepicker__current-month,
          .react-datepicker__day-name {
            color: hsl(var(--foreground));
          }
          
          .react-datepicker__day {
            color: hsl(var(--foreground));
            border-radius: 0.375rem;
            transition: all 0.2s;
          }
          
          .react-datepicker__day:hover {
            background-color: hsl(var(--accent));
            color: hsl(var(--accent-foreground));
          }
          
          .react-datepicker__day--selected,
          .react-datepicker__day--keyboard-selected {
            background-color: hsl(var(--primary));
            color: hsl(var(--primary-foreground));
          }
          
          .react-datepicker__day--disabled {
            color: hsl(var(--muted-foreground));
            cursor: not-allowed;
          }
          
          .react-datepicker__time-container {
            border-left: 1px solid hsl(var(--border));
          }
          
          .react-datepicker__time-list-item {
            transition: all 0.2s;
          }
          
          .react-datepicker__time-list-item:hover {
            background-color: hsl(var(--accent)) !important;
            color: hsl(var(--accent-foreground)) !important;
          }
          
          .react-datepicker__time-list-item--selected {
            background-color: hsl(var(--primary)) !important;
            color: hsl(var(--primary-foreground)) !important;
          }
          
          .react-datepicker__navigation-icon::before {
            border-color: hsl(var(--foreground));
          }
          
          .react-datepicker__triangle {
            display: none;
          }
        `}</style>
      </div>
    );
  }
);

DateTimePicker.displayName = 'DateTimePicker';

export { DateTimePicker };
