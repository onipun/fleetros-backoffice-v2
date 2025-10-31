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
    type Pricing
} from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STEPS = [
  { id: 'reservation-details', title: 'Reservation Details', description: 'Vehicle, dates & offerings' },
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
};

export default function NewBookingPage() {
  const { t, formatCurrency } = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [validatedSteps, setValidatedSteps] = useState<Set<number>>(new Set());
  const [formState, setFormState] = useState<BookingFormState>(defaultState);
  const [offeringSelections, setOfferingSelections] = useState<Record<number, BookingOfferingSelection>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [shouldFetchPricing, setShouldFetchPricing] = useState(false);
  const hasInitializedRef = useRef(false);

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

  // Generate date range for pricing query
  const dateRange = useMemo(() => {
    if (!formState.startDate || !formState.endDate) return [];
    return generateDateRange(formState.startDate, formState.endDate);
  }, [formState.startDate, formState.endDate]);

  // Fetch vehicle pricing for selected dates - only when explicitly triggered
  const { data: vehiclePricingData, isLoading: isPricingLoading, error: pricingError } = useQuery({
    queryKey: ['vehicle-pricing', formState.vehicleId, formState.startDate, formState.endDate],
    queryFn: async () => {
      if (!formState.vehicleId || !formState.startDate || !formState.endDate) return null;
      return hateoasClient.getVehiclePricing(formState.vehicleId, [formState.startDate, formState.endDate]);
    },
    enabled: Boolean(formState.vehicleId) && Boolean(formState.startDate) && Boolean(formState.endDate) && shouldFetchPricing,
  });

  const { data: selectedPackage } = useQuery({
    queryKey: ['package', formState.packageId],
    queryFn: async () => {
      if (!formState.packageId) return null;
      return hateoasClient.getResource<Package>('packages', formState.packageId);
    },
    enabled: Boolean(formState.packageId),
  });

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
    if (!selectedPackage?.offerings) return [] as number[];
    return selectedPackage.offerings
      .map((item) => item.id)
      .filter((id): id is number => id != null);
  }, [selectedPackage?.offerings]);

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

  // Trigger pricing fetch when both dates are set (after OK button clicked in date picker)
  useEffect(() => {
    if (formState.startDate && formState.endDate && formState.vehicleId) {
      // Enable pricing fetch when all required fields are present
      setShouldFetchPricing(true);
    } else {
      // Reset flag when any required field is missing
      setShouldFetchPricing(false);
    }
  }, [formState.startDate, formState.endDate, formState.vehicleId]);

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

  // Calculate average base rate from the new pricing summary format
  const vehicleBaseRate = useMemo(() => {
    if (!vehiclePricingData) {
      return 0;
    }
    
    // Use the subtotal from backend and divide by total days/hours
    const totalUnits = vehiclePricingData.totalFullDays + (vehiclePricingData.totalPartialHours / 24);
    return totalUnits > 0 ? vehiclePricingData.subtotal / totalUnits : 0;
  }, [vehiclePricingData]);

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
  
  // Calculate subtotal: use vehicle pricing data if available, otherwise use packageCharge
  const vehicleSubtotal = vehiclePricingData && (vehiclePricingData as any).analysis 
    ? (vehiclePricingData as any).analysis.subtotal 
    : packageCharge;
  
  const subtotal = roundToTwo(vehicleSubtotal + offeringCharge);

  const discountAmount = useMemo(() => {
    if (!selectedDiscount || subtotal <= 0) return 0;
    let amount = 0;

    if (selectedDiscount.type === DiscountType.PERCENTAGE) {
      amount = (selectedDiscount.value / 100) * subtotal;
    } else {
      amount = selectedDiscount.value;
    }

    return roundToTwo(Math.min(amount, subtotal));
  }, [selectedDiscount, subtotal]);

  const total = roundToTwo(subtotal - discountAmount);

  const pricingLineItems = useMemo(() => {
    const items: Array<{ id: string; label: string; amount: number; helper?: string }> = [];

    // Show pricing breakdown using the actual API response format (applicablePricings array)
    if (vehiclePricingData && (vehiclePricingData as any).applicablePricings) {
      const pricings = (vehiclePricingData as any).applicablePricings;
      
      pricings.forEach((pricing: any, index: number) => {
        if (pricing.rateType && pricing.applicableUnits > 0) {
          const isHourly = pricing.rateType === 'HOURLY';
          const unitText = isHourly 
            ? `${pricing.applicableUnits} ${pricing.applicableUnits === 1 ? 'hour' : 'hours'}`
            : `${pricing.applicableUnits} ${pricing.applicableUnits === 1 ? t('booking.form.daySingular') : t('booking.form.dayPlural')}`;
          
          const rateLabel = pricing.category || pricing.rateType;
          
          items.push({
            id: `vehicle-pricing-${index}`,
            label: `Vehicle Rate [${rateLabel}]`,
            amount: roundToTwo(pricing.lineTotal),
            helper: `${unitText} × ${formatCurrency(pricing.rate)}${isHourly ? '/hr' : '/day'}`,
          });
        }
      });
    } else if (vehiclePricingData) {
      // Try the new summary-based format
      const summaries = [
        { key: 'weekdayDailySummary', data: vehiclePricingData.weekdayDailySummary },
        { key: 'weekendDailySummary', data: vehiclePricingData.weekendDailySummary },
        { key: 'weekdayHourlySummary', data: vehiclePricingData.weekdayHourlySummary },
        { key: 'weekendHourlySummary', data: vehiclePricingData.weekendHourlySummary },
        { key: 'holidayDailySummary', data: vehiclePricingData.holidayDailySummary },
        { key: 'holidayHourlySummary', data: vehiclePricingData.holidayHourlySummary },
      ];

      summaries.forEach(({ key, data }) => {
        if (data && data.units > 0) {
          const isHourly = data.category.toLowerCase().includes('hourly');
          const unitText = isHourly 
            ? `${data.units} ${data.units === 1 ? 'hour' : 'hours'}`
            : `${data.units} ${data.units === 1 ? t('booking.form.daySingular') : t('booking.form.dayPlural')}`;
          
          items.push({
            id: `vehicle-pricing-${key}`,
            label: `Vehicle Rate [${data.category}]`,
            amount: roundToTwo(data.subtotal),
            helper: `${unitText} × ${formatCurrency(data.unitRate)}${isHourly ? '/hr' : '/day'}`,
          });
        }
      });
    }

    // Apply package modifier if selected (works for both formats)
    if (vehiclePricingData && formState.packageId && packageModifier !== 1) {
      const modifierAmount = vehicleBaseCharge * (packageModifier - 1);
      const percentLabel = `${Math.round(packageModifier * 100)}%`;
      
      items.push({
        id: 'package-modifier',
        label: selectedPackage?.name || 'Package Adjustment',
        amount: roundToTwo(modifierAmount),
        helper: `${percentLabel} ${t('booking.form.summary.packageModifierSuffix')}`,
      });
    }
    
    // Fallback when no pricing data available
    if (!vehiclePricingData && packageCharge > 0) {
      const helperParts: string[] = [];
      if (computedTotalDays > 0) {
        helperParts.push(durationDisplay);
      }
      if (formState.packageId && packageModifier !== 1) {
        helperParts.push(`${Math.round(packageModifier * 100)}% ${t('booking.form.summary.packageModifierSuffix')}`);
      }

      items.push({
        id: 'package-charge',
        label: selectedPackage?.name || t('booking.form.summary.vehicleRateFallback'),
        amount: packageCharge,
        helper: helperParts.join(' • '),
      });
    }

    offeringChargeResult.billableLines.forEach((line) => {
      items.push({
        id: `offering-${line.id}`,
        label: line.label,
        amount: roundToTwo(line.amount),
        helper: `${line.quantity} × ${formatCurrency(line.unitPrice)}`,
      });
    });

    return items;
  }, [
    vehiclePricingData,
    computedTotalDays,
    formState.packageId,
    packageCharge,
    packageModifier,
    vehicleBaseCharge,
    offeringChargeResult.billableLines,
    selectedPackage?.name,
    durationDisplay,
    t,
    formatCurrency,
  ]);

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

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const normalizedPayload = {
        ...payload,
        packageId: payload.packageId ?? undefined,
        discountId: payload.discountId ?? undefined,
      };

      return hateoasClient.create<Booking>('bookings', normalizedPayload);
    },
    onSuccess: (booking: Booking) => {
      toast({
        title: t('booking.form.notifications.createSuccessTitle'),
        description: t('booking.form.notifications.createSuccessDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      if (booking.id) {
        router.push(`/bookings/${booking.id}`);
      } else {
        router.push('/bookings');
      }
    },
    onError: (error: Error) => {
      toast({
        title: t('booking.form.notifications.createErrorTitle'),
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
        // Logistic coverage: pickup and dropoff locations required
        return !!formState.pickupLocation && !!formState.dropoffLocation;
      case 2:
        // Pricing overview: always can proceed
        return true;
      default:
        return true;
    }
  }, [currentStep, formState, computedTotalDays]);

  const handleNext = () => {
    if (canProceed() && currentStep < STEPS.length - 1) {
      setValidatedSteps((prev) => new Set(prev).add(currentStep));
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
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

    createMutation.mutate({
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
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/bookings">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t('booking.form.pageTitle.create')}</h1>
          <p className="text-muted-foreground">{t('booking.form.pageSubtitle.create')}</p>
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
        // Prevent Enter key from submitting form unless explicitly on submit button
        if (e.key === 'Enter' && e.target !== e.currentTarget) {
          const target = e.target as HTMLElement;
          // Only allow Enter on submit button
          if (target.tagName !== 'BUTTON' || currentStep < STEPS.length - 1) {
            e.preventDefault();
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

          {/* Step 1: Logistic Coverage */}
          {currentStep === 1 && (
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

          {/* Step 2: Pricing Overview */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('booking.form.sections.pricing')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Booking Date Range */}
                {dateRangeDisplay && (
                  <div className="rounded-md bg-primary/5 p-3 border border-primary/20">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Rental Period</span>
                      <span className="font-medium text-primary">{dateRangeDisplay}</span>
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{durationDisplay}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('booking.form.summary.durationHint')}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">{t('booking.form.summary.billDetails')}</h4>
                  <div className="space-y-3 rounded-md border bg-muted/30 p-3">
                    {pricingLineItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t('booking.form.summary.billPlaceholder')}
                      </p>
                    ) : (
                      pricingLineItems.map((item) => (
                        <div key={item.id} className="flex items-start justify-between gap-4 text-sm">
                          <div>
                            <p className="font-medium">{item.label}</p>
                            {item.helper && (
                              <p className="text-xs text-muted-foreground">{item.helper}</p>
                            )}
                          </div>
                          <span className="font-medium">{formatCurrency(item.amount)}</span>
                        </div>
                      ))
                    )}
                  </div>
                  {includedOfferingNames.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {`${t('booking.form.summary.includedPrefix')}: ${includedOfferingNames.join(', ')}`}
                    </p>
                  )}
                </div>

                <div className="space-y-1 rounded-md bg-muted/20 p-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{t('booking.form.summary.subtotal')}</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{discountLabelWithDescriptor}</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-base font-semibold">
                    <span>{t('booking.form.summary.total')}</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 justify-between mt-8">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button type="button" variant="outline" onClick={handlePrevious}>
                {t('booking.form.navigation.previous')}
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentStep < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
              >
                {t('booking.form.navigation.next')}
              </Button>
            ) : (
              <Button type="submit" disabled={createMutation.isPending || !canProceed()}>
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                {createMutation.isPending ? t('common.saving') : t('booking.form.submit.create')}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
