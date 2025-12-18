// HATEOAS Types
export interface Link {
  href: string;
  templated?: boolean;
}

export interface Links {
  [rel: string]: Link | Link[];
}

export interface PageMetadata {
  size: number;
  totalElements: number;
  totalPages: number;
  number: number;
}

export interface HATEOASResource<T = any> {
  _links: Links;
  [key: string]: any;
}

export interface HATEOASCollection<T = any> {
  _embedded: {
    [key: string]: T[];
  };
  _links: Links;
  page?: PageMetadata;
}

// Entity Types
export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  RENTED = 'RENTED',
  MAINTENANCE = 'MAINTENANCE',
  RETIRED = 'RETIRED',
}

export enum CarType {
  SEDAN = 'SEDAN',
  SUV = 'SUV',
  HATCHBACK = 'HATCHBACK',
  COUPE = 'COUPE',
  CONVERTIBLE = 'CONVERTIBLE',
  WAGON = 'WAGON',
  VAN = 'VAN',
  PICKUP = 'PICKUP',
  LUXURY = 'LUXURY',
  SPORTS = 'SPORTS',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
  MOTORCYCLE = 'MOTORCYCLE',
  OTHER = 'OTHER',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export enum DiscountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
}

export type DiscountScope = 'ALL' | 'PACKAGE' | 'OFFERING' | 'BOOKING' | 'VEHICLE';

export enum OfferingType {
  GPS = 'GPS',
  INSURANCE = 'INSURANCE',
  CHILD_SEAT = 'CHILD_SEAT',
  WIFI = 'WIFI',
  ADDITIONAL_DRIVER = 'ADDITIONAL_DRIVER',
  OTHER = 'OTHER',
}

// Account Settings Types
export interface AccountSetting {
  id: number;
  settingKey: string;
  settingValue: string;
  description?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _links?: Links;
}

export interface AccountSettingRequest {
  settingKey: string;
  settingValue: string;
  description?: string;
}

export interface AccountSettingUpdateRequest {
  settingValue: string;
  description?: string;
}

export interface CommonSettings {
  [key: string]: string;
}

export interface Vehicle {
  id?: number;
  name: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string;
  odometer: number;
  fuelType: string;
  transmissionType: string;
  carType?: CarType;
  seaterCount?: number;
  details?: string;
  status: VehicleStatus;
  bufferMinutes: number;
  minRentalHours: number;
  maxRentalDays: number;
  maxFutureBookingDays: number;
  primaryImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  _links?: Links;
}

export interface VehicleImage {
  id?: number;
  imageUrl: string;
  thumbnail?: string;
  isPrimary: boolean;
  description?: string;
  caption?: string;
  uploadedAt?: string;
  createdAt?: string;
  _links?: Links;
}

export interface OfferingImage {
  id?: number;
  imageUrl: string;
  thumbnail?: string;
  isPrimary: boolean;
  description?: string;
  caption?: string;
  uploadedAt?: string;
  createdAt?: string;
  _links?: Links;
}

export interface Pricing {
  id?: number;
  vehicle?: string; // HATEOAS link to vehicle
  vehicleId?: number; // For display purposes
  package?: string; // HATEOAS link to package
  packageId?: number; // For display purposes
  booking?: string; // HATEOAS link to booking
  bookingId?: number; // For display purposes
  offering?: string; // HATEOAS link to offering
  offeringId?: number; // For display purposes
  baseRate: number;
  rateType: string;
  depositAmount: number;
  minimumRentalDays: number;
  validFrom: string;
  validTo: string;
  tags?: PricingTag[]; // Array of pricing tag objects
  tagNames?: string[]; // Array of tag names from v1 API
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
  _links?: Links;
}

export interface PricingTag {
  id?: number;
  name: string;
  description?: string;
  color?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  _links?: Links;
}

