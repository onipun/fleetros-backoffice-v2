'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { BookingSearchParams, BookingStatus, PaymentStatusFilter } from '@/lib/api/booking-search';
import { Calendar, DollarSign, Filter, Hash, Search, User, X } from 'lucide-react';
import { useState } from 'react';

/**
 * Search mode type definition
 */
type SearchMode = 'all' | 'id' | 'customer' | 'dateRange' | 'status' | 'paymentStatus' | 'advanced';

/**
 * Props for BookingSearchFilters component
 */
interface BookingSearchFiltersProps {
  onSearch: (params: BookingSearchParams) => void;
  isLoading?: boolean;
}

/**
 * Booking Search Filters Component
 * 
 * Professional, compact search interface for bookings with multiple search modes:
 * - All Bookings: List all bookings with pagination
 * - By ID: Direct lookup by booking ID
 * - By Customer: Search by email or phone
 * - By Date Range: Filter by pickup/return dates
 * - By Status: Filter by booking status
 * - Advanced: Combine date range and status
 * 
 * Enterprise-grade implementation with:
 * - SOLID principles (Single Responsibility, Open/Closed, Interface Segregation)
 * - KISS approach (Keep It Simple, Stupid)
 * - Professional, compact UI/UX
 * - Type-safe with comprehensive validation
 * - Accessible with proper ARIA labels
 * - Responsive design with mobile-first approach
 */
