'use client';

import { BookingOfferingSelector, type BookingOfferingSelection } from '@/components/booking/booking-offering-selector';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { EntitySelect } from '@/components/ui/entity-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Stepper } from '@/components/ui/stepper';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { hateoasClient } from '@/lib/api/hateoas-client';
import { parseHalResource } from '@/lib/utils';
import {
    BookingStatus,
    DiscountType,
    type Booking,
    type Discount,
    type Offering,
    type Package,
    type PreviewPricingResponse,
    type Pricing
} from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STEPS = [
  { id: 'reservation-details', title: 'Reservation Details', description: 'Vehicle, dates & offerings' },
  { id: 'customer-information', title: 'Customer Information', description: 'Guest contact details' },
  { id: 'logistic-coverage', title: 'Logistic Coverage', description: 'Location & insurance' },
  { id: 'pricing-overview', title: 'Pricing Overview', description: 'Review & total' },
];

const roundToTwo = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

// Helper function to generate date range
const generateDateRange = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
};

type BookingFormState = {
  vehicleId: number | null;
  packageId: number | null;
  discountId: number | null;
  startDate: string;
  endDate: string;
  pickupLocation: string;
  dropoffLocation: string;
  insurancePolicy: string;
  status: BookingStatus;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
};

const defaultState: BookingFormState = {
  vehicleId: null,
  packageId: null,
  discountId: null,
  startDate: '',
  endDate: '',
  pickupLocation: '',
  dropoffLocation: '',
  insurancePolicy: '',
  status: BookingStatus.PENDING,
  guestName: '',
  guestEmail: '',
  guestPhone: '',
};

