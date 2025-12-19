/**
 * Settlement API Service
 * 
 * Handles all settlement-related API operations including:
 * - Settlement lifecycle management (get, close, reopen)
 * - Transaction history retrieval
 * - Outstanding settlement tracking
 * - Settlement reporting
 * 
 * Based on PAYMENT_SETTLEMENT_API_GUIDE.md
 */

import type {
    OutstandingSettlement,
    SettlementDetail,
    SettlementSummary,
    SettlementTransaction,
} from '@/types/settlement';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get access token from session
 */
async function getAccessToken(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/session');
    if (response.ok) {
      const session = await response.json();
      return session.accessToken || null;
    }
  } catch (error) {
    console.error('Failed to get access token:', error);
  }
  return null;
}

/**
 * Make authenticated API request
 */
async function authenticatedFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAccessToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Merge with provided headers
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Ignore parse errors
    }
    throw new Error(errorMessage);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return {} as T;
  }

  return JSON.parse(text);
}

// ============================================================================
// Settlement API Functions
// ============================================================================

/**
 * Get settlement details for a booking
 * GET /api/settlements/booking/{bookingId}
 */
export async function getSettlementDetails(
  bookingId: number
): Promise<SettlementDetail> {
  return authenticatedFetch<SettlementDetail>(
    `${API_BASE_URL}/api/settlements/booking/${bookingId}`,
    { method: 'GET' }
  );
}

/**
 * Get settlement summary for a booking
 * Returns just the summary portion without full transaction list
 */
export async function getSettlementSummary(
  bookingId: number
): Promise<SettlementSummary> {
  const detail = await getSettlementDetails(bookingId);
  return detail.summary;
}

/**
 * Close a settlement
 * POST /api/settlements/booking/{bookingId}/close
 */
export async function closeSettlement(
  bookingId: number,
  notes?: string
): Promise<SettlementSummary> {
  const url = new URL(`${API_BASE_URL}/api/settlements/booking/${bookingId}/close`);
  if (notes) {
    url.searchParams.set('notes', notes);
  }
  
  return authenticatedFetch<SettlementSummary>(url.toString(), {
    method: 'POST',
  });
}

/**
 * Reopen a closed settlement
 * POST /api/settlements/booking/{bookingId}/reopen
 */
export async function reopenSettlement(
  bookingId: number,
  reason?: string
): Promise<SettlementSummary> {
  const url = new URL(`${API_BASE_URL}/api/settlements/booking/${bookingId}/reopen`);
  if (reason) {
    url.searchParams.set('reason', reason);
  }
  
  return authenticatedFetch<SettlementSummary>(url.toString(), {
    method: 'POST',
  });
}

/**
 * Get all transactions for a booking's settlement
 * GET /api/settlements/booking/{bookingId}/transactions
 */
export async function getSettlementTransactions(
  bookingId: number
): Promise<SettlementTransaction[]> {
  return authenticatedFetch<SettlementTransaction[]>(
    `${API_BASE_URL}/api/settlements/booking/${bookingId}/transactions`,
    { method: 'GET' }
  );
}

/**
 * Get post-completion transactions only
 * GET /api/settlements/booking/{bookingId}/transactions/post-completion
 */
export async function getPostCompletionTransactions(
  bookingId: number
): Promise<SettlementTransaction[]> {
  return authenticatedFetch<SettlementTransaction[]>(
    `${API_BASE_URL}/api/settlements/booking/${bookingId}/transactions/post-completion`,
    { method: 'GET' }
  );
}

/**
 * Get all settlements with outstanding balances
 * GET /api/settlements/outstanding
 */
export async function getOutstandingSettlements(): Promise<OutstandingSettlement[]> {
  return authenticatedFetch<OutstandingSettlement[]>(
    `${API_BASE_URL}/api/settlements/outstanding`,
    { method: 'GET' }
  );
}

/**
 * Get total outstanding balance across all open settlements
 * GET /api/settlements/outstanding/total
 */
export async function getTotalOutstandingBalance(): Promise<number> {
  return authenticatedFetch<number>(
    `${API_BASE_URL}/api/settlements/outstanding/total`,
    { method: 'GET' }
  );
}

// ============================================================================
// Settlement Status Helpers
// ============================================================================

/**
 * Get settlement status display info
 */
export function getSettlementStatusInfo(status: 'OPEN' | 'CLOSED') {
  return status === 'OPEN'
    ? {
        label: 'Open',
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        icon: '🔓',
        description: 'Accepting transactions',
      }
    : {
        label: 'Closed',
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
        icon: '🔒',
        description: 'Settlement finalized',
      };
}

/**
 * Check if a settlement has outstanding balance
 */
export function hasOutstandingBalance(summary: SettlementSummary): boolean {
  return summary.balance > 0;
}

/**
 * Check if a settlement is fully paid
 */
