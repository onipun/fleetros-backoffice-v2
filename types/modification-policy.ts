/**
 * Modification Policy & Loyalty System Types
 * Based on MODIFICATION_POLICY_LOYALTY_INTEGRATION_GUIDE.md
 */

// ============================================================
// MODIFICATION POLICY TYPES
// ============================================================

export type LoyaltyTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | null;

export interface ModificationPolicy {
  id: number;
  policyName: string;
  description: string | null;
  loyaltyTier: LoyaltyTier;
  freeModificationHours: number;
  lateModificationFee: number;
  categoryChangeFee: number;
  locationChangeFee: number;
  allowVehicleChange: boolean;
  allowDateChange: boolean;
  allowLocationChange: boolean;
  maxDateChangeDays: number;
  majorModificationPriceThresholdPercent: number;
  majorModificationDateThresholdDays: number;
  context?: BookingModificationContext | null;
  _links?: HateoasLinks;
}

export interface BookingModificationContext {
  hoursUntilPickup: number;
  isFreeModification: boolean;
  estimatedFee: number;
  allowedModifications: ModificationType[];
  restrictedModifications: ModificationType[];
}

export type ModificationType = 
  | 'VEHICLE_CHANGE'
  | 'DATE_CHANGE'
  | 'LOCATION_CHANGE'
  | 'CUSTOMER_DETAILS'
  | 'ALL_MODIFICATIONS';

export interface CreateModificationPolicyRequest {
  policyName: string;
  description?: string;
  loyaltyTier?: LoyaltyTier;
  freeModificationHours: number;
  lateModificationFee: number;
  categoryChangeFee: number;
  locationChangeFee: number;
  allowVehicleChange: boolean;
  allowDateChange: boolean;
  allowLocationChange: boolean;
  maxDateChangeDays: number;
  majorModificationPriceThresholdPercent: number;
  majorModificationDateThresholdDays: number;
}

export interface UpdateModificationPolicyRequest extends CreateModificationPolicyRequest {}

// ============================================================
// LOYALTY CONFIGURATION TYPES
// ============================================================

export interface LoyaltyConfiguration {
  id: number;
  tier: Exclude<LoyaltyTier, null>;
  displayName: string;
  minimumRentalsPerYear: number;
  maximumRentalsPerYear: number | null;
  pointsPerCurrencyUnit: number;
  bookingCompletionBonus: number;
  priorityCheckIn: boolean;
  freeUpgrade: boolean;
  guaranteedAvailability: boolean;
  guaranteedAvailabilityHours: number | null;
  tierDiscountPercentage: number;
  freeAdditionalDriverDays: number;
  description: string | null;
  active: boolean;
  _links?: HateoasLinks;
}

export interface CreateLoyaltyConfigurationRequest {
  tier: Exclude<LoyaltyTier, null>;
  displayName: string;
  minimumRentalsPerYear: number;
  maximumRentalsPerYear?: number | null;
  pointsPerCurrencyUnit: number;
  bookingCompletionBonus?: number;
  priorityCheckIn?: boolean;
  freeUpgrade?: boolean;
  guaranteedAvailability?: boolean;
  guaranteedAvailabilityHours?: number | null;
  tierDiscountPercentage?: number;
  freeAdditionalDriverDays?: number;
  description?: string;
}

export interface UpdateLoyaltyConfigurationRequest extends CreateLoyaltyConfigurationRequest {}

// ============================================================
// LOYALTY CUSTOMER & TRANSACTION TYPES
// ============================================================

export interface CustomerLoyaltyAccount {
  id: number;
  customerId: number;
  customerEmail: string;
  customerName: string;
  currentTier: Exclude<LoyaltyTier, null>;
  availablePoints: number;
  lifetimePoints: number;
  redeemedPoints: number;
  expiredPoints: number;
  rentalsCurrentYear: number;
  rentalsLifetime: number;
  spendingCurrentYear: number;
  spendingLifetime: number;
  memberSince: string;
  tierLastEvaluated: string;
  tierYearStart: string;
  pointsLastUpdated: string;
  lastActivityDate: string;
  active: boolean;
  optInCommunications: boolean;
  notes: string | null;
  _links?: HateoasLinks;
}