export interface Booking {
  id?: number;
  vehicleId?: number;
  startDate?: string;
  endDate?: string;
  pickupLocation: string;
  dropoffLocation: string;
  insurancePolicy?: string;
  totalDays: number;
  totalRentalFee: number;
  finalPrice: number;
  balancePayment: number;
  status: BookingStatus;
  createdAt?: string;
  updatedAt?: string;
  // Financial details
  subtotal?: number;
  totalDiscount?: number;
  taxAmount?: number;
  serviceFee?: number;
  grandTotal?: number;
  totalDeposit?: number;
  dueAtBooking?: number;
  dueAtPickup?: number;
  originalAmount?: number;
  currentAmount?: number;
  amountPaid?: number;
  // Customer details
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  customerId?: number;
  _links?: Links;
  package?: string; // HATEOAS link to package
  packageId?: number; // For display purposes
  discount?: string; // HATEOAS link to discount
  discountId?: number; // For display purposes
  // Expanded relations when available
  vehicle?: Vehicle;
  customer?: User;
  bookingStartDate?: string;
  bookingEndDate?: string;
  offerings?: BookingOffering[] | Offering[]; // Supports direct offering payloads for creation
  images?: BookingImage[]; // Mirrors vehicle image handling for damage reports
  // Modification tracking
  modificationCount?: number;
}

export interface BookingOffering {
  id?: number;
  offeringId: number;
  quantity: number;
  price: number;
  totalPrice: number;
  _links?: Links;
  offering?: Offering;
}

export interface BookingImage {
  id?: number;
  bookingId?: number;
  imageUrl: string;
  category?: BookingImageCategory;
  customCategory?: CustomImageCategory | null;
  notes?: string;
  description?: string; // Keep for backward compatibility
  uploadedByUserId?: number;
  uploadedAt: string;
  effectiveCategoryName?: string;
  categoryType?: 'PREDEFINED' | 'CUSTOM';
  _links?: Links;
}

export type BookingImageCategory = 
  | 'DELIVERY_INSPECTION'
  | 'PICKUP_INSPECTION'
  | 'ACCIDENT_INSPECTION'
  | 'PRE_RENTAL_INSPECTION'
  | 'POST_RENTAL_INSPECTION'
  | 'LICENSE_DOCUMENT'
  | 'RENTAL_AGREEMENT'
  | 'FUEL_RECEIPT'
  | 'TOLL_RECEIPT'
  | 'MAINTENANCE'
  | 'OTHER';

export interface PredefinedCategory {
  code: BookingImageCategory;
  name: string;
  description: string;
  type: 'PREDEFINED';
}

export interface CustomImageCategory {
  id: number;
  name: string;
  description?: string;
  displayColor?: string;
  icon?: string;
  type?: 'CUSTOM';
  createdByUserId?: number;
  createdAt?: string;
  active?: boolean;
}

export interface BookingImageCategoriesResponse {
  predefined: PredefinedCategory[];
  custom: CustomImageCategory[];
  totalPredefined: number;
  totalCustom: number;
  total: number;
}

export interface GroupedBookingImages {
  grouped: Record<string, BookingImage[]>;
  categories: BookingImageCategory[];
  customCategories: CustomImageCategory[];
  total: number;
}

// Booking Modification Types
export type FeeType = 'FLAT' | 'PERCENTAGE' | 'PER_DAY';
export type AdjustmentType = 'CHARGE' | 'REFUND' | 'NO_CHANGE';
export type ChangeType = 'CREATED' | 'MODIFIED' | 'CANCELLED' | 'COMPLETED' | 'STATUS_CHANGED';

export interface ModificationPolicyResponse {
  id: number;
  policyName: string;
  description: string;
  freeModificationHours: number;
  lateModificationFee: number;
  feeType: FeeType;
  allowDateChange: boolean;
  allowVehicleChange: boolean;
  allowLocationChange: boolean;
  hoursUntilPickup: number;
  isFreeModification: boolean;
  estimatedFee: number;
  contextMessage: string;
}

export interface VehicleBookingRequest {
  vehicleId: number;
  startDate: string;
  endDate: string;
  pickupLocation?: string;
  dropoffLocation?: string;
}

