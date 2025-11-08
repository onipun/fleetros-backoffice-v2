/**
 * Booking API Service
 * Handles booking creation with preview, validation, and snapshot management
 */

import type {
    BookingPricingSummaryDetailed,
    BookingResponse,
    CreateBookingRequest,
    DetailedPricingSnapshots,
    OfferingBookingRequest,
    PreviewPricingResponse,
    VehicleBookingRequest,
} from '@/types';
import { hateoasClient } from './hateoas-client';

/**
 * Preview booking pricing before creation
 * This should ALWAYS be called before creating a booking
 */
export async function previewBookingPricing(
  request: CreateBookingRequest
): Promise<PreviewPricingResponse> {
  return hateoasClient.previewBookingPricing(request);
}

/**
 * Create a new booking
 * Should only be called after preview and user confirmation
 */
export async function createBooking(request: CreateBookingRequest): Promise<BookingResponse> {
  return hateoasClient.createBooking(request);
}

/**
 * Get immutable pricing snapshot for a booking
 */
export async function getPricingSnapshot(bookingId: number): Promise<DetailedPricingSnapshots> {
  return hateoasClient.getPricingSnapshot(bookingId);
}

/**
 * Get customer-facing pricing summary
 */
export async function getPricingSummary(
  bookingId: number
): Promise<BookingPricingSummaryDetailed> {
  return hateoasClient.getPricingSummary(bookingId);
}

/**
 * Create a booking with preview validation workflow
 * This implements the complete flow: preview -> validate -> confirm -> create
 */
export async function createBookingWithPreview(
  request: CreateBookingRequest,
  onPreview?: (preview: PreviewPricingResponse) => Promise<boolean>
): Promise<BookingResponse> {
  // Step 1: Preview pricing
  const preview = await previewBookingPricing(request);
  
  // Step 2: Validate
  if (!preview.validation.isValid) {
    throw new Error(
      `Booking validation failed: ${preview.validation.errors.join(', ')}`
    );
  }
  
  // Step 3: Optional user confirmation
  if (onPreview) {
    const confirmed = await onPreview(preview);
    if (!confirmed) {
      throw new Error('Booking cancelled by user');
    }
  }
  
  // Step 4: Create booking
  return createBooking(request);
}

/**
 * Build booking request from form data
 */
export function buildBookingRequest(params: {
  vehicleId: number;
  startDate: string;
  endDate: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  packageId?: number;
  offerings?: Array<{ offeringId: number; quantity: number }>;
  discountCodes?: string[];
  pointsToRedeem?: number;
  applyLoyaltyDiscount?: boolean;
  currency?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
}): CreateBookingRequest {
  const vehicles: VehicleBookingRequest[] = [
    {
      vehicleId: params.vehicleId,
      startDate: params.startDate,
      endDate: params.endDate,
      pickupLocation: params.pickupLocation,
      dropoffLocation: params.dropoffLocation,
    },
  ];

  const offerings: OfferingBookingRequest[] | undefined = params.offerings?.map(o => ({
    offeringId: o.offeringId,
    quantity: o.quantity,
  }));

  return {
    vehicles,
    packageId: params.packageId,
    offerings,
    discountCodes: params.discountCodes,
    pointsToRedeem: params.pointsToRedeem,
    applyLoyaltyDiscount: params.applyLoyaltyDiscount,
    currency: params.currency || 'MYR',
    guestName: params.guestName,
    guestEmail: params.guestEmail,
    guestPhone: params.guestPhone,
  };
}

/**
 * Validate booking request before submission
 */
export interface BookingRequestValidation {
  isValid: boolean;
  errors: string[];
}

export function validateBookingRequest(request: CreateBookingRequest): BookingRequestValidation {
  const errors: string[] = [];

  // Validate vehicles
  if (!request.vehicles || request.vehicles.length === 0) {
    errors.push('At least one vehicle is required');
  }

  request.vehicles?.forEach((vehicle, index) => {
    if (!vehicle.vehicleId) {
      errors.push(`Vehicle ${index + 1}: Vehicle ID is required`);
    }
    if (!vehicle.startDate) {
      errors.push(`Vehicle ${index + 1}: Start date is required`);
    }
    if (!vehicle.endDate) {
      errors.push(`Vehicle ${index + 1}: End date is required`);
    }
    
    // Validate date range
    if (vehicle.startDate && vehicle.endDate) {
      const start = new Date(vehicle.startDate);
      const end = new Date(vehicle.endDate);
      if (start >= end) {
        errors.push(`Vehicle ${index + 1}: End date must be after start date`);
      }
    }
  });

  // Validate offerings
  request.offerings?.forEach((offering, index) => {
    if (!offering.offeringId) {
      errors.push(`Offering ${index + 1}: Offering ID is required`);
    }
    if (!offering.quantity || offering.quantity < 1) {
      errors.push(`Offering ${index + 1}: Quantity must be at least 1`);
    }
  });

  // Validate loyalty points
  if (request.pointsToRedeem && request.pointsToRedeem < 0) {
    errors.push('Points to redeem cannot be negative');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