export function BookingSearchFilters({ onSearch, isLoading = false }: BookingSearchFiltersProps) {
  const { t } = useLocale();

  // Search mode state
  const [searchMode, setSearchMode] = useState<SearchMode>('all');

  // Search criteria state
  const [bookingId, setBookingId] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [status, setStatus] = useState<BookingStatus | ''>('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusFilter | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');

  // Pagination and sorting state
  const [pageSize, setPageSize] = useState('20');
  const [sortField, setSortField] = useState('startDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  /**
   * Validate date range
   */
  const validateDateRange = (): boolean => {
    if (!startDate || !endDate) {
      setDateError('');
      return true;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) {
      setDateError(t('booking.search.dateRangeError'));
      return false;
    }

    setDateError('');
    return true;
  };

  /**
   * Format date to ISO-8601 for API with time component
   * Start date: beginning of the day (00:00:00)
   * End date: end of the day (23:59:59)
   */
  const formatDateForApi = (date: string, isEndDate: boolean = false): string => {
    if (!date) return '';
    
    // DateTimePicker returns ISO format, extract date part
    const datePart = date.split('T')[0];
    
    // Add time component
    // Start date: 00:00:00 (beginning of day)
    // End date: 23:59:59 (end of day)
    const time = isEndDate ? '23:59:59' : '00:00:00';
    
    return `${datePart}T${time}`;
  };

  /**
   * Handle search submission
   */
  const handleSearch = () => {
    // Validate dates if applicable
    if ((searchMode === 'dateRange' || searchMode === 'advanced') && !validateDateRange()) {
      return;
    }

    // Build search parameters based on mode
    const params: BookingSearchParams = {
      page: 0,
      size: parseInt(pageSize, 10),
      sort: `${sortField},${sortDirection}`,
    };

    switch (searchMode) {
      case 'id':
        if (bookingId) {
          params.bookingId = parseInt(bookingId, 10);
        }
        break;

      case 'customer':
        if (emailOrPhone) {
          params.emailOrPhone = emailOrPhone;
        }
        break;

      case 'dateRange':
        if (startDate && endDate) {
          params.startDate = formatDateForApi(startDate, false);
          params.endDate = formatDateForApi(endDate, true);
        }
        break;

      case 'status':
        if (status !== '') {
          params.status = status;
        }
        break;

      case 'paymentStatus':
        if (paymentStatus !== '') {
          params.paymentStatus = paymentStatus;
        }
        break;

      case 'advanced':
        if (startDate && endDate) {
          params.startDate = formatDateForApi(startDate, false);
          params.endDate = formatDateForApi(endDate, true);
        }
        if (status !== '') {
          params.status = status;
        }
        break;

      case 'all':
      default:
        // No additional params needed
        break;
    }

    onSearch(params);
  };

  /**
   * Reset all filters
   */
  const handleReset = () => {
    setSearchMode('all');
    setBookingId('');
    setEmailOrPhone('');
    setStatus('');
    setPaymentStatus('');
    setStartDate('');
    setEndDate('');
    setDateError('');
    setPageSize('20');
    setSortField('startDate');
    setSortDirection('desc');
    onSearch({ page: 0, size: 20, sort: 'startDate,desc' });
  };

  /**
   * Check if search can be performed
   */
  const canSearch = (): boolean => {
    switch (searchMode) {
      case 'all':
        return true;
      case 'id':
        return bookingId.trim() !== '' && /^\d+$/.test(bookingId);
      case 'customer':
        return emailOrPhone.trim() !== '';
      case 'dateRange':
        return startDate !== '' && endDate !== '' && !dateError;
      case 'status':
        return status !== '';
      case 'paymentStatus':
        return paymentStatus !== '';
      case 'advanced':
        return (startDate !== '' && endDate !== '' && !dateError) || status !== '';
      default:
        return false;
    }
  };

  /**
   * Handle mode change
   */
  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
    setDateError('');
  };

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex flex-col gap-4">
        {/* Mode Selection - Compact Button Group */}
        <div className="flex flex-wrap gap-2 pb-3 border-b">
          <Button
            variant={searchMode === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('all')}
            disabled={isLoading}
            className="h-9"
          >
            <Filter className="h-4 w-4 mr-1.5" />
            {t('booking.search.allBookings')}
          </Button>
          <Button
            variant={searchMode === 'id' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('id')}
            disabled={isLoading}
            className="h-9"
          >
            <Hash className="h-4 w-4 mr-1.5" />
            {t('booking.search.byId')}
          </Button>
          <Button
            variant={searchMode === 'customer' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('customer')}
            disabled={isLoading}
            className="h-9"
          >
            <User className="h-4 w-4 mr-1.5" />
            {t('booking.search.byCustomer')}
          </Button>
          <Button
            variant={searchMode === 'dateRange' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('dateRange')}
            disabled={isLoading}
            className="h-9"
          >
            <Calendar className="h-4 w-4 mr-1.5" />
            {t('booking.search.byDateRange')}
          </Button>
          <Button
            variant={searchMode === 'status' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('status')}
            disabled={isLoading}
            className="h-9"
          >
            {t('booking.search.byStatus')}
          </Button>
          <Button
            variant={searchMode === 'paymentStatus' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('paymentStatus')}
            disabled={isLoading}
            className="h-9"
          >
            <DollarSign className="h-4 w-4 mr-1.5" />
            {t('booking.search.byPayment')}
          </Button>
          <Button
            variant={searchMode === 'advanced' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('advanced')}
            disabled={isLoading}
            className="h-9"
          >
            {t('booking.search.advanced')}
          </Button>
        </div>

        {/* Search Filters - Dynamic based on mode */}
        <div className="flex flex-col gap-4">
          {/* Booking ID Search */}
          {searchMode === 'id' && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="bookingId" className="text-sm font-medium">
                  {t('booking.search.bookingId')}
                </Label>
                <Input
                  id="bookingId"
                  type="text"
                  placeholder={t('booking.search.bookingIdPlaceholder')}
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value.replace(/\D/g, ''))}
                  disabled={isLoading}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  {t('booking.search.bookingIdHint')}
                </p>
              </div>
            </div>
          )}

          {/* Customer Search */}
          {searchMode === 'customer' && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="emailOrPhone" className="text-sm font-medium">
                  {t('booking.search.emailOrPhone')}
                </Label>
                <Input
                  id="emailOrPhone"
                  type="text"
                  placeholder={t('booking.search.emailOrPhonePlaceholder')}
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  disabled={isLoading}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  {t('booking.search.emailOrPhoneHint')}
                </p>
              </div>
            </div>
          )}

          {/* Date Range Search */}
          {(searchMode === 'dateRange' || searchMode === 'advanced') && (
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="startDate" className="text-sm font-medium">
                  {t('booking.search.startDate')}
                </Label>
                <DateTimePicker
                  value={startDate}
                  onChange={setStartDate}
                  showTimeSelect={false}
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="endDate" className="text-sm font-medium">
                  {t('booking.search.endDate')}
                </Label>
                <DateTimePicker
                  value={endDate}
                  onChange={setEndDate}
                  showTimeSelect={false}
                />
              </div>
            </div>
          )}

          {/* Status Search */}
          {(searchMode === 'status' || searchMode === 'advanced') && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="status" className="text-sm font-medium">
                  {t('booking.search.status')}
                </Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as BookingStatus | '')}
                  disabled={isLoading}
                >
                  <SelectTrigger id="status" className="h-10">
                    <SelectValue placeholder={t('booking.search.selectStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">{t('booking.status.pending')}</SelectItem>
                    <SelectItem value="CONFIRMED">{t('booking.status.confirmed')}</SelectItem>
                    <SelectItem value="IN_PROGRESS">{t('booking.status.inProgress')}</SelectItem>
                    <SelectItem value="COMPLETED">{t('booking.status.completed')}</SelectItem>
                    <SelectItem value="CANCELLED">{t('booking.status.cancelled')}</SelectItem>
                    <SelectItem value="NO_SHOW">{t('booking.status.noShow')}</SelectItem>
                  </SelectContent>
                </Select>
                {searchMode === 'advanced' && status && (
                  <button
                    type="button"
                    onClick={() => setStatus('')}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    {t('booking.search.clearStatus')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Payment Status Search */}
          {searchMode === 'paymentStatus' && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="paymentStatus" className="text-sm font-medium">
                  {t('booking.search.paymentStatus')}
                </Label>
                <Select
                  value={paymentStatus}
                  onValueChange={(value) => setPaymentStatus(value as PaymentStatusFilter | '')}
                  disabled={isLoading}
                >
                  <SelectTrigger id="paymentStatus" className="h-10">
                    <SelectValue placeholder={t('booking.search.selectPaymentStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COMPLETE">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        {t('booking.search.paymentComplete')}
                      </div>
                    </SelectItem>
                    <SelectItem value="PENDING">
                      <div className="flex items-center gap-2">
                        <span className="text-orange-600">○</span>
                        {t('booking.search.paymentPending')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t('booking.search.paymentStatusHint')}
                </p>
              </div>
            </div>
          )}

          {/* Date Error */}
          {dateError && (
            <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {dateError}
            </div>
          )}

          {/* Pagination and Sort Controls */}
          <div className="border-t pt-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Page Size */}
              <div className="space-y-1.5">
                <Label htmlFor="pageSize" className="text-sm font-medium">
                  {t('booking.search.pageSize')}
                </Label>
                <Select
                  value={pageSize}
                  onValueChange={setPageSize}
                  disabled={isLoading}
                >
                  <SelectTrigger id="pageSize" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 {t('booking.search.perPage')}</SelectItem>
                    <SelectItem value="20">20 {t('booking.search.perPage')}</SelectItem>
                    <SelectItem value="50">50 {t('booking.search.perPage')}</SelectItem>
                    <SelectItem value="100">100 {t('booking.search.perPage')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Field */}
              <div className="space-y-1.5">
                <Label htmlFor="sortField" className="text-sm font-medium">
                  {t('booking.search.sortBy')}
                </Label>
                <Select
                  value={sortField}
                  onValueChange={setSortField}
                  disabled={isLoading}
                >
                  <SelectTrigger id="sortField" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startDate">{t('booking.search.sortStartDate')}</SelectItem>
                    <SelectItem value="endDate">{t('booking.search.sortEndDate')}</SelectItem>
                    <SelectItem value="createdAt">{t('booking.search.sortCreatedAt')}</SelectItem>
                    <SelectItem value="totalAmount">{t('booking.search.sortTotalAmount')}</SelectItem>
                    <SelectItem value="status">{t('booking.search.sortStatus')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Direction */}
              <div className="space-y-1.5">
                <Label htmlFor="sortDirection" className="text-sm font-medium">
                  {t('booking.search.sortDirection')}
                </Label>
                <Select
                  value={sortDirection}
                  onValueChange={(value) => setSortDirection(value as 'asc' | 'desc')}
                  disabled={isLoading}
                >
                  <SelectTrigger id="sortDirection" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">{t('booking.search.ascending')}</SelectItem>
                    <SelectItem value="desc">{t('booking.search.descending')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSearch}
              disabled={!canSearch() || isLoading}
              className="h-10 px-6"
            >
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? t('booking.search.searching') : t('booking.search.search')}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
              className="h-10 px-6"
            >
              <X className="h-4 w-4 mr-2" />
              {t('booking.search.reset')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookingSearchFilters;