export interface UpdateBookingRequest {
  bookingId: number;
  vehicles: VehicleBookingRequest[];
  modificationReason: string;
}

export interface PaymentAdjustmentInfo {
  adjustmentType: AdjustmentType;
  amount: number;
  description: string;
}

export interface VehiclePricingDetail {
  vehicleId: number;
  vehicleName: string;
  startDate: string;
  endDate: string;
  daysRented: number;
  hoursRented: number;
  dailyRate: number;
  subtotal: number;
  tax: number;
  total: number;
}

export interface NewPricingDetails {
  subtotal: number;
  tax: number;
  discount: number;
  discountPercentage: number;
  grandTotal: number;
  currency: string;
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
  vehicles: VehiclePricingDetail[];
}

// Price Change Breakdown Types for Modification Preview
export interface VehicleChangeDetail {
  changeType: 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED';
  vehicleName: string;
  previousDays?: number;
  newDays?: number;
  previousAmount: number;
  newAmount: number;
  difference: number;
  reason?: string;
}

export interface OfferingChangeDetail {
  changeType: 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED';
  offeringName: string;
  previousQuantity?: number;
  newQuantity?: number;
  previousAmount: number;
  newAmount: number;
  difference: number;
}

export interface DiscountChangeDetail {
  changeType: 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED';
  discountCode: string;
  discountName?: string;
  previousAmount: number;
  newAmount: number;
  difference: number;
}

export interface PriceChangeBreakdown {
  vehicleChanges: VehicleChangeDetail[];
  previousVehicleTotal: number;
  newVehicleTotal: number;
  vehicleDifference: number;
  previousPackageDiscount: number;
  newPackageDiscount: number;
  packageDiscountDifference: number;
  offeringChanges: OfferingChangeDetail[];
  previousOfferingsTotal: number;
  newOfferingsTotal: number;
  offeringsDifference: number;
  discountChanges: DiscountChangeDetail[];
  previousDiscountsTotal: number;
  newDiscountsTotal: number;
  discountsDifference: number;
  previousTaxAmount: number;
  newTaxAmount: number;
  taxDifference: number;
  previousServiceFee: number;
  newServiceFee: number;
  serviceFeeDifference: number;
  previousDepositAmount: number;
  newDepositAmount: number;
  depositDifference: number;
  previousSubtotal: number;
  newSubtotal: number;
  subtotalDifference: number;
}

export interface NewPricingSummary {
  vehicleRentals: {
    vehicleName: string;
    rentalPeriod: string;
    days: number;
    dailyRate: number;
    amount: number;
  }[];
  totalVehicleRentalAmount: number;
  offerings: {
    offeringName: string;
    quantity: number;
    unitPrice: number;
    pricingBasis: string;
    amount: number;
  }[];
  totalOfferingsAmount: number;
  subtotal: number;
  discounts: {
    discountCode: string;
    description: string;
    discountAmount: number;
    applicableScope?: string;
    scopeDetails?: string;
  }[];
  totalDiscountAmount: number;
  taxAmount: number;
  serviceFeeAmount: number;
  totalTaxesAndFees: number;
  totalDepositAmount: number;
  depositBreakdown: {
    vehicleName: string;
    depositAmount: number;
    depositType: string;
  }[];
  grandTotal: number;
  dueAtBooking: number;
  dueAtPickup: number;
  calculatedAt?: string;
  currency: string;
  calculationVersion?: string;
}

export interface BookingModificationResponse {
  bookingId: number;
  success: boolean;
  message: string;
  previousAmount: number;
  newAmount: number;
  modificationFee: number;
  totalAdjustment: number;
  refundAmount: number;
  additionalPayment: number;
  paymentAdjustment: PaymentAdjustmentInfo;
  newPricingDetails: NewPricingDetails;
  changedFields: string[];
  isPreview: boolean;
  modificationTimestamp?: string;
  // Enhanced pricing breakdown fields
  priceDifference?: number;
  correlationId?: string;
  modificationType?: 'MINOR' | 'MAJOR';
  currentTotal?: number;
  amountPaid?: number;
  balanceDue?: number;
  modificationCount?: number;
  validation?: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  newPricingSummary?: NewPricingSummary;
  priceChangeBreakdown?: PriceChangeBreakdown;
}

