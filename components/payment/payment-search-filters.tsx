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
import { PaymentMethod, PaymentSearchParams, PaymentStatus } from '@/lib/api/payment-search';
import { Calendar, CreditCard, Filter, Hash, Search, User, X } from 'lucide-react';
import { useState } from 'react';

/**
 * Search mode type definition
 */
type SearchMode = 'all' | 'bookingId' | 'payerName' | 'dateRange' | 'status' | 'method' | 'advanced';

/**
 * Props for PaymentSearchFilters component
 */
interface PaymentSearchFiltersProps {
  onSearch: (params: PaymentSearchParams) => void;
  isLoading?: boolean;
}

/**
 * Payment Search Filters Component
 * 
 * Professional, compact search interface for payments with multiple search modes:
 * - All Payments: List all payments with pagination
 * - By Booking ID: Filter by associated booking
 * - By Payer Name: Search by payer name
 * - By Date Range: Filter by payment date
 * - By Status: Filter by payment status
 * - By Method: Filter by payment method
 * - Advanced: Combine multiple filters
 * 
 * Enterprise-grade implementation with:
 * - SOLID principles (Single Responsibility, Open/Closed, Interface Segregation)
 * - KISS approach (Keep It Simple, Stupid)
 * - Professional, compact UI/UX
 * - Type-safe with comprehensive validation
 * - Accessible with proper ARIA labels
 * - Responsive design with mobile-first approach
 */