export function isFullyPaid(summary: SettlementSummary): boolean {
  return summary.balance <= 0;
}

/**
 * Calculate settlement completion percentage
 */
export function getSettlementCompletionPercentage(summary: SettlementSummary): number {
  if (summary.currentAmount <= 0) return 100;
  const paid = summary.totalReceived - summary.totalRefunds;
  return Math.min(100, Math.round((paid / summary.currentAmount) * 100));
}

// ============================================================================
// Transaction Helpers
// ============================================================================

/**
 * Group transactions by category
 */
export function groupTransactionsByCategory(
  transactions: SettlementTransaction[]
): Record<string, SettlementTransaction[]> {
  const groups: Record<string, SettlementTransaction[]> = {
    'pre-rental': [],
    'during-rental': [],
    'completion': [],
    'post-completion': [],
    'adjustment': [],
    'loyalty': [],
  };

  const categoryMap: Record<string, string> = {
    DEPOSIT: 'pre-rental',
    ADVANCE_PAYMENT: 'pre-rental',
    PICKUP_PAYMENT: 'pre-rental',
    INSTALLMENT: 'during-rental',
    EXTENSION_FEE: 'during-rental',
    ADDITIONAL_CHARGE: 'during-rental',
    MODIFICATION_CHARGE: 'during-rental',
    FINAL_SETTLEMENT: 'completion',
    DEPOSIT_RETURN: 'completion',
    DAMAGE_CHARGE: 'post-completion',
    FUEL_CHARGE: 'post-completion',
    CLEANING_FEE: 'post-completion',
    LATE_FEE: 'post-completion',
    TRAFFIC_FINE: 'post-completion',
    PARKING_FINE: 'post-completion',
    TOLL_CHARGE: 'post-completion',
    INSURANCE_DEDUCTIBLE: 'post-completion',
    INSURANCE_PAYOUT: 'post-completion',
    ADMIN_FEE: 'post-completion',
    REFUND: 'adjustment',
    PARTIAL_REFUND: 'adjustment',
    GOODWILL_CREDIT: 'adjustment',
    PRICE_ADJUSTMENT: 'adjustment',
    WRITE_OFF: 'adjustment',
    DISPUTE_ADJUSTMENT: 'adjustment',
    POINTS_REDEMPTION: 'loyalty',
    VOUCHER_REDEMPTION: 'loyalty',
    PROMOTIONAL_DISCOUNT: 'loyalty',
  };

  transactions.forEach((transaction) => {
    const category = categoryMap[transaction.type] || 'adjustment';
    groups[category].push(transaction);
  });

  return groups;
}

/**
 * Calculate totals by transaction type
 */
export function calculateTransactionTotals(
  transactions: SettlementTransaction[]
): {
  totalPayments: number;
  totalCharges: number;
  totalRefunds: number;
  net: number;
} {
  let totalPayments = 0;
  let totalCharges = 0;
  let totalRefunds = 0;

  const chargeTypes = [
    'EXTENSION_FEE',
    'ADDITIONAL_CHARGE',
    'MODIFICATION_CHARGE',
    'DAMAGE_CHARGE',
    'FUEL_CHARGE',
    'CLEANING_FEE',
    'LATE_FEE',
    'TRAFFIC_FINE',
    'PARKING_FINE',
    'TOLL_CHARGE',
    'INSURANCE_DEDUCTIBLE',
    'ADMIN_FEE',
  ];

  const refundTypes = [
    'REFUND',
    'PARTIAL_REFUND',
    'GOODWILL_CREDIT',
    'DEPOSIT_RETURN',
    'INSURANCE_PAYOUT',
    'WRITE_OFF',
    'DISPUTE_ADJUSTMENT',
  ];

  transactions
    .filter((t) => t.status === 'COMPLETED')
    .forEach((t) => {
      if (chargeTypes.includes(t.type)) {
        totalCharges += t.amount;
      } else if (refundTypes.includes(t.type)) {
        totalRefunds += t.amount;
      } else {
        totalPayments += t.amount;
      }
    });

  return {
    totalPayments,
    totalCharges,
    totalRefunds,
    net: totalPayments + totalCharges - totalRefunds,
  };
}

/**
 * Filter transactions by date range
 */
export function filterTransactionsByDateRange(
  transactions: SettlementTransaction[],
  startDate?: Date,
  endDate?: Date
): SettlementTransaction[] {
  return transactions.filter((t) => {
    const txDate = new Date(t.transactionDate);
    if (startDate && txDate < startDate) return false;
    if (endDate && txDate > endDate) return false;
    return true;
  });
}

/**
 * Get recent transactions (last N)
 */
export function getRecentTransactions(
  transactions: SettlementTransaction[],
  limit: number = 5
): SettlementTransaction[] {
  return [...transactions]
    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
    .slice(0, limit);
}