export default function EditBookingPage() {
  const { t, formatCurrency } = useLocale();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bookingId = params.id as string;
  const [currentStep, setCurrentStep] = useState(0);
  const [validatedSteps, setValidatedSteps] = useState<Set<number>>(new Set());
  const [formState, setFormState] = useState<BookingFormState>(defaultState);
  const [offeringSelections, setOfferingSelections] = useState<Record<number, BookingOfferingSelection>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pricingPreview, setPricingPreview] = useState<PreviewPricingResponse | null>(null);
  const [isPreviewingPricing, setIsPreviewingPricing] = useState(false);
  const hasInitializedRef = useRef(false);
  
  // Fetch existing booking data
  const { data: booking, isLoading: bookingLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => hateoasClient.getResource<Booking>('bookings', bookingId),
  });

  const formatDaysLabel = useCallback(
    (days: number) =>
      `${days} ${days === 1 ? t('booking.form.daySingular') : t('booking.form.dayPlural')}`,
    [t]
  );

  const { data: offeringsData, isLoading: offeringsLoading, error: offeringsError } = useQuery({
    queryKey: ['offerings', 'all'],
    queryFn: async () => hateoasClient.getCollection<Offering>('offerings', { page: 0, size: 100 }),
  });

  const { data: mandatoryOfferingsData } = useQuery({
    queryKey: ['offerings', 'mandatory'],
    queryFn: async () => hateoasClient.getCollection<Offering>('offerings/search/findByIsMandatory', { 
      isMandatory: true,
      page: 0, 
      size: 100
    }),
  });

  const offerings = useMemo(() => {
    if (!offeringsData) return [] as Offering[];
    return parseHalResource<Offering>(offeringsData, 'offerings');
  }, [offeringsData]);

  const mandatoryOfferings = useMemo(() => {
    if (!mandatoryOfferingsData) return [] as Offering[];
    return parseHalResource<Offering>(mandatoryOfferingsData, 'offerings');
  }, [mandatoryOfferingsData]);

  const mandatoryOfferingIds = useMemo(() => {
    return new Set(mandatoryOfferings.map(o => o.id).filter((id): id is number => id != null));
  }, [mandatoryOfferings]);

  const offeringById = useMemo(() => {
    const map = new Map<number, Offering>();
    offerings.forEach((offering) => {
      if (offering.id != null) {
        map.set(offering.id, offering);
      }
    });
    return map;
  }, [offerings]);

  // Initialize form state from booking data
  useEffect(() => {
    if (!booking || hasInitializedRef.current) return;
    
    hasInitializedRef.current = true;
    
    setFormState({
      vehicleId: booking.vehicleId ?? null,
      packageId: booking.packageId ?? null,
      discountId: booking.discountId ?? null,
      startDate: booking.startDate || '',
      endDate: booking.endDate || '',
      pickupLocation: booking.pickupLocation || '',
      dropoffLocation: booking.dropoffLocation || '',
      insurancePolicy: booking.insurancePolicy || '',
      status: booking.status || BookingStatus.PENDING,
      guestName: '', // Not stored in old booking model
      guestEmail: '', // Not stored in old booking model
      guestPhone: '', // Not stored in old booking model
    });

    // Initialize offerings if they exist
    if (booking.offerings && Array.isArray(booking.offerings)) {
      const selections: Record<number, BookingOfferingSelection> = {};
      booking.offerings.forEach((item: any) => {
        const offeringId = item.offeringId || item.id;
        const offering = offeringById.get(offeringId);
        if (offering && offering.id) {
          selections[offering.id] = {
            offering,
            quantity: item.quantity || 1,
            included: false,
          };
        }
      });
      setOfferingSelections(selections);
    }
  }, [booking, offeringById]);

  // Generate date range for pricing query
  const dateRange = useMemo(() => {
    if (!formState.startDate || !formState.endDate) return [];
    return generateDateRange(formState.startDate, formState.endDate);
  }, [formState.startDate, formState.endDate]);

  // OLD: Disabled legacy pricing API - now using preview pricing API instead
  // This was calling /api/rental-pricing/calculate which is deprecated
  // Now we use /api/v1/bookings/preview-pricing via the previewPricingMutation
  const vehiclePricingData = null;
  const isPricingLoading = false;
  const pricingError = null;

  const { data: selectedPackage } = useQuery({
    queryKey: ['package', formState.packageId],
    queryFn: async () => {
      if (!formState.packageId) return null;
      return hateoasClient.getResource<Package>('packages', formState.packageId);
    },
    enabled: Boolean(formState.packageId),
  });

  // Fetch offerings for selected package via HATEOAS link
  const packageOfferingsLink = selectedPackage?._links?.offerings?.href;
  const { data: packageOfferingsData } = useQuery({
    queryKey: ['package', formState.packageId, 'offerings', packageOfferingsLink],
    queryFn: async () => {
      if (!packageOfferingsLink) return null;
      return hateoasClient.followLink<any>(packageOfferingsLink);
    },
    enabled: Boolean(packageOfferingsLink),
  });

  // Parse and merge offerings with package
  const selectedPackageWithOfferings = useMemo(() => {
    if (!selectedPackage) return null;
    
    // If package already has offerings, use it as is
    if (selectedPackage.offerings && selectedPackage.offerings.length > 0) {
      return selectedPackage;
    }
    
    // Otherwise, fetch from HATEOAS link and merge
    if (packageOfferingsData) {
      const offerings = parseHalResource<Offering>(packageOfferingsData, 'offerings');
      return {
        ...selectedPackage,
        offerings,
      };
    }
    
    return selectedPackage;
  }, [selectedPackage, packageOfferingsData]);

  const { data: selectedDiscount } = useQuery({
    queryKey: ['discount', formState.discountId],
    queryFn: async () => {
      if (!formState.discountId) return null;
      return hateoasClient.getResource<Discount>('discounts', formState.discountId);
    },
    enabled: Boolean(formState.discountId),
  });

  useEffect(() => {
    hasInitializedRef.current = true;
  }, []);

  // Auto-add mandatory offerings
  useEffect(() => {
    if (!hasInitializedRef.current || mandatoryOfferings.length === 0) return;

    setOfferingSelections((prev) => {
      let changed = false;
      const next: Record<number, BookingOfferingSelection> = { ...prev };

      mandatoryOfferings.forEach((offering) => {
        const id = offering.id;
        if (id == null) return;

        const existing = next[id];
        if (!existing) {
          next[id] = { offering, quantity: 1, included: false };
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [mandatoryOfferings]);

  const packageIncludedIds = useMemo(() => {
    if (!selectedPackageWithOfferings?.offerings) return [] as number[];
    return selectedPackageWithOfferings.offerings
      .map((item) => item.id)
      .filter((id): id is number => id != null);
  }, [selectedPackageWithOfferings?.offerings]);

  const packageIncludedIdSet = useMemo(() => new Set(packageIncludedIds), [packageIncludedIds]);

  useEffect(() => {
    if (!hasInitializedRef.current) return;

    setOfferingSelections((prev) => {
      let changed = false;
      const next: Record<number, BookingOfferingSelection> = { ...prev };

      packageIncludedIds.forEach((id) => {
        const offering = offeringById.get(id);
        if (!offering) return;

        const existing = next[id];
        if (!existing) {
          next[id] = { offering, quantity: 1, included: true };
          changed = true;
          return;
        }

        const updated: BookingOfferingSelection = {
          offering,
          quantity: Math.max(existing.quantity, 1),
          included: true,
        };

        if (
          existing.offering !== updated.offering ||
          existing.quantity !== updated.quantity ||
          existing.included !== updated.included
        ) {
          next[id] = updated;
          changed = true;
        }
      });

      Object.entries(next).forEach(([idStr, selection]) => {
        const id = Number(idStr);
        if (!packageIncludedIdSet.has(id) && selection.included) {
          next[id] = { ...selection, included: false };
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [packageIncludedIds, packageIncludedIdSet, offeringById]);

  const availableOfferings = useMemo(() => {
    const map = new Map<number, Offering>();
    offerings.forEach((offering) => {
      if (offering.id != null) {
        map.set(offering.id, offering);
      }
    });

    Object.entries(offeringSelections).forEach(([idStr, selection]) => {
      const id = Number(idStr);
      if (!map.has(id)) {
        map.set(id, selection.offering);
      }
    });

    const list = Array.from(map.values());
    list.sort((a, b) => {
      const aIncluded = a.id != null && packageIncludedIdSet.has(a.id);
      const bIncluded = b.id != null && packageIncludedIdSet.has(b.id);
      if (aIncluded && !bIncluded) return -1;
      if (!aIncluded && bIncluded) return 1;
      return (a.name ?? '').localeCompare(b.name ?? '');
    });

    return list;
  }, [offerings, offeringSelections, packageIncludedIdSet]);

  // Calculate exact duration including hours
  const computedTotalDays = useMemo(() => {
    if (!formState.startDate || !formState.endDate) return 0;
    const start = new Date(formState.startDate);
    const end = new Date(formState.endDate);
    const diffMs = end.getTime() - start.getTime();
    if (Number.isNaN(diffMs) || diffMs <= 0) return 0;
    
    // Convert milliseconds to days
    const exactDays = diffMs / (1000 * 60 * 60 * 24);
    return Math.max(0.01, exactDays);
  }, [formState.startDate, formState.endDate]);

  // Calculate duration in hours
  const computedTotalHours = useMemo(() => {
    if (!formState.startDate || !formState.endDate) return 0;
    const start = new Date(formState.startDate);
    const end = new Date(formState.endDate);
    const diffMs = end.getTime() - start.getTime();
    if (Number.isNaN(diffMs) || diffMs <= 0) return 0;
    
    // Convert milliseconds to hours
    const exactHours = diffMs / (1000 * 60 * 60);
    return Math.max(0.01, exactHours);
  }, [formState.startDate, formState.endDate]);

  // Clear preview when form data changes
  useEffect(() => {
    // Clear preview whenever key booking details change
    setPricingPreview(null);
  }, [
    formState.vehicleId,
    formState.packageId,
    formState.discountId,
    formState.startDate,
    formState.endDate,
    offeringSelections,
  ]);

  // Format duration for display (days and hours)
  const durationDisplay = useMemo(() => {
    if (computedTotalDays === 0) return '-';
    
    const totalHours = Math.floor(computedTotalHours);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    
    if (days === 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    } else if (hours === 0) {
      return `${days} ${days === 1 ? t('booking.form.daySingular') : t('booking.form.dayPlural')}`;
    } else {
      return `${days} ${days === 1 ? t('booking.form.daySingular') : t('booking.form.dayPlural')}, ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
  }, [computedTotalDays, computedTotalHours, t]);

  // Format date range for display
  const dateRangeDisplay = useMemo(() => {
    if (!formState.startDate || !formState.endDate) return '';
    const start = new Date(formState.startDate);
    const end = new Date(formState.endDate);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString(undefined, { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    return `${formatDate(start)} → ${formatDate(end)}`;
  }, [formState.startDate, formState.endDate]);

  const pickLatestPricing = useCallback((records: Pricing[]) => {
    if (records.length === 0) return undefined;
    return [...records].sort((a, b) => {
      const aTime = a.validFrom ? new Date(a.validFrom).getTime() : 0;
      const bTime = b.validFrom ? new Date(b.validFrom).getTime() : 0;
      return bTime - aTime;
    })[0];
  }, []);

  // Calculate average base rate from the preview pricing or fallback to 0
  // (No longer using old pricing API - only preview pricing)
  const vehicleBaseRate = useMemo(() => {
    if (!pricingPreview?.pricingSummary?.vehicleRentals?.length) {
      return 0;
    }
    
    // Get the first vehicle rental from preview pricing
    const rental = pricingPreview.pricingSummary.vehicleRentals[0];
    return rental.dailyRate || 0;
  }, [pricingPreview]);

  const vehicleBaseCharge = roundToTwo(vehicleBaseRate * computedTotalDays);
  const packageModifier = selectedPackage?.priceModifier ?? 1;

  const packageCharge = useMemo(() => {
    if (computedTotalDays === 0) return 0;

    const baseVehicle = vehicleBaseRate * computedTotalDays;

    if (formState.packageId) {
      // Package pricing uses the modifier on vehicle base rate
      return roundToTwo(baseVehicle * packageModifier);
    }

    return roundToTwo(baseVehicle);
  }, [computedTotalDays, formState.packageId, packageModifier, vehicleBaseRate]);

  const offeringChargeResult = useMemo(() => {
    let total = 0;
    const billableLines: Array<{
      id: number;
      label: string;
      quantity: number;
      unitPrice: number;
      amount: number;
    }> = [];
    const includedNames: string[] = [];

    Object.entries(offeringSelections).forEach(([idStr, selection]) => {
      const id = Number(idStr);
      const unitPrice = selection.offering.price ?? 0;
      const includedUnits = selection.included ? 1 : 0;
      const billableQuantity = Math.max(0, selection.quantity - includedUnits);
      const fallbackName = selection.offering.name || `${t('offering.unnamedOffering')} #${id}`;

      if (selection.included) {
        includedNames.push(fallbackName);
      }

      if (billableQuantity > 0) {
        const amount = unitPrice * billableQuantity;
        total += amount;
        billableLines.push({
          id,
          label: fallbackName,
          quantity: billableQuantity,
          unitPrice,
          amount,
        });
      }
    });

    return {
      total: roundToTwo(total),
      billableLines,
      includedNames,
    };
  }, [offeringSelections, t]);

  const offeringCharge = offeringChargeResult.total;
  
  // Use preview pricing data when available, otherwise use local calculations
  const vehicleSubtotal = pricingPreview?.pricingSummary?.totalVehicleRentalAmount ?? packageCharge;
  
  const subtotal = pricingPreview?.pricingSummary?.subtotal ?? roundToTwo(vehicleSubtotal + offeringCharge);

  // IMPORTANT: Always call useMemo (Rules of Hooks) - then choose which value to use
  const calculatedDiscountAmount = useMemo(() => {
    if (!selectedDiscount || subtotal <= 0) return 0;
    let amount = 0;

    if (selectedDiscount.type === DiscountType.PERCENTAGE) {
      amount = (selectedDiscount.value / 100) * subtotal;
    } else {
      amount = selectedDiscount.value;
    }

    return roundToTwo(Math.min(amount, subtotal));
  }, [selectedDiscount, subtotal]);

  // Use preview pricing discount if available, otherwise use calculated discount
  const discountAmount = pricingPreview?.pricingSummary?.totalDiscountAmount ?? calculatedDiscountAmount;

  const total = pricingPreview?.pricingSummary?.grandTotal ?? roundToTwo(subtotal - discountAmount);

  const pricingLineItems = useMemo(() => {
    const items: Array<{ id: string; label: string; amount: number; helper?: string }> = [];

    // Use preview pricing data if available
    if (pricingPreview?.pricingSummary?.vehicleRentals) {
      pricingPreview.pricingSummary.vehicleRentals.forEach((rental, index) => {
        const days = rental.days || rental.numberOfDays || 0;
        const amount = rental.amount || rental.subtotal || 0;
        items.push({
          id: `vehicle-rental-${index}`,
          label: `Vehicle: ${rental.vehicleName}`,
          amount: roundToTwo(amount),
          helper: `${days} ${days === 1 ? 'day' : 'days'} × ${formatCurrency(rental.dailyRate)}/day`,
        });
      });
    }

    // Package discount
    if (pricingPreview?.pricingSummary?.packageSummary) {
      const pkg = pricingPreview.pricingSummary.packageSummary;
      items.push({
        id: 'package-discount',
        label: `Package: ${pkg.packageName}`,
        amount: -roundToTwo(pkg.amountBeforePackage - pkg.amountAfterPackage),
        helper: `${pkg.discountPercentage}% discount`,
      });
    }

    // Offerings from preview pricing
    if (pricingPreview?.pricingSummary?.offerings) {
      pricingPreview.pricingSummary.offerings.forEach((offering, index) => {
        const amount = offering.amount || offering.totalPrice || 0;
        const unitPrice = offering.unitPrice || offering.pricePerUnit || 0;
        
        // Build helper text based on pricing basis
        let helper: string | undefined;
        if (offering.pricingBasis === 'PER_DAY') {
          // For per-day offerings, show: quantity × days × unitPrice
          const days = computedTotalDays;
          if (offering.quantity > 1) {
            helper = `${offering.quantity} × ${days} ${days === 1 ? 'day' : 'days'} × ${formatCurrency(unitPrice)}`;
          } else {
            helper = `${days} ${days === 1 ? 'day' : 'days'} × ${formatCurrency(unitPrice)}`;
          }
        } else if (offering.quantity > 1) {
          // For other pricing bases, just show: quantity × unitPrice
          helper = `${offering.quantity} × ${formatCurrency(unitPrice)}`;
        }
        
        items.push({
          id: `offering-${index}`,
          label: offering.offeringName,
          amount: roundToTwo(amount),
          helper,
        });
      });
    }

    // Discounts from preview pricing
    if (pricingPreview?.pricingSummary?.discounts) {
      pricingPreview.pricingSummary.discounts.forEach((discount, index) => {
        items.push({
          id: `discount-${index}`,
          label: `Discount: ${discount.discountCode}`,
          amount: -roundToTwo(discount.discountAmount),
          helper: discount.discountType === 'PERCENTAGE' ? `${discount.discountValue}%` : undefined,
        });
      });
    }

    return items;
  }, [pricingPreview, formatCurrency]);

  const includedOfferingNames = offeringChargeResult.includedNames;
  const discountDisplay =
    selectedDiscount && selectedDiscount.type === DiscountType.PERCENTAGE
      ? `${selectedDiscount.value}%`
      : selectedDiscount
        ? formatCurrency(selectedDiscount.value)
        : null;
  const discountLabel = t('booking.form.summary.discount');
  const discountLabelWithDescriptor = discountDisplay
    ? `${discountLabel} (${discountDisplay})`
    : discountLabel;

  // Preview pricing mutation - called when user reaches final step
  const previewPricingMutation = useMutation({
    mutationFn: async (payload: any) => {
      const vehicles = [{
        vehicleId: payload.vehicleId,
        startDate: payload.startDate,
        endDate: payload.endDate,
        pickupLocation: payload.pickupLocation,
        dropoffLocation: payload.dropoffLocation,
      }];

      const offerings = payload.offerings?.map((o: any) => ({
        offeringId: o.offeringId,
        quantity: o.quantity,
      })) || [];

      const discountCodes: string[] = [];
      if (payload.discountId && selectedDiscount?.code) {
        discountCodes.push(selectedDiscount.code);
      }

      const previewRequest = {
        vehicles,
        packageId: payload.packageId ?? undefined,
        offerings,
        discountCodes,
        applyLoyaltyDiscount: false, // Set based on user selection if loyalty is implemented
        pointsToRedeem: 0,
        currency: 'MYR',
        guestName: payload.guestName,
        guestEmail: payload.guestEmail,
        guestPhone: payload.guestPhone,
      };

      return hateoasClient.previewBookingPricing(previewRequest);
    },
    onSuccess: (preview: PreviewPricingResponse) => {
      setPricingPreview(preview);
      
      // Show preview in a toast or modal
      if (preview.validation.isValid) {
        toast({
          variant: 'success',
          title: 'Pricing Preview',
          description: `Total: ${formatCurrency(preview.pricingSummary.grandTotal)}. Review the pricing details below.`,
        });
      } else {
        // Show validation errors
        toast({
          title: 'Validation Errors',
          description: preview.validation.errors.join(', '),
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Preview Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const normalizedPayload = {
        ...payload,
        packageId: payload.packageId ?? undefined,
        discountId: payload.discountId ?? undefined,
      };

      return hateoasClient.update<Booking>('bookings', bookingId, normalizedPayload);
    },
    onSuccess: (updated: Booking) => {
      toast({
        variant: 'success',
        title: t('booking.form.notifications.updateSuccessTitle'),
        description: t('booking.form.notifications.updateSuccessDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      router.push(`/bookings/${bookingId}`);
    },
    onError: (error: Error) => {
      toast({
        title: t('booking.form.notifications.updateErrorTitle'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleFieldChange = (field: keyof BookingFormState) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { value } = event.target;
    setFormError(null);
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (field: 'startDate' | 'endDate') => (value: string) => {
    setFormError(null);
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSelect = (field: 'vehicleId' | 'packageId' | 'discountId') => (id: number | null) => {
    setFormError(null);
    setFormState((prev) => ({
      ...prev,
      [field]: id,
    }));
  };

  const handleOfferingToggle = useCallback(
    (offeringId: number, selected: boolean) => {
      // Prevent removal of mandatory offerings
      if (!selected && mandatoryOfferingIds.has(offeringId)) {
        return;
      }

      const offering = offeringById.get(offeringId);
      if (!offering && !selected) {
        setOfferingSelections((prev) => {
          if (!(offeringId in prev)) return prev;
          const { [offeringId]: _removed, ...rest } = prev;
          return rest;
        });
        return;
      }

      if (!offering) return;

      setOfferingSelections((prev) => {
        const next = { ...prev };
        if (selected) {
          const existing = next[offeringId];
          next[offeringId] = {
            offering,
            quantity: existing ? Math.max(existing.quantity, 1) : 1,
            included: packageIncludedIdSet.has(offeringId),
          };
        } else {
          delete next[offeringId];
        }
        return next;
      });
    },
    [offeringById, packageIncludedIdSet, mandatoryOfferingIds]
  );

  const handleOfferingQuantityChange = useCallback((offeringId: number, quantity: number) => {
    setOfferingSelections((prev) => {
      const current = prev[offeringId];
      if (!current || current.quantity === quantity) return prev;
      return {
        ...prev,
        [offeringId]: {
          ...current,
          quantity,
        },
      };
    });
  }, []);

  const clearSelection = (field: 'packageId' | 'discountId') => {
    setFormState((prev) => ({
      ...prev,
      [field]: null,
    }));
  };

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 0:
        // Reservation details: vehicle, start date, end date required
        return (
          !!formState.vehicleId &&
          !!formState.startDate &&
          !!formState.endDate &&
          computedTotalDays > 0
        );
      case 1:
        // Customer information: either email or phone must be provided
        return !!(formState.guestEmail || formState.guestPhone);
      case 2:
        // Logistic coverage: pickup and dropoff locations required
        return !!formState.pickupLocation && !!formState.dropoffLocation;
      case 3:
        // Pricing overview: always can proceed
        return true;
      default:
        return true;
    }
  }, [currentStep, formState, computedTotalDays]);

  const handleNext = (e?: React.MouseEvent) => {
    // Prevent any form submission
    e?.preventDefault();
    e?.stopPropagation();
    
    if (canProceed() && currentStep < STEPS.length - 1) {
      setValidatedSteps((prev) => new Set(prev).add(currentStep));
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = (e?: React.MouseEvent) => {
    // Prevent any form submission
    e?.preventDefault();
    e?.stopPropagation();
    
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleStepClick = (index: number) => {
    // Allow free navigation
    setCurrentStep(index);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Extra safety: Don't submit if not on final step
    if (currentStep !== STEPS.length - 1) {
      console.warn('Form submission prevented - not on final step');
      return;
    }

    if (!formState.vehicleId) {
      setFormError(t('booking.form.errors.vehicleRequired'));
      return;
    }

    if (!formState.startDate || !formState.endDate) {
      setFormError(t('booking.form.errors.datesRequired'));
      return;
    }

    if (new Date(formState.startDate) >= new Date(formState.endDate)) {
      setFormError(t('booking.form.errors.startBeforeEnd'));
      return;
    }

    if (computedTotalDays === 0) {
      setFormError(t('booking.form.errors.minimumDuration'));
      return;
    }

    // Validate customer information: either email or phone is required
    if (!formState.guestEmail && !formState.guestPhone) {
      setFormError('Either guest email or phone number is required');
      return;
    }

    setFormError(null);

    const offeringPayload = Object.entries(offeringSelections)
      .map(([idStr, selection]) => {
        const id = Number(idStr);
        const unitPrice = roundToTwo(selection.offering.price ?? 0);
        const includedUnits = selection.included ? 1 : 0;
        const billableQuantity = Math.max(0, selection.quantity - includedUnits);
        const totalPrice = roundToTwo(unitPrice * billableQuantity);

        return {
          offeringId: id,
          quantity: selection.quantity,
          price: unitPrice,
          totalPrice,
          included: selection.included,
        };
      })
      .filter((payload) => payload.quantity > 0);

    const bookingPayload = {
      vehicleId: formState.vehicleId,
      packageId: formState.packageId ?? null,
      discountId: formState.discountId ?? null,
      startDate: formState.startDate,
      endDate: formState.endDate,
      pickupLocation: formState.pickupLocation,
      dropoffLocation: formState.dropoffLocation,
      insurancePolicy: formState.insurancePolicy,
      totalDays: computedTotalDays,
      totalRentalFee: subtotal,
      finalPrice: total,
      balancePayment: total,
      status: formState.status,
      offerings: offeringPayload,
      guestName: formState.guestName,
      guestEmail: formState.guestEmail,
      guestPhone: formState.guestPhone,
      pricingSummary: {
        vehicleCharge: vehicleBaseCharge,
        packageCharge,
        offeringCharge,
        discountAmount,
        subtotal,
        total,
      },
      // Include complete vehicle pricing response from API
      appliedPricing: vehiclePricingData || null,
    };

    // CRITICAL: Call preview pricing API first if not already previewed
    if (!pricingPreview) {
      setIsPreviewingPricing(true);
      try {
        await previewPricingMutation.mutateAsync(bookingPayload);
        setIsPreviewingPricing(false);
        // After preview, user needs to click submit again to confirm
        toast({
          variant: 'success',
          title: 'Review Pricing',
          description: 'Please review the pricing details and click "Create Booking" again to confirm.',
        });
        return;
      } catch (error) {
        setIsPreviewingPricing(false);
        return; // Don't proceed if preview fails
      }
    }

    // If preview is valid, proceed with creation
    if (pricingPreview && !pricingPreview.validation.isValid) {
      setFormError('Please fix validation errors before creating booking');
      return;
    }

    // Update the booking
    updateMutation.mutate(bookingPayload);
  };

  if (bookingLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        {t('booking.form.loading')}
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-destructive">{t('booking.form.notFound')}</p>
        <Button asChild variant="outline">
          <Link href="/bookings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('booking.form.backToList')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/bookings/${bookingId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t('booking.form.pageTitle.edit')}</h1>
          <p className="text-muted-foreground">{t('booking.form.pageSubtitle.edit')}</p>
        </div>
      </div>

      <Stepper
        steps={STEPS.map((step) => ({
          id: step.id,
          title: step.title,
          description: step.description,
        }))}
        currentStep={currentStep}
        completedSteps={validatedSteps}
        onStepClick={handleStepClick}
      />

      <form onSubmit={handleSubmit} onKeyDown={(e) => {
        // CRITICAL: Prevent ANY form submission when not on final step
        if (e.key === 'Enter') {
          // If not on final step, always prevent Enter submission
          if (currentStep < STEPS.length - 1) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        }
      }}>
        <div className="min-h-[400px]">
          {formError && (
            <div className="mb-6 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Step 0: Reservation Details */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('booking.form.sections.reservation')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{`${t('booking.form.fields.vehicle')} ${t('common.required')}`}</Label>
                    <EntitySelect
                      entityType="vehicle"
                      value={formState.vehicleId ?? undefined}
                      onChange={(id) => handleSelect('vehicleId')(id)}
                      className="w-full"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>{`${t('booking.form.fields.startDate')} ${t('common.required')}`}</Label>
                      <DateTimePicker value={formState.startDate} onChange={handleDateChange('startDate')} />
                    </div>
                    <div className="space-y-2">
                      <Label>{`${t('booking.form.fields.endDate')} ${t('common.required')}`}</Label>
                      <DateTimePicker value={formState.endDate} onChange={handleDateChange('endDate')} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('booking.form.fields.packageOptional')}</Label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <EntitySelect
                        entityType="package"
                        value={formState.packageId ?? undefined}
                        onChange={(id) => handleSelect('packageId')(id)}
                        className="w-full md:min-w-[300px]"
                      />
                      {formState.packageId && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          onClick={() => clearSelection('packageId')}
                        >
                          {t('common.clear')}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('booking.form.fields.discountOptional')}</Label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <EntitySelect
                        entityType="discount"
                        value={formState.discountId ?? undefined}
                        onChange={(id) => handleSelect('discountId')(id)}
                        className="w-full md:min-w-[300px]"
                      />
                      {formState.discountId && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          onClick={() => clearSelection('discountId')}
                        >
                          {t('common.clear')}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">{t('booking.form.fields.status')}</Label>
                    <select
                      id="status"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={formState.status}
                      onChange={handleFieldChange('status')}
                    >
                      {Object.values(BookingStatus).map((status) => {
                        const labelKey = `booking.status.${status.toLowerCase()}`;
                        const statusLabel = t(labelKey);
                        return (
                          <option key={status} value={status}>
                            {statusLabel}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </CardContent>
              </Card>

              <BookingOfferingSelector
                offerings={availableOfferings}
                selections={offeringSelections}
                onToggle={handleOfferingToggle}
                onQuantityChange={handleOfferingQuantityChange}
                packageIncludedIds={packageIncludedIdSet}
                mandatoryOfferingIds={mandatoryOfferingIds}
                isLoading={offeringsLoading}
                errorMessage={offeringsError instanceof Error ? offeringsError.message : undefined}
              />
            </div>
          )}

          {/* Step 1: Customer Information */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="guestName">Guest Name (Optional)</Label>
                  <Input
                    id="guestName"
                    value={formState.guestName}
                    onChange={handleFieldChange('guestName')}
                    placeholder="Enter guest name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guestEmail">
                    Guest Email {!formState.guestPhone && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id="guestEmail"
                    type="email"
                    value={formState.guestEmail}
                    onChange={handleFieldChange('guestEmail')}
                    placeholder="guest@example.com"
                  />
                  {!formState.guestEmail && !formState.guestPhone && (
                    <p className="text-xs text-muted-foreground">
                      Either email or phone number is required
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guestPhone">
                    Guest Phone {!formState.guestEmail && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id="guestPhone"
                    type="tel"
                    value={formState.guestPhone}
                    onChange={handleFieldChange('guestPhone')}
                    placeholder="+60123456789"
                  />
                  {!formState.guestEmail && !formState.guestPhone && (
                    <p className="text-xs text-muted-foreground">
                      Either email or phone number is required
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Logistic Coverage */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('booking.form.sections.logistics')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pickupLocation">{`${t('booking.form.fields.pickupLocation')} ${t('common.required')}`}</Label>
                  <Input
                    id="pickupLocation"
                    value={formState.pickupLocation}
                    onChange={handleFieldChange('pickupLocation')}
                    placeholder={t('booking.form.placeholders.pickupLocation')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dropoffLocation">{`${t('booking.form.fields.dropoffLocation')} ${t('common.required')}`}</Label>
                  <Input
                    id="dropoffLocation"
                    value={formState.dropoffLocation}
                    onChange={handleFieldChange('dropoffLocation')}
                    placeholder={t('booking.form.placeholders.dropoffLocation')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="insurancePolicy">{t('booking.form.fields.insurancePolicy')}</Label>
                  <Textarea
                    id="insurancePolicy"
                    value={formState.insurancePolicy}
                    onChange={handleFieldChange('insurancePolicy')}
                    placeholder={t('booking.form.placeholders.insurancePolicy')}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Pricing Overview */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('booking.form.sections.pricing')}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Preview Pricing Result */}
                {pricingPreview ? (
                  <div className="rounded-lg border-2 border-green-500 bg-green-50 p-4 dark:bg-green-950/20">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-green-900 dark:text-green-100">
                        Preview Pricing Result
                      </h4>
                    </div>
                    
                    {pricingPreview.validation.isValid ? (
                      <div className="space-y-3">
                        {/* Rental Details */}
                        {pricingPreview.pricingSummary.vehicleRentals?.map((rental, idx) => (
                          <div key={idx} className="text-sm">
                            <p className="font-medium text-green-900 dark:text-green-100">
                              {rental.vehicleName}
                            </p>
                            <p className="text-xs text-green-700 dark:text-green-300">
                              {rental.rentalPeriod || `${rental.startDate} - ${rental.endDate}`}
                            </p>
                            <div className="flex justify-between mt-1">
                              <span className="text-green-700 dark:text-green-300">
                                {rental.days || rental.numberOfDays} days × {formatCurrency(rental.dailyRate)}
                              </span>
                              <span className="font-semibold">
                                {formatCurrency(rental.amount || rental.subtotal || 0)}
                              </span>
                            </div>
                          </div>
                        ))}

                        {/* Offerings */}
                        {pricingPreview.pricingSummary.offerings?.length > 0 && (
                          <div className="pt-2 border-t border-green-300">
                            <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                              Add-ons:
                            </p>
                            {pricingPreview.pricingSummary.offerings.map((offering, idx) => {
                              const days = computedTotalDays;
                              const unitPrice = offering.unitPrice || offering.pricePerUnit || 0;
                              
                              // Build display text based on pricing basis
                              let displayText = offering.offeringName;
                              if (offering.pricingBasis === 'PER_DAY') {
                                if (offering.quantity > 1) {
                                  displayText += ` (${offering.quantity} × ${days} ${days === 1 ? 'day' : 'days'} × ${formatCurrency(unitPrice)})`;
                                } else {
                                  displayText += ` (${days} ${days === 1 ? 'day' : 'days'} × ${formatCurrency(unitPrice)})`;
                                }
                              } else if (offering.quantity > 1) {
                                displayText += ` (${offering.quantity} × ${formatCurrency(unitPrice)})`;
                              }
                              
                              return (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span className="text-green-700 dark:text-green-300">
                                    {displayText}
                                  </span>
                                  <span>{formatCurrency(offering.amount || offering.totalPrice || 0)}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Pricing Breakdown */}
                        <div className="pt-2 border-t border-green-300 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-green-700 dark:text-green-300">Subtotal:</span>
                            <span>{formatCurrency(pricingPreview.pricingSummary.subtotal)}</span>
                          </div>
                          
                          {pricingPreview.pricingSummary.totalDiscountAmount > 0 && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm text-green-600 font-medium">
                                <span>Total Savings:</span>
                                <span className="font-semibold">
                                  -{formatCurrency(pricingPreview.pricingSummary.totalDiscountAmount)}
                                </span>
                              </div>
                              {pricingPreview.pricingSummary.discounts && pricingPreview.pricingSummary.discounts.length > 0 && (
                                <div className="ml-4 space-y-0.5">
                                  {pricingPreview.pricingSummary.discounts.map((discount, idx) => (
                                    <div key={idx} className="space-y-0.5">
                                      <div className="flex justify-between text-xs text-green-600">
                                        <span>• {discount.discountCode} ({discount.description || 'Discount'})</span>
                                        <span>-{formatCurrency(discount.discountAmount)}</span>
                                      </div>
                                      {discount.applicableScope && (
                                        <div className="ml-3 text-[10px] text-green-600/70 italic">
                                          Scope: {discount.applicableScope}{discount.scopeDetails ? ` - ${discount.scopeDetails}` : ''}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {pricingPreview.pricingSummary.taxAmount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-green-700 dark:text-green-300">Tax:</span>
                              <span>{formatCurrency(pricingPreview.pricingSummary.taxAmount)}</span>
                            </div>
                          )}

                          {pricingPreview.pricingSummary.serviceFeeAmount && pricingPreview.pricingSummary.serviceFeeAmount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-green-700 dark:text-green-300">Service Fee:</span>
                              <span>{formatCurrency(pricingPreview.pricingSummary.serviceFeeAmount)}</span>
                            </div>
                          )}
                        </div>

                        {/* Grand Total */}
                        <div className="pt-2 border-t-2 border-green-400">
                          <div className="flex justify-between text-base">
                            <span className="font-bold text-green-900 dark:text-green-100">Grand Total:</span>
                            <span className="font-bold text-green-700 dark:text-green-300">
                              {formatCurrency(pricingPreview.pricingSummary.grandTotal)}
                            </span>
                          </div>
                        </div>

                        {/* Payment Breakdown */}
                        <div className="pt-2 border-t border-green-300 space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-green-700 dark:text-green-300">Due at Booking:</span>
                            <span className="font-semibold">
                              {formatCurrency(pricingPreview.pricingSummary.dueAtBooking)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-green-700 dark:text-green-300">Due at Pickup:</span>
                            <span className="font-semibold">
                              {formatCurrency(pricingPreview.pricingSummary.dueAtPickup)}
                            </span>
                          </div>
                        </div>

                        {/* Deposit Info */}
                        {pricingPreview.pricingSummary.depositBreakdown && pricingPreview.pricingSummary.depositBreakdown.length > 0 && (
                          <div className="pt-2 border-t border-green-300">
                            <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                              Deposit Details:
                            </p>
                            {pricingPreview.pricingSummary.depositBreakdown.map((deposit, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-green-700 dark:text-green-300">
                                  {deposit.vehicleName} ({deposit.depositType})
                                </span>
                                <span>{formatCurrency(deposit.depositAmount)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Loyalty Info */}
                        {(pricingPreview.loyaltyInfo || pricingPreview.loyaltyPointsInfo) && (
                          <div className="pt-2 border-t border-green-300">
                            <p className="text-xs font-medium text-green-800 dark:text-green-200 mb-1">
                              Loyalty Points:
                            </p>
                            <div className="flex justify-between text-sm">
                              <span className="text-green-700 dark:text-green-300">Current Tier:</span>
                              <span className="font-semibold">
                                {(pricingPreview.loyaltyInfo || pricingPreview.loyaltyPointsInfo)?.currentTier}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-green-700 dark:text-green-300">Available Points:</span>
                              <span>
                                {(pricingPreview.loyaltyInfo || pricingPreview.loyaltyPointsInfo)?.availablePoints.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {pricingPreview.validation.warnings.length > 0 && (
                          <div className="pt-2 border-t border-green-300">
                            <p className="text-xs font-medium text-amber-700 mb-1">Warnings:</p>
                            <p className="text-xs text-amber-600">
                              {pricingPreview.validation.warnings.join(' • ')}
                            </p>
                          </div>
                        )}
                        
                        <p className="text-xs text-green-700 dark:text-green-300 mt-2 pt-2 border-t border-green-300">
                          ✓ Pricing validated. Click "Confirm & Create Booking" to proceed.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-red-600 dark:text-red-400 font-semibold">
                          Validation Errors:
                        </p>
                        <ul className="list-disc list-inside space-y-1">
                          {pricingPreview.validation.errors.map((error, idx) => (
                            <li key={idx} className="text-sm text-red-600 dark:text-red-400">
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-muted p-8 text-center">
                    <p className="text-muted-foreground mb-2">
                      No pricing preview available yet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Click "Preview Pricing" button below to calculate the total cost
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 justify-between mt-8">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button type="button" variant="outline" onClick={(e) => handlePrevious(e)}>
                {t('booking.form.navigation.previous')}
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentStep < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={(e) => handleNext(e)}
                disabled={!canProceed()}
              >
                {t('booking.form.navigation.next')}
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={
                  isPreviewingPricing || 
                  updateMutation.isPending || 
                  !canProceed() ||
                  (pricingPreview !== null && !pricingPreview.validation.isValid)
                }
              >
                {isPreviewingPricing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Previewing Pricing...
                  </>
                ) : updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.saving')}
                  </>
                ) : pricingPreview ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Confirm & Update Booking
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Preview Pricing
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
