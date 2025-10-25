'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { cn } from '@/lib/utils';
import { endOfMonth, endOfYear, format, isValid, startOfMonth, startOfToday, startOfYear } from 'date-fns';
import { Calendar, Clock, X } from 'lucide-react';
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
  const { t } = useLocale();
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
    const [showQuickSelect, setShowQuickSelect] = React.useState(false);
    const [showDatePicker, setShowDatePicker] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const datePickerRef = React.useRef<DatePicker>(null);

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

    // Close quick select on outside click
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setShowQuickSelect(false);
          setShowDatePicker(false);
        }
      };

      if (showQuickSelect || showDatePicker) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }
    }, [showQuickSelect, showDatePicker]);

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
      e.preventDefault();
      e.stopPropagation();
      setSelectedDate(null);
      onChange?.('');
      setShowQuickSelect(false);
      setShowDatePicker(false);
    };

    const handleQuickSelect = (date: Date, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setSelectedDate(date);
      if (isValid(date)) {
        const isoString = format(date, "yyyy-MM-dd'T'HH:mm:ss");
        onChange?.(isoString);
      }
      setShowQuickSelect(false);
      setShowDatePicker(false);
    };

    const handleInputClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Input clicked, current showQuickSelect:', showQuickSelect);
      if (!disabled) {
        // Toggle quick select instead of opening date picker
        setShowQuickSelect((prev) => {
          console.log('Setting showQuickSelect to:', !prev);
          return !prev;
        });
        setShowDatePicker(false);
      }
    };

    const handleOpenCalendar = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setShowQuickSelect(false);
      setShowDatePicker(true);
    };

    const placeholder = t('dateTimePicker.placeholder');
    const quickSelectTitle = t('dateTimePicker.quickSelectTitle');
    const openCalendarLabel = t('dateTimePicker.openCalendar');
    const quickDateOptions = React.useMemo(
      () => [
        { label: t('dateTimePicker.options.today'), date: startOfToday(), icon: '📅' },
        { label: t('dateTimePicker.options.startOfMonth'), date: startOfMonth(new Date()), icon: '📆' },
        { label: t('dateTimePicker.options.endOfMonth'), date: endOfMonth(new Date()), icon: '📆' },
        { label: t('dateTimePicker.options.startOfYear'), date: startOfYear(new Date()), icon: '🗓️' },
        { label: t('dateTimePicker.options.endOfYear'), date: endOfYear(new Date()), icon: '🗓️' },
      ],
      [t],
    );

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
      <div ref={containerRef} className="relative">
        {/* Input Button */}
        <button
          type="button"
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            !selectedDate && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
          onClick={handleInputClick}
        >
          <div className="flex items-center gap-2">
            {showTimeSelect ? (
              <Clock className="h-4 w-4" />
            ) : (
              <Calendar className="h-4 w-4" />
            )}
            <span>{formatDisplayValue() || placeholder}</span>
          </div>
          {selectedDate && (
            <X
              className="h-4 w-4 opacity-50 hover:opacity-100"
              onClick={handleClear}
            />
          )}
        </button>

        {/* Quick Select Dropdown */}
        {showQuickSelect && !disabled && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-md border bg-popover shadow-lg">
            <div className="p-2 space-y-1">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center justify-between">
                <span>{quickSelectTitle}</span>
                <button
                  type="button"
                  onClick={handleOpenCalendar}
                  className="text-primary hover:text-primary/80 hover:underline text-xs font-medium"
                >
                  📅 {openCalendarLabel}
                </button>
              </div>
              {quickDateOptions.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={(e) => handleQuickSelect(option.date, e)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                >
                  <span>{option.icon}</span>
                  <span className="flex-1">{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(option.date, 'MMM d, yyyy')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hidden DatePicker for calendar functionality */}
        {showDatePicker && (
          <DatePicker
            ref={datePickerRef}
            selected={selectedDate}
            onChange={handleDateChange}
            showTimeSelect={showTimeSelect}
            timeFormat="HH:mm"
            timeIntervals={15}
            dateFormat={showTimeSelect ? "MMMM d, yyyy h:mm aa" : "MMMM d, yyyy"}
            inline
            onClickOutside={() => setShowDatePicker(false)}
            onCalendarClose={() => {
              setShowQuickSelect(false);
              setShowDatePicker(false);
            }}
            calendarContainer={({ children }) => (
              <div className="absolute top-full left-0 mt-1 z-50 bg-popover rounded-md border shadow-lg">
                {children}
              </div>
            )}
            popperClassName="react-datepicker-popper"
            calendarClassName="react-datepicker-calendar"
          />
        )}
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
            display: flex;
            flex-direction: column;
          }
          
          /* Mobile responsive layout */
          @media (max-width: 640px) {
            .react-datepicker {
              flex-direction: column !important;
              width: 100% !important;
            }
            
            .react-datepicker__time-container {
              width: 100% !important;
              border-left: none !important;
              border-top: 1px solid hsl(var(--border));
            }
            
            .react-datepicker__time {
              width: 100% !important;
            }
            
            .react-datepicker__time-box {
              width: 100% !important;
            }
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
