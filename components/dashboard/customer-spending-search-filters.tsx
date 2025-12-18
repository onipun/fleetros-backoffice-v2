'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CustomerSpendingSearchParams } from '@/lib/api/customer-spending-search';
import {
    Activity,
    DollarSign,
    Filter,
    Hash,
    Mail,
    Search,
    TrendingUp,
    User,
    X
} from 'lucide-react';
import { useState } from 'react';

/**
 * Search mode type definition
 */
type SearchMode = 
  | 'all' 
  | 'customerId' 
  | 'email' 
  | 'nameOrEmail' 
  | 'minSpend' 
  | 'pendingBalance' 
  | 'activeBookings' 
  | 'topSpenders';

/**
 * Props for CustomerSpendingSearchFilters component
 */
interface CustomerSpendingSearchFiltersProps {
  onSearch: (params: CustomerSpendingSearchParams) => void;
  isLoading?: boolean;
}

/**
 * Customer Spending Search Filters Component
 * 
 * Professional, compact search interface for customer spending summaries with multiple search modes:
 * - All Customers: List all customer spending summaries with pagination
 * - By Customer ID: Direct lookup by customer ID
 * - By Email: Search by customer email
 * - By Name/Email: Search by partial name or email match
 * - By Min Spend: Filter by minimum total spend amount
 * - Pending Balance: Show customers with outstanding payments
 * - Active Bookings: Show customers with active bookings
 * - Top Spenders: Show highest spending customers
 * 
 * Enterprise-grade implementation with:
 * - SOLID principles (Single Responsibility, Open/Closed, Interface Segregation)
 * - KISS approach (Keep It Simple, Stupid)
 * - Professional, compact UI/UX matching booking search filters
 * - Type-safe with comprehensive validation
 * - Accessible with proper ARIA labels
 * - Responsive design with mobile-first approach
 */