export function PaymentSearchFilters({ onSearch, isLoading = false }: PaymentSearchFiltersProps) {
  const { t } = useLocale();

  // Search mode state
  const [searchMode, setSearchMode] = useState<SearchMode>('all');

  // Search criteria state
  const [bookingId, setBookingId] = useState('');
  const [payerName, setPayerName] = useState('');
  const [status, setStatus] = useState<PaymentStatus | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');

  // Pagination and sorting state
  const [pageSize, setPageSize] = useState('20');
  const [sortField, setSortField] = useState('paymentDate');
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
      setDateError(t('payment.search.dateRangeError'));
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
    const params: PaymentSearchParams = {
      page: 0,
      size: parseInt(pageSize, 10),
      sort: `${sortField},${sortDirection}`,
    };

    switch (searchMode) {
      case 'bookingId':
        if (bookingId) {
          params.bookingId = parseInt(bookingId, 10);
        }
        break;

      case 'payerName':
        if (payerName) {
          params.payerName = payerName;
        }
        break;

      case 'dateRange':
        if (startDate && endDate) {
          params.paymentDateFrom = formatDateForApi(startDate, false);
          params.paymentDateTo = formatDateForApi(endDate, true);
        }
        break;

      case 'status':
        if (status !== '') {
          params.status = status;
        }
        break;

      case 'method':
        if (paymentMethod !== '') {
          params.paymentMethod = paymentMethod;
        }
        break;

      case 'advanced':
        if (startDate && endDate) {
          params.paymentDateFrom = formatDateForApi(startDate, false);
          params.paymentDateTo = formatDateForApi(endDate, true);
        }
        if (status !== '') {
          params.status = status;
        }
        if (paymentMethod !== '') {
          params.paymentMethod = paymentMethod;
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
    setPayerName('');
    setStatus('');
    setPaymentMethod('');
    setStartDate('');
    setEndDate('');
    setDateError('');
    setPageSize('20');
    setSortField('paymentDate');
    setSortDirection('desc');
    onSearch({ page: 0, size: 20, sort: 'paymentDate,desc' });
  };

  /**
   * Check if search can be performed
   */
  const canSearch = (): boolean => {
    switch (searchMode) {
      case 'all':
        return true;
      case 'bookingId':
        return bookingId.trim() !== '' && /^\d+$/.test(bookingId);
      case 'payerName':
        return payerName.trim() !== '';
      case 'dateRange':
        return startDate !== '' && endDate !== '' && !dateError;
      case 'status':
        return status !== '';
      case 'method':
        return paymentMethod !== '';
      case 'advanced':
        return (startDate !== '' && endDate !== '' && !dateError) || status !== '' || paymentMethod !== '';
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
            {t('payment.search.allPayments')}
          </Button>
          <Button
            variant={searchMode === 'bookingId' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('bookingId')}
            disabled={isLoading}
            className="h-9"
          >
            <Hash className="h-4 w-4 mr-1.5" />
            {t('payment.search.byBookingId')}
          </Button>
          <Button
            variant={searchMode === 'payerName' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('payerName')}
            disabled={isLoading}
            className="h-9"
          >
            <User className="h-4 w-4 mr-1.5" />
            {t('payment.search.byPayerName')}
          </Button>
          <Button
            variant={searchMode === 'dateRange' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('dateRange')}
            disabled={isLoading}
            className="h-9"
          >
            <Calendar className="h-4 w-4 mr-1.5" />
            {t('payment.search.byDateRange')}
          </Button>
          <Button
            variant={searchMode === 'status' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('status')}
            disabled={isLoading}
            className="h-9"
          >
            {t('payment.search.byStatus')}
          </Button>
          <Button
            variant={searchMode === 'method' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('method')}
            disabled={isLoading}
            className="h-9"
          >
            <CreditCard className="h-4 w-4 mr-1.5" />
            {t('payment.search.byMethod')}
          </Button>
          <Button
            variant={searchMode === 'advanced' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('advanced')}
            disabled={isLoading}
            className="h-9"
          >
            {t('payment.search.advanced')}
          </Button>
        </div>

        {/* Search Filters - Dynamic based on mode */}
        <div className="flex flex-col gap-4">
          {/* Booking ID Search */}
          {searchMode === 'bookingId' && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="bookingId" className="text-sm font-medium">
                  {t('payment.search.bookingId')}
                </Label>
                <Input
                  id="bookingId"
                  type="text"
                  placeholder={t('payment.search.bookingIdPlaceholder')}
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value.replace(/\D/g, ''))}
                  disabled={isLoading}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  {t('payment.search.bookingIdHint')}
                </p>
              </div>
            </div>
          )}

          {/* Payer Name Search */}
          {searchMode === 'payerName' && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="payerName" className="text-sm font-medium">
                  {t('payment.search.payerName')}
                </Label>
                <Input
                  id="payerName"
                  type="text"
                  placeholder={t('payment.search.payerNamePlaceholder')}
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  disabled={isLoading}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  {t('payment.search.payerNameHint')}
                </p>
              </div>
            </div>
          )}

          {/* Date Range Search */}
          {(searchMode === 'dateRange' || searchMode === 'advanced') && (
            <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="startDate" className="text-sm font-medium">
                  {t('payment.search.startDate')}
                </Label>
                <DateTimePicker
                  value={startDate}
                  onChange={setStartDate}
                  showTimeSelect={false}
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="endDate" className="text-sm font-medium">
                  {t('payment.search.endDate')}
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
                  {t('payment.search.status')}
                </Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as PaymentStatus | '')}
                  disabled={isLoading}
                >
                  <SelectTrigger id="status" className="h-10">
                    <SelectValue placeholder={t('payment.search.selectStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">{t('payment.status.pending')}</SelectItem>
                    <SelectItem value="COMPLETED">{t('payment.status.completed')}</SelectItem>
                    <SelectItem value="FAILED">{t('payment.status.failed')}</SelectItem>
                    <SelectItem value="REFUNDED">{t('payment.status.refunded')}</SelectItem>
                  </SelectContent>
                </Select>
                {searchMode === 'advanced' && status && (
                  <button
                    type="button"
                    onClick={() => setStatus('')}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    {t('payment.search.clearStatus')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Payment Method Search */}
          {(searchMode === 'method' || searchMode === 'advanced') && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="paymentMethod" className="text-sm font-medium">
                  {t('payment.search.paymentMethod')}
                </Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value as PaymentMethod | '')}
                  disabled={isLoading}
                >
                  <SelectTrigger id="paymentMethod" className="h-10">
                    <SelectValue placeholder={t('payment.search.selectMethod')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CREDIT_CARD">
                      <div className="flex items-center gap-2">
                        <span>💳</span>
                        {t('payment.methods.creditCard')}
                      </div>
                    </SelectItem>
                    <SelectItem value="DEBIT_CARD">
                      <div className="flex items-center gap-2">
                        <span>💳</span>
                        {t('payment.methods.debitCard')}
                      </div>
                    </SelectItem>
                    <SelectItem value="BANK_TRANSFER">
                      <div className="flex items-center gap-2">
                        <span>🏦</span>
                        {t('payment.methods.bankTransfer')}
                      </div>
                    </SelectItem>
                    <SelectItem value="CASH">
                      <div className="flex items-center gap-2">
                        <span>💵</span>
                        {t('payment.methods.cash')}
                      </div>
                    </SelectItem>
                    <SelectItem value="PAYPAL">
                      <div className="flex items-center gap-2">
                        <span>🅿️</span>
                        {t('payment.methods.paypal')}
                      </div>
                    </SelectItem>
                    <SelectItem value="OTHER">
                      <div className="flex items-center gap-2">
                        <span>💰</span>
                        {t('payment.methods.other')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {searchMode === 'advanced' && paymentMethod && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('')}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    {t('payment.search.clearMethod')}
                  </button>
                )}
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
                  {t('payment.search.pageSize')}
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
                    <SelectItem value="10">10 {t('payment.search.perPage')}</SelectItem>
                    <SelectItem value="20">20 {t('payment.search.perPage')}</SelectItem>
                    <SelectItem value="50">50 {t('payment.search.perPage')}</SelectItem>
                    <SelectItem value="100">100 {t('payment.search.perPage')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Field */}
              <div className="space-y-1.5">
                <Label htmlFor="sortField" className="text-sm font-medium">
                  {t('payment.search.sortBy')}
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
                    <SelectItem value="paymentDate">{t('payment.search.sortPaymentDate')}</SelectItem>
                    <SelectItem value="createdAt">{t('payment.search.sortCreatedAt')}</SelectItem>
                    <SelectItem value="amount">{t('payment.search.sortAmount')}</SelectItem>
                    <SelectItem value="status">{t('payment.search.sortStatus')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Direction */}
              <div className="space-y-1.5">
                <Label htmlFor="sortDirection" className="text-sm font-medium">
                  {t('payment.search.sortDirection')}
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
                    <SelectItem value="asc">{t('payment.search.ascending')}</SelectItem>
                    <SelectItem value="desc">{t('payment.search.descending')}</SelectItem>
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
              {isLoading ? t('payment.search.searching') : t('payment.search.search')}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
              className="h-10 px-6"
            >
              <X className="h-4 w-4 mr-2" />
              {t('payment.search.reset')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentSearchFilters;
