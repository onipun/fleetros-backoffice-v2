/**
 * Settlement API Type Definitions
 * Based on PAYMENT_SETTLEMENT_API_GUIDE.md
 */

// ============================================================================
// Enums & Constants
// ============================================================================

/**
 * Payment methods supported by the system
 */
export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'PAYMENT_GATEWAY'
  | 'CHECK'
  | 'MOBILE_WALLET'
  | 'QR_PAYMENT'
  | 'LOYALTY_POINTS'
  | 'OTHER';

/**
 * Payment status values
 */
export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'
  | 'CANCELLED'
  | 'DUE_AT_PICKUP';

/**
 * Transaction type categorization
 */
export type TransactionType =
  // Pre-Rental
  | 'DEPOSIT'
  | 'ADVANCE_PAYMENT'
  | 'PICKUP_PAYMENT'
  // During Rental
  | 'INSTALLMENT'
  | 'EXTENSION_FEE'
  | 'ADDITIONAL_CHARGE'
  | 'MODIFICATION_CHARGE'
  // Completion
  | 'FINAL_SETTLEMENT'
  | 'DEPOSIT_RETURN'
  // Post-Completion Charges
  | 'DAMAGE_CHARGE'
  | 'FUEL_CHARGE'
  | 'CLEANING_FEE'
  | 'LATE_FEE'
  | 'TRAFFIC_FINE'
  | 'PARKING_FINE'
  | 'TOLL_CHARGE'
  | 'INSURANCE_DEDUCTIBLE'
  | 'INSURANCE_PAYOUT'
  | 'ADMIN_FEE'
  // Adjustments
  | 'REFUND'
  | 'PARTIAL_REFUND'
  | 'GOODWILL_CREDIT'
  | 'PRICE_ADJUSTMENT'
  | 'WRITE_OFF'
  | 'DISPUTE_ADJUSTMENT'
  // Loyalty
  | 'POINTS_REDEMPTION'
  | 'VOUCHER_REDEMPTION'
  | 'PROMOTIONAL_DISCOUNT';

/**
 * Settlement status values
 */
export type SettlementStatus = 'OPEN' | 'CLOSED';

// ============================================================================
// Transaction Type Metadata
// ============================================================================

export interface TransactionTypeInfo {
  value: TransactionType;
  label: string;
  category: 'pre-rental' | 'during-rental' | 'completion' | 'post-completion' | 'adjustment' | 'loyalty';
  icon: string;
  description: string;
  isCharge: boolean; // true = adds to balance due, false = reduces balance
}

export const TRANSACTION_TYPES: TransactionTypeInfo[] = [
  // Pre-Rental
  { value: 'DEPOSIT', label: 'Deposit', category: 'pre-rental', icon: '💰', description: 'Initial deposit payment', isCharge: false },
  { value: 'ADVANCE_PAYMENT', label: 'Advance Payment', category: 'pre-rental', icon: '💵', description: 'Booking payment', isCharge: false },
  { value: 'PICKUP_PAYMENT', label: 'Pickup Payment', category: 'pre-rental', icon: '🚗', description: 'Payment at pickup', isCharge: false },
  
  // During Rental
  { value: 'INSTALLMENT', label: 'Installment', category: 'during-rental', icon: '📅', description: 'Regular installment payment', isCharge: false },
  { value: 'EXTENSION_FEE', label: 'Extension Fee', category: 'during-rental', icon: '⏰', description: 'Rental period extension charge', isCharge: true },
  { value: 'ADDITIONAL_CHARGE', label: 'Additional Charge', category: 'during-rental', icon: '➕', description: 'Add-on services charge', isCharge: true },
  { value: 'MODIFICATION_CHARGE', label: 'Modification Charge', category: 'during-rental', icon: '✏️', description: 'Booking modification fee', isCharge: true },
  
  // Completion
  { value: 'FINAL_SETTLEMENT', label: 'Final Settlement', category: 'completion', icon: '✅', description: 'Final payment at return', isCharge: false },
  { value: 'DEPOSIT_RETURN', label: 'Deposit Return', category: 'completion', icon: '↩️', description: 'Security deposit refund', isCharge: false },
  
  // Post-Completion Charges
  { value: 'DAMAGE_CHARGE', label: 'Damage Charge', category: 'post-completion', icon: '🔧', description: 'Damage discovered after return', isCharge: true },
  { value: 'FUEL_CHARGE', label: 'Fuel Charge', category: 'post-completion', icon: '⛽', description: 'Fuel not returned full', isCharge: true },
  { value: 'CLEANING_FEE', label: 'Cleaning Fee', category: 'post-completion', icon: '🧹', description: 'Excessive cleaning required', isCharge: true },
  { value: 'LATE_FEE', label: 'Late Return Fee', category: 'post-completion', icon: '⏳', description: 'Late return penalty', isCharge: true },
  { value: 'TRAFFIC_FINE', label: 'Traffic Fine', category: 'post-completion', icon: '🚦', description: 'Traffic violation fine', isCharge: true },
  { value: 'PARKING_FINE', label: 'Parking Fine', category: 'post-completion', icon: '🅿️', description: 'Parking violation fine', isCharge: true },
  { value: 'TOLL_CHARGE', label: 'Toll Charge', category: 'post-completion', icon: '🛣️', description: 'Unpaid toll charges', isCharge: true },
  { value: 'INSURANCE_DEDUCTIBLE', label: 'Insurance Deductible', category: 'post-completion', icon: '🛡️', description: 'Insurance claim deductible', isCharge: true },
  { value: 'INSURANCE_PAYOUT', label: 'Insurance Payout', category: 'post-completion', icon: '💸', description: 'Insurance payout received', isCharge: false },
  { value: 'ADMIN_FEE', label: 'Admin Fee', category: 'post-completion', icon: '📋', description: 'Administrative processing fee', isCharge: true },
  
  // Adjustments
  { value: 'REFUND', label: 'Full Refund', category: 'adjustment', icon: '💳', description: 'Full refund issued', isCharge: false },
  { value: 'PARTIAL_REFUND', label: 'Partial Refund', category: 'adjustment', icon: '💳', description: 'Partial refund issued', isCharge: false },
  { value: 'GOODWILL_CREDIT', label: 'Goodwill Credit', category: 'adjustment', icon: '🎁', description: 'Customer goodwill gesture', isCharge: false },
  { value: 'PRICE_ADJUSTMENT', label: 'Price Adjustment', category: 'adjustment', icon: '📊', description: 'Price correction', isCharge: false },
  { value: 'WRITE_OFF', label: 'Write-Off', category: 'adjustment', icon: '📝', description: 'Bad debt write-off', isCharge: false },
  { value: 'DISPUTE_ADJUSTMENT', label: 'Dispute Adjustment', category: 'adjustment', icon: '⚖️', description: 'Dispute resolution adjustment', isCharge: false },
  
  // Loyalty
  { value: 'POINTS_REDEMPTION', label: 'Points Redemption', category: 'loyalty', icon: '⭐', description: 'Loyalty points used', isCharge: false },
  { value: 'VOUCHER_REDEMPTION', label: 'Voucher Redemption', category: 'loyalty', icon: '🎟️', description: 'Voucher/coupon applied', isCharge: false },
  { value: 'PROMOTIONAL_DISCOUNT', label: 'Promotional Discount', category: 'loyalty', icon: '🏷️', description: 'Promotional discount applied', isCharge: false },
];

