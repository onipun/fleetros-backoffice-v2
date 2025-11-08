/**
 * Custom React Hooks for Booking with Preview
 * Implements the complete booking flow with preview and validation
 */

'use client';

import {
    buildBookingRequest,
    createBooking,
    getPricingSnapshot,
    getPricingSummary,
    previewBookingPricing,
    validateBookingRequest,
} from '@/lib/api/booking-api';
import type {
    BookingResponse,
    CreateBookingRequest,
    PreviewPricingResponse,
} from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook to preview booking pricing
 */
export function usePreviewBookingPricing() {
  return useMutation({
    mutationFn: (request: CreateBookingRequest) => previewBookingPricing(request),
  });
}

/**
 * Hook to create a booking
 */
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateBookingRequest) => createBooking(request),
    onSuccess: () => {
      // Invalidate bookings list
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

/**
 * Hook to get pricing snapshot for a booking
 */
export function usePricingSnapshot(bookingId: number | null) {
  return useQuery({
    queryKey: ['booking-pricing-snapshot', bookingId],
    queryFn: () => {
      if (!bookingId) throw new Error('Booking ID is required');
      return getPricingSnapshot(bookingId);
    },
    enabled: Boolean(bookingId),
  });
}

/**
 * Hook to get pricing summary for a booking
 */
export function usePricingSummary(bookingId: number | null) {
  return useQuery({
    queryKey: ['booking-pricing-summary', bookingId],
    queryFn: () => {
      if (!bookingId) throw new Error('Booking ID is required');
      return getPricingSummary(bookingId);
    },
    enabled: Boolean(bookingId),
  });
}

/**
 * Complete booking flow hook with preview validation
 * This implements the recommended workflow from the API documentation
 */
export function useBookingWithPreview() {
  const queryClient = useQueryClient();
  const previewMutation = usePreviewBookingPricing();
  const createMutation = useCreateBooking();

  const createWithPreview = async (
    request: CreateBookingRequest,
    options?: {
      skipPreview?: boolean;
      onPreviewSuccess?: (preview: PreviewPricingResponse) => void;
      onPreviewError?: (error: Error) => void;
    }
  ): Promise<BookingResponse> => {
    // Step 1: Validate request structure
    const validation = validateBookingRequest(request);
    if (!validation.isValid) {
      throw new Error(`Invalid booking request: ${validation.errors.join(', ')}`);
    }

    // Step 2: Preview pricing (unless explicitly skipped)
    if (!options?.skipPreview) {
      try {
        const preview = await previewMutation.mutateAsync(request);
        
        // Step 3: Check validation from preview
        if (!preview.validation.isValid) {
          throw new Error(
            `Booking validation failed: ${preview.validation.errors.join(', ')}`
          );
        }

        // Step 4: Notify caller of preview results
        if (options?.onPreviewSuccess) {
          options.onPreviewSuccess(preview);
        }
      } catch (error) {
        if (options?.onPreviewError && error instanceof Error) {
          options.onPreviewError(error);
        }
        throw error;
      }
    }

    // Step 5: Create booking
    const booking = await createMutation.mutateAsync(request);
    
    return booking;
  };

  return {
    createWithPreview,
    preview: previewMutation,
    create: createMutation,
    isLoading: previewMutation.isPending || createMutation.isPending,
    isPreviewLoading: previewMutation.isPending,
    isCreateLoo: createMutation.isPending,
  };
}

/**
 * Hook to build and manage booking request state
 */
export function useBookingRequestBuilder() {
  const build = (params: Parameters<typeof buildBookingRequest>[0]) => {
    return buildBookingRequest(params);
  };

  const validate = (request: CreateBookingRequest) => {
    return validateBookingRequest(request);
  };

  return {
    build,
    validate,
  };
}