export type LoyaltyTransactionType =
  // Earning Transactions
  | 'EARN_BOOKING'
  | 'EARN_REVIEW'
  | 'EARN_REFERRAL'
  | 'EARN_MOBILE_APP'
  | 'EARN_SIGNUP_BONUS'
  | 'EARN_PROMOTION'
  | 'EARN_MILESTONE'
  | 'EARN_BONUS'
  // Redemption Transactions
  | 'REDEEM_BOOKING'
  | 'REDEEM_ADDON'
  | 'REDEEM_PARTNER'
  | 'REDEEM_UPGRADE'
  | 'REDEEM_GIFT_CARD'
  // System Transactions
  | 'EXPIRE'
  | 'ADJUSTMENT'
  | 'REVERSAL';

export interface LoyaltyTransaction {
  id: number;
  loyaltyAccountId: number;
  transactionType: LoyaltyTransactionType;
  points: number;
  balanceAfter: number;
  bookingId: number | null;
  reviewId: number | null;
  monetaryAmount: number | null;
  currencyCode: string | null;
  pointsMultiplier: number | null;
  tierAtTransaction: string;
  description: string;
  referenceId: string | null;
  expirationDate: string | null;
  createdByUserId: number | null;
  notes: string | null;
  voided: boolean;
  voidedAt: string | null;
  voidReason: string | null;
  createdAt: string;
  _links?: HateoasLinks;
}

// ============================================================
// HATEOAS & API RESPONSE TYPES
// ============================================================

export interface HateoasLink {
  href: string;
}

export interface HateoasLinks {
  self?: HateoasLink;
  [key: string]: HateoasLink | undefined;
}

export interface ModificationPolicyListResponse {
  _embedded: {
    modificationPolicyResponseList: ModificationPolicy[];
  };
  _links: HateoasLinks;
}

export interface LoyaltyConfigurationListResponse {
  _embedded: {
    loyaltyConfigurationResponseList?: LoyaltyConfiguration[];
    loyaltyConfigurationResponses?: LoyaltyConfiguration[];
  };
  _links: HateoasLinks;
}

export interface LoyaltyTransactionListResponse {
  _embedded: {
    loyaltyTransactionResponseList: LoyaltyTransaction[];
  };
  _links: HateoasLinks;
}

// ============================================================
// ERROR TYPES
// ============================================================

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

// ============================================================
// UI HELPER TYPES
// ============================================================

export interface TierBenefitsSummary {
  tier: Exclude<LoyaltyTier, null>;
  displayName: string;
  pointsMultiplier: string;
  bookingBonus: number;
  priorityCheckIn: boolean;
  freeUpgrade: boolean;
  guaranteedAvailability: boolean;
  guaranteedHours: number | null;
  tierDiscount: string;
  freeDriverDays: number;
}

export interface CustomerLoyaltySummary {
  customer: {
    id: number;
    email: string;
    name: string;
  };
  loyalty: {
    tier: Exclude<LoyaltyTier, null>;
    tierDisplay: string;
    availablePoints: number;
    pointsValue: string;
    lifetimePoints: number;
    rentalsThisYear: number;
    rentalsLifetime: number;
    spendingThisYear: number;
    spendingLifetime: number;
    memberSince: string;
  };
  benefits: TierBenefitsSummary;
  nextTier: {
    tier: Exclude<LoyaltyTier, null> | null;
    rentalsNeeded: number;
    currentProgress: number;
    targetProgress: number;
    message?: string;
    progress: number;
  };
}

export const LOYALTY_TIERS: Exclude<LoyaltyTier, null>[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];

export const LOYALTY_TIER_COLORS: Record<Exclude<LoyaltyTier, null>, string> = {
  BRONZE: 'bg-amber-600',
  SILVER: 'bg-gray-500',
  GOLD: 'bg-yellow-500',
  PLATINUM: 'bg-indigo-600',
};

export const MODIFICATION_FEE_TYPES = [
  'lateModificationFee',
  'categoryChangeFee',
  'locationChangeFee',
] as const;

export const DEFAULT_POLICY_VALUES: Partial<CreateModificationPolicyRequest> = {
  freeModificationHours: 48,
  lateModificationFee: 25.00,
  categoryChangeFee: 50.00,
  locationChangeFee: 30.00,
  allowVehicleChange: true,
  allowDateChange: true,
  allowLocationChange: true,
  maxDateChangeDays: 7,
  majorModificationPriceThresholdPercent: 30.00,
  majorModificationDateThresholdDays: 7,
};

export const DEFAULT_LOYALTY_CONFIG_VALUES: Partial<CreateLoyaltyConfigurationRequest> = {
  bookingCompletionBonus: 0,
  priorityCheckIn: false,
  freeUpgrade: false,
  guaranteedAvailability: false,
  tierDiscountPercentage: 0.00,
  freeAdditionalDriverDays: 0,
};
