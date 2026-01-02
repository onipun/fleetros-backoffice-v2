'use client';

import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { ReportType } from '@/types/reporting';
import { Calendar } from 'lucide-react';
import * as React from 'react';

export interface RevenueDatePickerProps {
  onDateRangeChange: (startDate: string, endDate: string, reportType: ReportType) => void;
  onGenerate?: () => void;
  disabled?: boolean;
}

export function RevenueDatePicker({
  onDateRangeChange,
  onGenerate,
  disabled = false,
}: RevenueDatePickerProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [reportType, setReportType] = React.useState<ReportType>('MONTHLY');
  const [selectedDate, setSelectedDate] = React.useState<string>('');
  const [selectedYear, setSelectedYear] = React.useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = React.useState<number>(currentMonth);

  // Generate year options (current year and past 5 years)
  const yearOptions = React.useMemo(() => {
    const years: number[] = [];
    for (let i = 0; i < 6; i++) {
      years.push(currentYear - i);
    }
    return years;
  }, [currentYear]);

  // Month options
  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  // Calculate date range based on report type
  const calculateDateRange = React.useCallback(() => {
    let startDate: string;
    let endDate: string;

    switch (reportType) {
      case 'DAILY':
        if (!selectedDate) {
          const today = new Date();
          startDate = today.toISOString().split('T')[0];
          endDate = startDate;
        } else {
          // Extract just the date part and set to start/end of day
          const date = selectedDate.split('T')[0];
          startDate = date;
          endDate = date;
        }
        break;

      case 'MONTHLY':
        // Use selected year and month
        const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
        const lastDay = new Date(selectedYear, selectedMonth, 0);
        startDate = firstDay.toISOString().split('T')[0];
        endDate = lastDay.toISOString().split('T')[0];
        break;

      case 'YEARLY':
        // Use selected year
        const yearStart = new Date(selectedYear, 0, 1);
        const yearEnd = new Date(selectedYear, 11, 31);
        startDate = yearStart.toISOString().split('T')[0];
        endDate = yearEnd.toISOString().split('T')[0];
        break;

      default:
        const today = new Date();
        startDate = today.toISOString().split('T')[0];
        endDate = startDate;
    }

    return { startDate, endDate };
  }, [reportType, selectedDate, selectedYear, selectedMonth]);

  // Update parent when report type changes
  React.useEffect(() => {
    const { startDate, endDate } = calculateDateRange();
    onDateRangeChange(startDate, endDate, reportType);
  }, [reportType, selectedDate, selectedYear, selectedMonth, calculateDateRange, onDateRangeChange]);

  const handleReportTypeChange = (value: ReportType) => {
    setReportType(value);
    // Reset selections
    if (value === 'DAILY') {
      setSelectedDate('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        {/* Report Type Selection */}
        <div className="space-y-2">
          <Label>Report Type</Label>
          <Select value={reportType} onValueChange={handleReportTypeChange} disabled={disabled}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DAILY">Daily</SelectItem>
              <SelectItem value="MONTHLY">Monthly</SelectItem>
              <SelectItem value="YEARLY">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Conditional Date Selection Based on Report Type */}
        {reportType === 'DAILY' && (
          <div className="space-y-2">
            <Label>Select Date</Label>
            <DateTimePicker
              value={selectedDate}
              onChange={setSelectedDate}
              showTimeSelect={false}
              disabled={disabled}
              placeholder="Select date"
            />
          </div>
        )}

        {(reportType === 'MONTHLY') && (
          <>
            <div className="space-y-2">
              <Label>Year</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Month</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {reportType === 'YEARLY' && (
          <div className="space-y-2">
            <Label>Year</Label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Generate Button */}
        {onGenerate && (
          <div className="flex items-end">
            <Button onClick={onGenerate} disabled={disabled} className="w-full">
              <Calendar className="h-4 w-4 mr-2" />
              Generate
            </Button>
          </div>
        )}
      </div>

      {/* Date Range Preview */}
      <div className="text-xs text-muted-foreground">
        {(() => {
          const { startDate, endDate } = calculateDateRange();
          return (
            <span>
              Report Period: <strong>{startDate}</strong> to <strong>{endDate}</strong>
            </span>
          );
        })()}
      </div>
    </div>
  );
}