export interface BookingSnapshot {
  bookingId: number;
  status: string;
  startDate: string;
  endDate: string;
  currentAmount: number;
  vehicles: {
    vehicleId: number;
    vehicleName: string;
    startDate: string;
    endDate: string;
    [key: string]: any;
  }[];
  [key: string]: any;
}

export interface BookingHistoryResponse {
  id: number;
  bookingId: number;
  changeType: ChangeType;
  changeReason: string;
  modifiedAt: string;
  modifiedBy: string | number;
  previousState: BookingSnapshot | null;
  newState: BookingSnapshot | null;
  changedFields: string[];
  modificationFee?: number;
  priceAdjustment?: number;
  // Additional fields from API
  previousAmount?: number;
  newAmount?: number;
  priceDifference?: number;
}

export enum OfferingRateType {
  DAILY = 'DAILY',
  HOURLY = 'HOURLY',
  FIXED = 'FIXED',
  PER_RENTAL = 'PER_RENTAL',
}

export interface OfferingPrice {
  id?: number;
  offering?: string; // URI reference to offering
  baseRate: number;
  rateType: OfferingRateType;
  priority: number;
  active: boolean;
  isDefault: boolean;
  minimumQuantity?: number;
  maximumQuantity?: number;
  validFrom?: string; // ISO 8601 format
  validTo?: string; // ISO 8601 format
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  _links?: Links;
}

// Inventory Mode - How availability is tracked
export type InventoryMode = 'SHARED' | 'EXCLUSIVE';

// Consumable Type - Type of offering item
export type ConsumableType = 'RETURNABLE' | 'CONSUMABLE' | 'SERVICE' | 'ACCOMMODATION';

export interface Offering {
  id?: number;
  name: string;
  offeringType: OfferingType;
  availability: number;
  price: number;
  maxQuantityPerBooking: number;
  isMandatory: boolean;
  description?: string;
  // New inventory management fields
  inventoryMode?: InventoryMode;
  consumableType?: ConsumableType;
  purchaseLimitPerBooking?: number | null;
  offeringPrices?: OfferingPrice[];
  createdAt?: string;
  updatedAt?: string;
  _links?: Links;
}

export type PackageModifierType = 'FIXED' | 'PERCENTAGE';

export interface PackageImage {
  id: number;
  imageUrl: string;
  description?: string;
  altText?: string;
  uploadedAt: string;
}

export interface PackageImageUploadResponse {
  message: string;
  image: PackageImage;
  replaced: boolean;
}

export interface Package {
  id?: number;
  name: string;
  description?: string;
  priceModifier: number;
  modifierType?: PackageModifierType;
  allowDiscountOnModifier?: boolean;
  validFrom: string;
  validTo: string;
  minRentalDays: number;
  bannerImage?: PackageImage;
  createdAt?: string;
  updatedAt?: string;
  offerings?: Offering[];
  offeringIds?: number[];
  _links?: Links;
}

export interface Discount {
  id?: number;
  code: string;
  type: DiscountType;
  value: number;
  validFrom: string;
  validTo: string;
  minBookingAmount: number;
  maxUses: number;
  usesCount: number;
  applicableScope: DiscountScope;
  description?: string;
  status: DiscountStatus;
  // New fields from API
  priority?: number;
  autoApply?: boolean;
  requiresPromoCode?: boolean;
  combinableWithOtherDiscounts?: boolean;
  firstTimeCustomerOnly?: boolean;
  applicablePackageIds?: string; // Comma-separated IDs: "5,7,9"
  applicableOfferingIds?: string; // Comma-separated IDs: "12,15"
  // Legacy single entity fields (kept for backward compatibility)
  package?: string;
  packageId?: number;
  offering?: string;
  offeringId?: number;
  booking?: string;
  bookingId?: number;
  createdAt?: string;
  updatedAt?: string;
  _links?: Links;
}

