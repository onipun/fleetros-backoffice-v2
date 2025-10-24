import { BookingStatus, DiscountType, OfferingType, VehicleStatus } from '@/types';
import { z } from 'zod';

export const vehicleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  licensePlate: z.string().min(1, 'License plate is required'),
  vin: z.string().min(1, 'VIN is required'),
  odometer: z.number().min(0),
  fuelType: z.string().min(1, 'Fuel type is required'),
  transmissionType: z.string().min(1, 'Transmission type is required'),
  details: z.string().optional(),
  status: z.nativeEnum(VehicleStatus),
  bufferMinutes: z.number().min(0),
  minRentalHours: z.number().min(1),
  maxRentalDays: z.number().min(1),
  maxFutureBookingDays: z.number().min(1),
});

export const bookingSchema = z.object({
  vehicleId: z.number().min(1, 'Vehicle is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  pickupLocation: z.string().min(1, 'Pickup location is required'),
  dropoffLocation: z.string().min(1, 'Dropoff location is required'),
  insurancePolicy: z.string().optional(),
  totalDays: z.number().min(1),
  totalRentalFee: z.number().min(0),
  finalPrice: z.number().min(0),
  balancePayment: z.number().min(0),
  status: z.nativeEnum(BookingStatus),
});

export const offeringSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  offeringType: z.nativeEnum(OfferingType),
  availability: z.number().min(0),
  price: z.number().min(0),
  maxQuantityPerBooking: z.number().min(1),
  isMandatory: z.boolean(),
  description: z.string().optional(),
});

export const discountSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50),
  type: z.nativeEnum(DiscountType),
  value: z.number().min(0),
  validFrom: z.string().min(1, 'Valid from date is required'),
  validTo: z.string().min(1, 'Valid to date is required'),
  minBookingAmount: z.number().min(0),
  maxUses: z.number().min(1),
  applicableScope: z.string().min(1),
  description: z.string().optional(),
});

export const packageSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  priceModifier: z.number().min(0).max(2),
  validFrom: z.string().min(1, 'Valid from date is required'),
  validTo: z.string().min(1, 'Valid to date is required'),
  minRentalDays: z.number().min(1),
});

export const pricingSchema = z.object({
  baseRate: z.number().min(0, 'Base rate must be positive'),
  rateType: z.string().min(1, 'Rate type is required'),
  depositAmount: z.number().min(0),
  minimumRentalDays: z.number().min(1),
  validFrom: z.string().min(1, 'Valid from date is required'),
  validTo: z.string().min(1, 'Valid to date is required'),
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const registerMasterAccountSchema = z.object({
  accountName: z.string().min(1, 'Account name is required'),
  accountType: z.string().min(1, 'Account type is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  addressLine1: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  userEmail: z.string().email('Invalid email address'),
});

export type VehicleFormData = z.infer<typeof vehicleSchema>;
export type BookingFormData = z.infer<typeof bookingSchema>;
export type OfferingFormData = z.infer<typeof offeringSchema>;
export type DiscountFormData = z.infer<typeof discountSchema>;
export type PackageFormData = z.infer<typeof packageSchema>;
export type PricingFormData = z.infer<typeof pricingSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterMasterAccountFormData = z.infer<typeof registerMasterAccountSchema>;
