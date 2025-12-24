'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { cn } from '@/lib/utils';
import { endOfMonth, endOfYear, format, isValid, parse, startOfMonth, startOfToday, startOfYear } from 'date-fns';
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
  const [tempDate, setTempDate] = React.useState<Date | null>(null);
  const [manualInput, setManualInput] = React.useState('');
  const [inputError, setInputError] = React.useState(false);
    const [showQuickSelect, setShowQuickSelect] = React.useState(false);
    const [showDatePicker, setShowDatePicker] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const datePickerRef = React.useRef<DatePicker>(null);
    const manualInputRef = React.useRef<HTMLInputElement>(null);

    // Parse ISO string to Date
    React.useEffect(() => {
      if (value) {
        try {
          const date = new Date(value);
          if (isValid(date)) {
            setSelectedDate(date);
            setTempDate(date);
          }
        } catch {
          setSelectedDate(null);
          setTempDate(null);
        }
      } else {
        setSelectedDate(null);
        setTempDate(null);
      }
    }, [value]);

    // Update manual input when tempDate changes
    React.useEffect(() => {
      if (tempDate && isValid(tempDate)) {
        const formatStr = showTimeSelect ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd';
        setManualInput(format(tempDate, formatStr));
        setInputError(false);
      } else if (!tempDate) {
        setManualInput('');
        setInputError(false);
      }
    }, [tempDate, showTimeSelect]);

    // Focus input when date picker opens
    React.useEffect(() => {
      if (showDatePicker && manualInputRef.current) {
        setTimeout(() => {
          manualInputRef.current?.focus();
          manualInputRef.current?.select();
        }, 100);
      }
    }, [showDatePicker]);

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
      // Only update temp date, not the actual value
      setTempDate(date);
    };

    const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setManualInput(inputValue);
      
      // Try to parse the input
      const formatStr = showTimeSelect ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd';
      const parsedDate = parse(inputValue, formatStr, new Date());
      
      if (isValid(parsedDate) && inputValue.length >= (showTimeSelect ? 16 : 10)) {
        setTempDate(parsedDate);
        setInputError(false);
      } else if (inputValue.length >= (showTimeSelect ? 16 : 10)) {
        setInputError(true);
      } else {
        setInputError(false);
      }
    };

    const handleManualInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (tempDate && isValid(tempDate) && !inputError) {
          handleOkClick(e as unknown as React.MouseEvent);
        }
      }
    };

    const handleOkClick = (e: React.MouseEvent | React.KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (tempDate && isValid(tempDate)) {
        setSelectedDate(tempDate);
        const isoString = format(tempDate, "yyyy-MM-dd'T'HH:mm:ss");
        onChange?.(isoString);
      }
      
      setShowDatePicker(false);
      setShowQuickSelect(false);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setSelectedDate(null);
      setTempDate(null);
      onChange?.('');
      setShowQuickSelect(false);
      setShowDatePicker(false);
    };

    const handleQuickSelect = (date: Date, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setSelectedDate(date);
      setTempDate(date);
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
          <div className="absolute top-full left-0 mt-1 z-50 bg-popover rounded-lg shadow-lg overflow-hidden border border-border">
            {/* Manual Input Field */}
            <div className="px-3 pt-3 pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <input
                  ref={manualInputRef}
                  type="text"
                  value={manualInput}
                  onChange={handleManualInputChange}
                  onKeyDown={handleManualInputKeyDown}
                  placeholder={showTimeSelect ? 'YYYY-MM-DD HH:MM' : 'YYYY-MM-DD'}
                  className={cn(
                    'flex-1 h-8 px-2 text-sm rounded border bg-background focus:outline-none focus:ring-1 focus:ring-ring font-mono',
                    inputError ? 'border-destructive focus:ring-destructive' : 'border-input'
                  )}
                />
              </div>
              {inputError && (
                <p className="text-xs text-destructive mt-1 ml-6">
                  {showTimeSelect ? 'Format: YYYY-MM-DD HH:MM' : 'Format: YYYY-MM-DD'}
                </p>
              )}
            </div>
            <DatePicker
              ref={datePickerRef}
              selected={tempDate}
              onChange={handleDateChange}
              showTimeSelect={showTimeSelect}
              timeFormat="HH:mm"
              timeIntervals={15}
              dateFormat={showTimeSelect ? "MMMM d, yyyy h:mm aa" : "MMMM d, yyyy"}
              inline
              calendarClassName="react-datepicker-calendar"
            />
            {/* Action Buttons */}
            <div className="px-3 py-3 bg-muted/30 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDatePicker(false);
                  setTempDate(selectedDate);
                }}
                className="px-4 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOkClick}
                className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
              >
                OK
              </button>
            </div>
          </div>
        )}
        <style jsx global>{`
          .react-datepicker-popper {
            z-index: 50 !important;
          }
          
          .react-datepicker {
            font-family: inherit;
            border: none !important;
            border-radius: 0;
            background-color: hsl(var(--popover));
            box-shadow: none;
            display: flex;
            flex-direction: row;
          }
          
          .react-datepicker__time-container {
            border-left: 1px solid hsl(var(--border));
            width: auto;
          }
          
          .react-datepicker__time {
            background: hsl(var(--popover));
            border-radius: 0;
          }
          
          .react-datepicker__time-box {
            width: 100%;
          }
          
          .react-datepicker__time-list {
            height: 204px !important;
            overflow-y: auto !important;
            padding: 0;
          }
          
          /* Custom scrollbar for time list */
          .react-datepicker__time-list::-webkit-scrollbar {
            width: 8px;
          }
          
          .react-datepicker__time-list::-webkit-scrollbar-track {
            background: hsl(var(--muted));
          }
          
          .react-datepicker__time-list::-webkit-scrollbar-thumb {
            background: hsl(var(--muted-foreground) / 0.3);
            border-radius: 4px;
          }
          
          .react-datepicker__time-list::-webkit-scrollbar-thumb:hover {
            background: hsl(var(--muted-foreground) / 0.5);
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
            background-color: hsl(var(--muted) / 0.5);
            border-bottom: none;
            border-radius: 0;
            padding-top: 0.75rem;
            padding-bottom: 0.5rem;
          }
          
          .react-datepicker__current-month {
            color: hsl(var(--foreground));
            font-weight: 600;
            font-size: 0.95rem;
            margin-bottom: 0.5rem;
          }
          
          .react-datepicker__day-names {
            margin-top: 0.5rem;
          }
          
          .react-datepicker__day-name {
            color: hsl(var(--muted-foreground));
            font-size: 0.75rem;
            font-weight: 600;
            width: 2rem;
            line-height: 2rem;
          }
          
          .react-datepicker__month {
            margin: 0.5rem;
          }
          
          .react-datepicker__day {
            color: hsl(var(--foreground));
            border-radius: 0.375rem;
            transition: all 0.2s;
            width: 2rem;
            line-height: 2rem;
            margin: 0.15rem;
            font-size: 0.875rem;
          }
          
          .react-datepicker__day:hover {
            background-color: hsl(var(--accent));
            color: hsl(var(--accent-foreground));
          }
          
          .react-datepicker__day--selected,
          .react-datepicker__day--keyboard-selected {
            background-color: hsl(var(--primary)) !important;
            color: hsl(var(--primary-foreground)) !important;
            font-weight: 600;
          }
          
          .react-datepicker__day--today {
            font-weight: 600;
            color: hsl(var(--primary));
          }
          
          .react-datepicker__day--disabled {
            color: hsl(var(--muted-foreground)) !important;
            cursor: not-allowed;
            opacity: 0.5;
          }
          
          .react-datepicker__day--outside-month {
            color: hsl(var(--muted-foreground));
            opacity: 0.4;
          }
          
          .react-datepicker__time-container {
            border-left: 1px solid hsl(var(--border));
          }
          
          .react-datepicker__time-list-item {
            transition: all 0.15s;
            height: auto !important;
            padding: 0.5rem 0.75rem !important;
            font-size: 0.875rem;
          }
          
          .react-datepicker__time-list-item:hover {
            background-color: hsl(var(--accent)) !important;
            color: hsl(var(--accent-foreground)) !important;
          }
          
          .react-datepicker__time-list-item--selected {
            background-color: hsl(var(--primary)) !important;
            color: hsl(var(--primary-foreground)) !important;
            font-weight: 600 !important;
          }
          
          .react-datepicker__navigation {
            top: 0.75rem;
            width: 2rem;
            height: 2rem;
            border-radius: 0.375rem;
            transition: all 0.2s;
          }
          
          .react-datepicker__navigation:hover {
            background-color: hsl(var(--accent));
          }
          
          .react-datepicker__navigation-icon::before {
            border-color: hsl(var(--foreground));
            border-width: 2px 2px 0 0;
            width: 7px;
            height: 7px;
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