export interface Payment {
  id?: number;
  amount: number;
  currency?: string;
  paymentMethod: string;
  transactionId?: string;
  status: PaymentStatus;
  paymentDate?: string;
  bookingId?: number;
  isDeposit?: boolean;
  isManual?: boolean;
  recordedBy?: number;
  createdAt?: string;
  updatedAt?: string;
  _links?: Links;
}

export interface Review {
  id?: number;
  rating: number;
  comment?: string;
  reviewDate: string;
  isApproved: boolean;
  createdAt?: string;
  updatedAt?: string;
  _links?: Links;
}

// Loyalty System Types
export enum LoyaltyTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

export interface LoyaltyAccount {
  id: number;
  customerId: number;
  merchantAccountId: string;
  currentTier: LoyaltyTier;
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
  active: boolean;
  _links?: Links;
}

export interface LoyaltyTierInfo {
  tier: LoyaltyTier;
  minRentalsPerYear: number;
  pointsMultiplier: number;
  completionBonus: number;
  benefits: string[];
}

export interface LoyaltyPointsInfo {
  availablePoints: number;
  currentTier: LoyaltyTier;
  maxPointsDiscount: number;
  pointsConversionRate: number;
  isEligibleForRedemption: boolean;
  minimumPointsForRedemption: number;
}

export interface LoyaltyTransaction {
  id: number;
  loyaltyAccountId: number;
  transactionType: 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST';
  points: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  bookingId?: number;
  createdAt: string;
  _links?: Links;
}

export interface RedeemPointsRequest {
  loyaltyAccountId: number;
  pointsToRedeem: number;
  bookingId?: number;
  description?: string;
}

// Booking Request/Response Types
export interface VehicleBookingRequest {
  vehicleId: number;
  startDate: string;
  endDate: string;
  pickupLocation?: string;
  dropoffLocation?: string;
}

export interface OfferingBookingRequest {
  offeringId: number;
  quantity: number;
}