/**
 * Get transaction type info by value
 */
export function getTransactionTypeInfo(type: TransactionType): TransactionTypeInfo | undefined {
  return TRANSACTION_TYPES.find(t => t.value === type);
}

/**
 * Get transaction types by category
 */
export function getTransactionTypesByCategory(category: TransactionTypeInfo['category']): TransactionTypeInfo[] {
  return TRANSACTION_TYPES.filter(t => t.category === category);
}

/**
 * Get all post-completion charge types
 */
export function getPostCompletionChargeTypes(): TransactionTypeInfo[] {
  return TRANSACTION_TYPES.filter(t => t.category === 'post-completion' && t.isCharge);
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Transaction record in settlement
 */
export interface SettlementTransaction {
  id: number;
  type: TransactionType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  reason?: string;
  isPostCompletion: boolean;
  transactionDate: string;
  createdAt: string;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string;
  receiptUrl?: string;
}

/**
 * Settlement summary information
 */
export interface SettlementSummary {
  id: number;
  bookingId: number;
  status: SettlementStatus;
  originalAmount: number;
  currentAmount: number;
  totalReceived: number;
  totalCharges: number;
  totalRefunds: number;
  balance: number;
  currency: string;
  transactionCount: number;
  lastTransactionAt?: string;
  isOpen: boolean;
}

/**
 * Booking info in settlement context
 */
export interface SettlementBookingInfo {
  id: number;
  correlationId?: string;
  status: string;
  customerName?: string;
  startDate: string;
  endDate: string;
}

/**
 * Full settlement detail response
 */
export interface SettlementDetail {
  summary: SettlementSummary;
  transactions: SettlementTransaction[];
  booking?: SettlementBookingInfo;
}

/**
 * Outstanding settlement item (for listing)
 */
export interface OutstandingSettlement {
  bookingId: number;
  correlationId?: string;
  customerName?: string;
  balance: number;
  currency: string;
  transactionCount: number;
  lastTransactionAt?: string;
  bookingStatus: string;
}

// ============================================================================
// Enhanced Payment Request (with Transaction Types)
// ============================================================================

/**
 * Enhanced manual payment request with transaction type support
 */
export interface EnhancedManualPaymentRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  currency?: string;
  referenceNumber?: string;
  paymentDate?: string;
  notes?: string;
  payerName?: string;
  isDeposit?: boolean;
  transactionType?: TransactionType;
  isPostCompletion?: boolean;
  confirmBooking?: boolean;
  autoConfirmBooking?: boolean;
}

/**
 * Enhanced manual payment response
 */
export interface EnhancedManualPaymentResponse {
  // Payment details
  paymentId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  currency: string;
  status: PaymentStatus;
  referenceNumber?: string;
  receiptUrl?: string;
  paymentDate: string;
  createdAt: string;
  transactionType?: TransactionType;
  isPostCompletion?: boolean;
  
  // Booking summary
  bookingId: number;
  correlationId?: string;
  bookingStatus: string;
  bookingTotal: number;
  totalPaid: number;
  balanceDue: number;
  isFullyPaid: boolean;
  bookingConfirmed: boolean;
  
  // Result
  message?: string;
}

// ============================================================================
// Settlement Reporting Types
// ============================================================================

/**
 * Settlement report summary
 */
export interface SettlementReportSummary {
  totalOpenSettlements: number;
  totalClosedSettlements: number;
  totalOutstandingBalance: number;
  totalCollectedAmount: number;
  averageSettlementTime?: number; // in days
  currency: string;
}

/**
 * Settlement report by category
 */
export interface SettlementCategoryBreakdown {
  category: TransactionTypeInfo['category'];
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

/**
 * Settlement analytics response
 */
export interface SettlementAnalytics {
  summary: SettlementReportSummary;
  categoryBreakdown: SettlementCategoryBreakdown[];
  recentTransactions: SettlementTransaction[];
  outstandingSettlements: OutstandingSettlement[];
}