export function CustomerSpendingSearchFilters({ onSearch, isLoading = false }: CustomerSpendingSearchFiltersProps) {
  const { t } = useLocale();

  // Search mode state
  const [searchMode, setSearchMode] = useState<SearchMode>('all');

  // Search criteria state
  const [customerId, setCustomerId] = useState('');
  const [email, setEmail] = useState('');
  const [nameOrEmail, setNameOrEmail] = useState('');
  const [minSpend, setMinSpend] = useState('');

  // Pagination and sorting state
  const [pageSize, setPageSize] = useState('20');
  const [sortField, setSortField] = useState('totalSpendLifetime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  /**
   * Handle search submission
   */
  const handleSearch = () => {
    // Build search parameters based on mode
    const params: CustomerSpendingSearchParams = {
      page: 0,
      size: parseInt(pageSize, 10),
      sort: `${sortField},${sortDirection}`,
    };

    switch (searchMode) {
      case 'customerId':
        if (customerId) {
          params.customerId = parseInt(customerId, 10);
        }
        break;

      case 'email':
        if (email) {
          params.email = email;
        }
        break;

      case 'nameOrEmail':
        if (nameOrEmail) {
          params.nameOrEmail = nameOrEmail;
        }
        break;

      case 'minSpend':
        if (minSpend) {
          params.minSpend = parseFloat(minSpend);
        }
        break;

      case 'pendingBalance':
        params.pendingBalance = true;
        break;

      case 'activeBookings':
        params.activeBookings = true;
        break;

      case 'topSpenders':
        params.topSpenders = true;
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
    setCustomerId('');
    setEmail('');
    setNameOrEmail('');
    setMinSpend('');
    setPageSize('20');
    setSortField('totalSpendLifetime');
    setSortDirection('desc');
    onSearch({ page: 0, size: 20, sort: 'totalSpendLifetime,desc' });
  };

  /**
   * Check if search can be performed
   */
  const canSearch = (): boolean => {
    switch (searchMode) {
      case 'all':
      case 'pendingBalance':
      case 'activeBookings':
      case 'topSpenders':
        return true;
      case 'customerId':
        return customerId.trim() !== '' && /^\d+$/.test(customerId);
      case 'email':
        return email.trim() !== '';
      case 'nameOrEmail':
        return nameOrEmail.trim() !== '';
      case 'minSpend':
        return minSpend.trim() !== '' && !isNaN(parseFloat(minSpend)) && parseFloat(minSpend) >= 0;
      default:
        return false;
    }
  };

  /**
   * Handle mode change
   */
  const handleModeChange = (mode: SearchMode) => {
    setSearchMode(mode);
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
            {t('customerSpending.search.allCustomers') || 'All Customers'}
          </Button>
          <Button
            variant={searchMode === 'customerId' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('customerId')}
            disabled={isLoading}
            className="h-9"
          >
            <Hash className="h-4 w-4 mr-1.5" />
            {t('customerSpending.search.byId') || 'By ID'}
          </Button>
          <Button
            variant={searchMode === 'email' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('email')}
            disabled={isLoading}
            className="h-9"
          >
            <Mail className="h-4 w-4 mr-1.5" />
            {t('customerSpending.search.byEmail') || 'By Email'}
          </Button>
          <Button
            variant={searchMode === 'nameOrEmail' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('nameOrEmail')}
            disabled={isLoading}
            className="h-9"
          >
            <User className="h-4 w-4 mr-1.5" />
            {t('customerSpending.search.byNameOrEmail') || 'By Name/Email'}
          </Button>
          <Button
            variant={searchMode === 'minSpend' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('minSpend')}
            disabled={isLoading}
            className="h-9"
          >
            <DollarSign className="h-4 w-4 mr-1.5" />
            {t('customerSpending.search.byMinSpend') || 'Min Spend'}
          </Button>
          <Button
            variant={searchMode === 'pendingBalance' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('pendingBalance')}
            disabled={isLoading}
            className="h-9"
          >
            {t('customerSpending.search.pendingBalance') || 'Pending Balance'}
          </Button>
          <Button
            variant={searchMode === 'activeBookings' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('activeBookings')}
            disabled={isLoading}
            className="h-9"
          >
            <Activity className="h-4 w-4 mr-1.5" />
            {t('customerSpending.search.activeBookings') || 'Active Bookings'}
          </Button>
          <Button
            variant={searchMode === 'topSpenders' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleModeChange('topSpenders')}
            disabled={isLoading}
            className="h-9"
          >
            <TrendingUp className="h-4 w-4 mr-1.5" />
            {t('customerSpending.search.topSpenders') || 'Top Spenders'}
          </Button>
        </div>

        {/* Search Inputs */}
        <div className="space-y-4">
          {/* Customer ID Search */}
          {searchMode === 'customerId' && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="customerId" className="text-sm font-medium">
                  {t('customerSpending.search.customerId') || 'Customer ID'}
                </Label>
                <Input
                  id="customerId"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder={t('customerSpending.search.customerIdPlaceholder') || 'Enter customer ID'}
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value.replace(/\D/g, ''))}
                  disabled={isLoading}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  {t('customerSpending.search.customerIdHint') || 'Search for a specific customer by their ID'}
                </p>
              </div>
            </div>
          )}

          {/* Email Search */}
          {searchMode === 'email' && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t('customerSpending.search.email') || 'Customer Email'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('customerSpending.search.emailPlaceholder') || 'customer@example.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  {t('customerSpending.search.emailHint') || 'Enter customer email address (exact match)'}
                </p>
              </div>
            </div>
          )}

          {/* Name or Email Search */}
          {searchMode === 'nameOrEmail' && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="nameOrEmail" className="text-sm font-medium">
                  {t('customerSpending.search.nameOrEmail') || 'Name or Email'}
                </Label>
                <Input
                  id="nameOrEmail"
                  type="text"
                  placeholder={t('customerSpending.search.nameOrEmailPlaceholder') || 'Search by name or email...'}
                  value={nameOrEmail}
                  onChange={(e) => setNameOrEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  {t('customerSpending.search.nameOrEmailHint') || 'Search by customer name or email (partial match)'}
                </p>
              </div>
            </div>
          )}

          {/* Min Spend Search */}
          {searchMode === 'minSpend' && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="minSpend" className="text-sm font-medium">
                  {t('customerSpending.search.minSpend') || 'Minimum Total Spend'}
                </Label>
                <Input
                  id="minSpend"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={t('customerSpending.search.minSpendPlaceholder') || '1000.00'}
                  value={minSpend}
                  onChange={(e) => setMinSpend(e.target.value)}
                  disabled={isLoading}
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  {t('customerSpending.search.minSpendHint') || 'Find customers with total spend above this amount'}
                </p>
              </div>
            </div>
          )}

          {/* Info messages for filter-only modes */}
          {searchMode === 'pendingBalance' && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {t('customerSpending.search.pendingBalanceInfo') || 'Shows customers with outstanding balance payments, ordered by balance amount'}
              </p>
            </div>
          )}

          {searchMode === 'activeBookings' && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {t('customerSpending.search.activeBookingsInfo') || 'Shows customers with currently active (pending/confirmed) bookings'}
              </p>
            </div>
          )}

          {searchMode === 'topSpenders' && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-sm text-green-800 dark:text-green-200">
                {t('customerSpending.search.topSpendersInfo') || 'Shows customers with highest total lifetime spend, ordered by amount'}
              </p>
            </div>
          )}

          {/* Pagination and Sort Controls */}
          <div className="border-t pt-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Page Size */}
              <div className="space-y-1.5">
                <Label htmlFor="pageSize" className="text-sm font-medium">
                  {t('common.pageSize') || 'Page Size'}
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
                    <SelectItem value="10">10 {t('common.perPage') || 'per page'}</SelectItem>
                    <SelectItem value="20">20 {t('common.perPage') || 'per page'}</SelectItem>
                    <SelectItem value="50">50 {t('common.perPage') || 'per page'}</SelectItem>
                    <SelectItem value="100">100 {t('common.perPage') || 'per page'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Field */}
              <div className="space-y-1.5">
                <Label htmlFor="sortField" className="text-sm font-medium">
                  {t('common.sortBy') || 'Sort By'}
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
                    <SelectItem value="totalSpendLifetime">{t('customerSpending.sort.totalSpend') || 'Total Spend'}</SelectItem>
                    <SelectItem value="totalBalancePayment">{t('customerSpending.sort.balancePayment') || 'Balance Due'}</SelectItem>
                    <SelectItem value="totalBookings">{t('customerSpending.sort.totalBookings') || 'Total Bookings'}</SelectItem>
                    <SelectItem value="averageBookingValue">{t('customerSpending.sort.averageBooking') || 'Average Booking'}</SelectItem>
                    <SelectItem value="lastActivityDate">{t('customerSpending.sort.lastActivity') || 'Last Activity'}</SelectItem>
                    <SelectItem value="firstBookingDate">{t('customerSpending.sort.firstBooking') || 'First Booking'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Direction */}
              <div className="space-y-1.5">
                <Label htmlFor="sortDirection" className="text-sm font-medium">
                  {t('common.order') || 'Order'}
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
                    <SelectItem value="asc">{t('common.ascending') || 'Ascending'}</SelectItem>
                    <SelectItem value="desc">{t('common.descending') || 'Descending'}</SelectItem>
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
              {isLoading 
                ? (t('common.searching') || 'Searching...') 
                : (t('common.search') || 'Search')}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
              className="h-10 px-6"
            >
              <X className="h-4 w-4 mr-2" />
              {t('common.reset') || 'Reset'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerSpendingSearchFilters;