export interface CreateBookingRequest {
  vehicles: VehicleBookingRequest[];
  packageId?: number;
  offerings?: OfferingBookingRequest[];
  discountCodes?: string[];
  pointsToRedeem?: number;
  applyLoyaltyDiscount?: boolean;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  linkId?: number;
  correlationId?: string;
  currency?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface VehicleRentalSummary {
  vehicleId?: number;
  vehicleName: string;
  rentalPeriod?: string;
  startDate?: string;
  endDate?: string;
  days: number; // Actual API field
  numberOfDays?: number; // Backup field name
  dailyRate: number;
  totalDays?: number;
  amount: number; // Actual API field
  subtotal?: number; // Backup field name
}

export interface PackageSummary {
  packageId: number;
  packageName: string;
  priceModifier: number;
  modifierType?: PackageModifierType;
  allowDiscountOnModifier?: boolean;
  discountPercentage: number;
  amountBeforePackage: number;
  packageDiscount: number;
  amountAfterPackage: number;
}

export interface OfferingSummary {
  offeringId?: number;
  offeringName: string;
  quantity: number;
  unitPrice: number; // Actual API field
  pricePerUnit?: number; // Backup field name
  pricingBasis?: string;
  amount: number; // Actual API field
  totalPrice?: number; // Backup field name
}

export interface DiscountSummary {
  discountId: number;
  discountCode: string;
  discountType: DiscountType;
  discountValue: number;
  amountBeforeDiscount: number;
  discountAmount: number;
  amountAfterDiscount: number;
  applicableScope?: string;
  scopeDetails?: string;
}

export interface LoyaltyDiscount {
  pointsRedeemed: number;
  conversionRate: number;
  discountAmount: number;
}

export interface BookingPricingSummaryDetailed {
  vehicleRentals: VehicleRentalSummary[];
  totalVehicleRentalAmount: number;
  packageSummary?: PackageSummary;
  packageDiscountAmount?: number;
  offerings: OfferingSummary[];
  totalOfferingsAmount: number;
  subtotal: number;
  discounts: DiscountSummary[];
  totalDiscountAmount: number;
  loyaltyDiscount?: LoyaltyDiscount;
  amountAfterDiscounts?: number;
  taxRate?: number;
  taxAmount: number;
  serviceFeeAmount?: number;
  totalTaxesAndFees?: number;
  totalDepositAmount?: number;
  depositBreakdown?: Array<{
    vehicleName: string;
    depositAmount: number;
    depositType: string;
  }>;
  grandTotal: number;
  totalDeposit?: number;
  dueAtBooking: number;
  dueAtPickup: number;
  currency: string;
  calculatedAt: string;
  calculationVersion?: string;
}

export interface VehicleSnapshot {
  vehicleId: number;
  vehicleName: string;
  pricingId: number;
  baseRate: number;
  rateType: string;
  numberOfDays: number;
  totalAmount: number;
  depositAmount: number;
}

export interface PackageSnapshot {
  packageId: number;
  packageName: string;
  priceModifier: number;
  modifierType?: PackageModifierType;
  allowDiscountOnModifier?: boolean;
  discountAmount: number;
}

export interface OfferingSnapshot {
  offeringId: number;
  offeringName: string;
  offeringType: OfferingType;
  price: number;
  quantity: number;
  totalPrice: number;
}

export interface DiscountSnapshot {
  discountId: number;
  discountCode: string;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
}

export interface DetailedPricingSnapshots {
  vehicleSnapshots: VehicleSnapshot[];
  packageSnapshot?: PackageSnapshot;
  offeringSnapshots: OfferingSnapshot[];
  discountSnapshots: DiscountSnapshot[];
}

export interface PreviewPricingResponse {
  pricingSummary: BookingPricingSummaryDetailed;
  loyaltyInfo?: LoyaltyPointsInfo; // Actual API field
  loyaltyPointsInfo?: LoyaltyPointsInfo; // Backup field name
  validation: ValidationResult;
  detailedSnapshots: DetailedPricingSnapshots;
}

export interface BookingResponse {
  bookingId: number;
  status: BookingStatus;
  correlationId?: string;
  grandTotal: number;
  totalDeposit: number;
  dueAtBooking: number;
  dueAtPickup: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  totalVehicles: number;
  totalDays: number;
  bookingSummary: string;
}

export interface DiscountCriteria {
  bookingAmount?: number;
  packageId?: number;
  offeringIds?: number[];
  customerId?: number;
}

// Authentication Types
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  capabilities: string[];
  accountId?: number;
  emailVerified: boolean;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterMasterAccountRequest {
  accountName: string;
  accountType: string;
  email: string;
  phoneNumber: string;
  addressLine1: string;
  city: string;
  country: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  userEmail: string;
}

export interface RegisterSubUserRequest {
  accountId: number;
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

// UI State Types
export interface TableState {
  page: number;
  size: number;
  sort?: string;
  filters?: Record<string, any>;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  locale: 'en' | 'ms';
  sidebarCollapsed: boolean;
  onboardingCompleted: boolean;
}

// API Response Types
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status: number;
  timestamp: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}

// Vehicle Pricing API Types
export interface DailyBreakdown {
  date: string;
  dayOfWeek: string;
  dayType: string;
  rateType: string;
  unitRate: number;
  units: number;
  subtotal: number;
  applicableTags: string;
  notes: string;
}

export interface PricingSummary {
  category: string;
  unitRate: number;
  units: number;
  subtotal: number;
}

export interface VehiclePricingResponse {
  vehicleId: number;
  vehicleName: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  totalFullDays: number;
  totalPartialHours: number;
  dailyBreakdown: DailyBreakdown[];
  weekdayDailySummary?: PricingSummary;
  weekendDailySummary?: PricingSummary;
  weekdayHourlySummary?: PricingSummary;
  weekendHourlySummary?: PricingSummary;
  holidayDailySummary?: PricingSummary;
  holidayHourlySummary?: PricingSummary;
  subtotal: number;
  depositAmount: number;
  totalAmount: number;
}
