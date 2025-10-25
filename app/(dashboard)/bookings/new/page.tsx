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

  const offerings = useMemo(() => {
    if (!offeringsData) return [] as Offering[];
    return parseHalResource<Offering>(offeringsData, 'offerings');
  }, [offeringsData]);

  const offeringById = useMemo(() => {
    const map = new Map<number, Offering>();
    offerings.forEach((offering) => {
      if (offering.id != null) {
        map.set(offering.id, offering);
      }
    });
    return map;
  }, [offerings]);

  const { data: pricingsData } = useQuery({
    queryKey: ['pricings', 'booking-form'],
    queryFn: async () => hateoasClient.getCollection<Pricing>('pricings', { page: 0, size: 200 }),
  });

  const pricingRecords = useMemo(() => {
    if (!pricingsData) return [] as Pricing[];
    return parseHalResource<Pricing>(pricingsData, 'pricings');
  }, [pricingsData]);

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

  const computedTotalDays = useMemo(() => {
    if (!formState.startDate || !formState.endDate) return 0;
    const start = new Date(formState.startDate);
    const end = new Date(formState.endDate);
    const diff = end.getTime() - start.getTime();
    if (Number.isNaN(diff) || diff <= 0) return 0;
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [formState.startDate, formState.endDate]);

  const pickLatestPricing = useCallback((records: Pricing[]) => {
    if (records.length === 0) return undefined;
    return [...records].sort((a, b) => {
      const aTime = a.validFrom ? new Date(a.validFrom).getTime() : 0;
      const bTime = b.validFrom ? new Date(b.validFrom).getTime() : 0;
      return bTime - aTime;
    })[0];
  }, []);

  const vehiclePricing = useMemo(() => {
    if (!formState.vehicleId) return undefined;
    return pickLatestPricing(pricingRecords.filter((pricing) => pricing.vehicleId === formState.vehicleId));
  }, [formState.vehicleId, pickLatestPricing, pricingRecords]);

  const packagePricing = useMemo(() => {
    if (!formState.packageId) return undefined;
    return pickLatestPricing(pricingRecords.filter((pricing) => pricing.packageId === formState.packageId));
  }, [formState.packageId, pickLatestPricing, pricingRecords]);

  const offeringPricingMap = useMemo(() => {
    const map = new Map<number, Pricing>();
    pricingRecords.forEach((pricing) => {
      if (pricing.offeringId == null) return;
      const current = map.get(pricing.offeringId);
      if (!current) {
        map.set(pricing.offeringId, pricing);
        return;
      }
      const currentTime = current.validFrom ? new Date(current.validFrom).getTime() : 0;
      const nextTime = pricing.validFrom ? new Date(pricing.validFrom).getTime() : 0;
      if (nextTime > currentTime) {
        map.set(pricing.offeringId, pricing);
      }
    });
    return map;
  }, [pricingRecords]);

  const vehicleBaseCharge = roundToTwo((vehiclePricing?.baseRate ?? 0) * computedTotalDays);
  const packageModifier = selectedPackage?.priceModifier ?? 1;

  const packageCharge = useMemo(() => {
    if (computedTotalDays === 0) return 0;

    const baseVehicle = (vehiclePricing?.baseRate ?? 0) * computedTotalDays;

    if (formState.packageId) {
      if (packagePricing?.baseRate) {
        return roundToTwo(packagePricing.baseRate * computedTotalDays);
      }
      return roundToTwo(baseVehicle * packageModifier);
    }

    return roundToTwo(baseVehicle);
  }, [computedTotalDays, formState.packageId, packageModifier, packagePricing, vehiclePricing]);

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
      const pricing = offeringPricingMap.get(id);
      const unitPrice = selection.offering.price ?? pricing?.baseRate ?? 0;
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
  }, [offeringSelections, offeringPricingMap, t]);

  const offeringCharge = offeringChargeResult.total;
  const subtotal = roundToTwo(packageCharge + offeringCharge);

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

    if (packageCharge > 0) {
      const helperParts: string[] = [];
      if (computedTotalDays > 0) {
        const rateLabel =
          formState.packageId && packagePricing
            ? packagePricing.rateType
            : vehiclePricing?.rateType;
        if (rateLabel) {
          helperParts.push(`${rateLabel} × ${formatDaysLabel(computedTotalDays)}`);
        } else {
          helperParts.push(formatDaysLabel(computedTotalDays));
        }
      }
      if (formState.packageId && !packagePricing && packageModifier !== 1) {
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
    computedTotalDays,
    formState.packageId,
    packageCharge,
    packageModifier,
    packagePricing,
    offeringChargeResult.billableLines,
    selectedPackage?.name,
    vehiclePricing,
    t,
    formatCurrency,
    formatDaysLabel,
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
    [offeringById, packageIncludedIdSet]
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
        const pricing = offeringPricingMap.get(id);
        const unitPrice = roundToTwo(selection.offering.price ?? pricing?.baseRate ?? 0);
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

      <form onSubmit={handleSubmit}>
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
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('booking.form.summary.totalDays')}</span>
                    <span className="font-medium">{computedTotalDays > 0 ? computedTotalDays : '-'}</span>
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
