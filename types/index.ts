// HATEOAS Types
export interface Link {
  href: string;
  templated?: boolean;
}

export interface Links {
  [rel: string]: Link;
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
  FIXED = 'FIXED',
}

export enum DiscountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
}

export type DiscountScope = 'ALL' | 'PACKAGE' | 'OFFERING' | 'BOOKING';

export enum OfferingType {
  GPS = 'GPS',
  INSURANCE = 'INSURANCE',
  CHILD_SEAT = 'CHILD_SEAT',
  WIFI = 'WIFI',
  ADDITIONAL_DRIVER = 'ADDITIONAL_DRIVER',
  OTHER = 'OTHER',
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
  categories: string[];
  totalCategories: number;
}

export interface Offering {
  id?: number;
  name: string;
  offeringType: OfferingType;
  availability: number;
  price: number;
  maxQuantityPerBooking: number;
  isMandatory: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  _links?: Links;
}

export interface Package {
  id?: number;
  name: string;
  description?: string;
  priceModifier: number;
  validFrom: string;
  validTo: string;
  minRentalDays: number;
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
  paymentMethod: string;
  transactionId: string;
  status: PaymentStatus;
  paymentDate?: string;
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
