'use client';

import { MultiPricingPanel } from '@/components/pricing/multi-pricing-panel';
import { type PricingFormData } from '@/components/pricing/pricing-panel';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Stepper } from '@/components/ui/stepper';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useVehicleDraft } from '@/hooks/use-vehicle-draft';
import { hateoasClient } from '@/lib/api/hateoas-client';
import { usePricingTags } from '@/lib/api/hooks';
import type { Vehicle, VehicleStatus } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Save, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const STEPS = [
  { id: 'vehicleInfo' },
  { id: 'specification' },
  { id: 'rentalSetting' },
  { id: 'additionalDetail' },
  { id: 'pricingConfig' },
];

export default function NewVehiclePage() {
  const { t } = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [validatedSteps, setValidatedSteps] = useState<Set<number>>(new Set());
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState<string>('');
  const [errorDetails, setErrorDetails] = useState<Record<string, string> | null>(null);
  const { hasDraft, isChecking, saveDraft, loadDraft, clearDraft, getDraftTimestamp } = useVehicleDraft();
  
  // Fetch existing tags for autocomplete
  const { data: existingTags = [] } = usePricingTags();
  
  const [formData, setFormData] = useState<Partial<Vehicle>>({
    name: '',
    status: 'AVAILABLE' as VehicleStatus,
    licensePlate: '',
    vin: '',
    odometer: 0,
    make: '',
    model: '',
    year: new Date().getFullYear(),
    fuelType: 'Gasoline',
    transmissionType: 'Automatic',
    carType: '',
    seaterCount: 0,
    bufferMinutes: 30,
    minRentalHours: 24,
    maxRentalDays: 30,
    maxFutureBookingDays: 90,
    details: '',
  });

  const [pricingsData, setPricingsData] = useState<PricingFormData[]>([]);

  // Check for existing draft on mount
  useEffect(() => {
    if (!isChecking && hasDraft) {
      setShowDraftDialog(true);
    }
  }, [isChecking, hasDraft]);

  const handleContinueDraft = () => {
    const draft = loadDraft();
    if (draft) {
      setFormData(draft.formData);
      // Support both old single pricing and new multiple pricings format
      setPricingsData((draft as any).pricingsData || (draft.pricingData ? [draft.pricingData] : []));
      setCurrentStep(draft.currentStep);
    }
    setShowDraftDialog(false);
  };

  const handleStartFresh = () => {
    clearDraft();
    setShowDraftDialog(false);
  };

  const createMutation = useMutation({
    mutationFn: async (vehicleData: Partial<Vehicle>) => {
      return await hateoasClient.create<Vehicle>('vehicles', vehicleData);
    },
    onSuccess: async (createdVehicle) => {
      // Create multiple pricing entries if provided
      const validPricings = pricingsData.filter(p => p.baseRate > 0 && p.validFrom && p.validTo);
      
      if (validPricings.length > 0) {
        let successCount = 0;
        let failCount = 0;
        
        for (const pricing of validPricings) {
          try {
            await hateoasClient.create('pricings', {
              ...pricing,
              vehicleId: createdVehicle.id,
            });
            successCount++;
          } catch (error) {
            console.error('Failed to create pricing:', error);
            failCount++;
          }
        }
        
        // Show appropriate toast based on results
        if (failCount === 0) {
          toast({
            variant: 'success',
            title: t('common.success'),
            description: t('pricing.multiPricing.createMultipleSuccess').replace('{count}', successCount.toString()),
          });
        } else if (successCount > 0) {
          toast({
            title: t('common.warning'),
            description: t('pricing.multiPricing.createMultiplePartialSuccess')
              .replace('{success}', successCount.toString())
              .replace('{total}', validPricings.length.toString())
              .replace('{failed}', failCount.toString()),
            variant: 'destructive',
          });
        } else {
          toast({
            title: t('common.error'),
            description: t('pricing.multiPricing.createMultipleError'),
            variant: 'destructive',
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      clearDraft();
      
      if (validPricings.length === 0) {
        toast({
          variant: 'success',
          title: t('common.success'),
          description: t('vehicle.createSuccess'),
        });
      }
      
      router.push('/vehicles');
    },
    onError: (error: any) => {
      console.error('Vehicle creation error:', error);
      
      // Extract error title and message
      let displayMessage = error.message || t('vehicle.createError');
      let errorTitle = error.error || t('common.error');
      let detailsMap: Record<string, string> | null = null;
      
      // Check if error has details object
      if (error.details) {
        const details = error.details;
        
        // If details is an object with key-value pairs (field validation errors)
        if (typeof details === 'object' && !Array.isArray(details)) {
          detailsMap = {};
          Object.keys(details).forEach((key) => {
            if (typeof details[key] === 'string') {
              detailsMap![key] = details[key];
            } else if (details[key] && typeof details[key] === 'object') {
              detailsMap![key] = JSON.stringify(details[key]);
            }
          });
          
          // If we have field errors, update the title
          if (Object.keys(detailsMap).length > 0) {
            errorTitle = t('vehicle.validationError');
          }
        }
        // Check for violations array (field validation errors)
        else if (details.violations && Array.isArray(details.violations)) {
          detailsMap = {};
          details.violations.forEach((v: any) => {
            detailsMap![v.field] = v.message;
          });
          errorTitle = t('vehicle.validationError');
        }
        // Check for errors array
        else if (details.errors && Array.isArray(details.errors)) {
          displayMessage = details.errors
            .map((e: any) => typeof e === 'string' ? e : e.message || JSON.stringify(e))
            .join(', ');
        }
        // If details is a string, use it directly
        else if (typeof details === 'string') {
          displayMessage = details;
        }
      }
      
      // Set error data for display in UI
      setErrorMessage(displayMessage);
      setErrorTitle(errorTitle);
      setErrorDetails(detailsMap);
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    // Clear error message when user starts editing
    if (errorMessage) {
      setErrorMessage(null);
      setErrorTitle('');
      setErrorDetails(null);
    }
    
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'number'
          ? value === ''
            ? ''
            : Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // CRITICAL: Only allow submission on the last step
    if (currentStep !== STEPS.length - 1) {
      console.warn('Form submission blocked - not on final step');
      return;
    }
    
    // Validate all required steps before submission
    if (!validateStep(0) || !validateStep(1)) {
      toast({
        title: t('common.error'),
        description: t('vehicle.pleaseFillRequired'),
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        return !!formData.name && !!formData.licensePlate && !!formData.status;
      case 1:
        return !!formData.make && !!formData.model && !!formData.year;
      case 2:
        return true; // Optional fields
      case 3:
        return true; // Optional fields
      case 4:
        return true; // Pricing is optional
      default:
        return true;
    }
  };

  const canProceed = () => {
    return validateStep(currentStep);
  };

  const handleNext = (e?: React.MouseEvent) => {
    // Prevent any form submission
    e?.preventDefault();
    e?.stopPropagation();
    
    if (!validateStep(currentStep)) {
      // Don't show toast, just prevent navigation
      return;
    }
    
    // Mark current step as validated
    setValidatedSteps((prev) => new Set(prev).add(currentStep));
    
    if (currentStep < STEPS.length - 1) {
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
    // Mark current step as validated if it passes validation
    if (validateStep(currentStep)) {
      setValidatedSteps((prev) => new Set(prev).add(currentStep));
    }
    
    // Allow free navigation to any step
    setCurrentStep(index);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/vehicles">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t('vehicle.addNewVehicle')}</h1>
          <p className="text-muted-foreground">{t('vehicle.createNewVehicleInFleet')}</p>
        </div>
      </div>

      <Stepper
        steps={STEPS.map((step) => ({
          id: step.id,
          title: t(`vehicle.steps.${step.id}` as any),
          description: t(`vehicle.steps.${step.id}Desc` as any),
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
          {/* Step 0: Vehicle Information */}
          {currentStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('vehicle.basicInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('vehicle.vehicleName')} *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Tesla Model 3 Premium"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">{t('vehicle.status')} *</Label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="AVAILABLE">{t('vehicle.available')}</option>
                      <option value="RENTED">{t('vehicle.rented')}</option>
                      <option value="MAINTENANCE">{t('vehicle.maintenance')}</option>
                      <option value="OUT_OF_SERVICE">{t('vehicle.outOfService')}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="licensePlate">{t('vehicle.licensePlate')} *</Label>
                    <Input
                      id="licensePlate"
                      name="licensePlate"
                      value={formData.licensePlate}
                      onChange={handleChange}
                      placeholder="ABC-1234"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vin">{t('vehicle.vin')}</Label>
                    <Input
                      id="vin"
                      name="vin"
                      value={formData.vin}
                      onChange={handleChange}
                      placeholder="1HGBH41JXMN109186"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="odometer">{t('vehicle.odometer')}</Label>
                    <Input
                      id="odometer"
                      name="odometer"
                      type="number"
                      value={formData.odometer}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 1: Specifications */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('vehicle.specifications')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="make">{t('vehicle.make')} *</Label>
                    <Input
                      id="make"
                      name="make"
                      value={formData.make}
                      onChange={handleChange}
                      placeholder="Tesla"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">{t('vehicle.model')} *</Label>
                    <Input
                      id="model"
                      name="model"
                      value={formData.model}
                      onChange={handleChange}
                      placeholder="Model 3"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year">{t('vehicle.year')} *</Label>
                    <Input
                      id="year"
                      name="year"
                      type="number"
                      value={formData.year}
                      onChange={handleChange}
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fuelType">{t('vehicle.fuelType')} *</Label>
                    <select
                      id="fuelType"
                      name="fuelType"
                      value={formData.fuelType}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="Gasoline">Gasoline</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Electric">Electric</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Plug-in Hybrid">Plug-in Hybrid</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="carType">{t('vehicle.carTypeLabel')} *</Label>
                    <select
                      id="carType"
                      name="carType"
                      value={formData.carType || ''}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="">{t('vehicle.selectCarTypeRequired')}</option>
                      <option value="SEDAN">{t('vehicle.carType.sedan')}</option>
                      <option value="SUV">{t('vehicle.carType.suv')}</option>
                      <option value="HATCHBACK">{t('vehicle.carType.hatchback')}</option>
                      <option value="COUPE">{t('vehicle.carType.coupe')}</option>
                      <option value="CONVERTIBLE">{t('vehicle.carType.convertible')}</option>
                      <option value="WAGON">{t('vehicle.carType.wagon')}</option>
                      <option value="VAN">{t('vehicle.carType.van')}</option>
                      <option value="PICKUP">{t('vehicle.carType.pickup')}</option>
                      <option value="LUXURY">{t('vehicle.carType.luxury')}</option>
                      <option value="SPORTS">{t('vehicle.carType.sports')}</option>
                      <option value="ELECTRIC">{t('vehicle.carType.electric')}</option>
                      <option value="HYBRID">{t('vehicle.carType.hybrid')}</option>
                      <option value="MOTORCYCLE">{t('vehicle.carType.motorcycle')}</option>
                      <option value="OTHER">{t('vehicle.carType.other')}</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seaterCount">{t('vehicle.seaterCount')} *</Label>
                    <Input
                      id="seaterCount"
                      name="seaterCount"
                      type="number"
                      value={formData.seaterCount || ''}
                      onChange={handleChange}
                      placeholder="e.g., 5"
                      min="1"
                      max="20"
                      required
                    />
                    <p className="text-xs text-muted-foreground">{t('vehicle.seaterCountHint')}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transmissionType">{t('vehicle.transmissionType')} *</Label>
                    <select
                      id="transmissionType"
                      name="transmissionType"
                      value={formData.transmissionType}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="Automatic">Automatic</option>
                      <option value="Manual">Manual</option>
                      <option value="CVT">CVT</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Rental Settings */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('vehicle.rentalSettings')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="bufferMinutes">{t('vehicle.bufferMinutes')}</Label>
                    <Input
                      id="bufferMinutes"
                      name="bufferMinutes"
                      type="number"
                      value={formData.bufferMinutes}
                      onChange={handleChange}
                      min="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('vehicle.bufferMinutesHelp')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minRentalHours">{t('vehicle.minRentalHours')}</Label>
                    <Input
                      id="minRentalHours"
                      name="minRentalHours"
                      type="number"
                      value={formData.minRentalHours}
                      onChange={handleChange}
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxRentalDays">{t('vehicle.maxRentalDays')}</Label>
                    <Input
                      id="maxRentalDays"
                      name="maxRentalDays"
                      type="number"
                      value={formData.maxRentalDays}
                      onChange={handleChange}
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxFutureBookingDays">{t('vehicle.maxFutureBookingDays')}</Label>
                    <Input
                      id="maxFutureBookingDays"
                      name="maxFutureBookingDays"
                      type="number"
                      value={formData.maxFutureBookingDays}
                      onChange={handleChange}
                      min="1"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t('vehicle.maxFutureBookingDaysHelp')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Additional Details */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('vehicle.additionalDetails')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="details">{t('common.description')}</Label>
                  <Textarea
                    id="details"
                    name="details"
                    value={formData.details}
                    onChange={handleChange}
                    placeholder="Additional information about the vehicle..."
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Pricing Configuration */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <MultiPricingPanel
                onDataChange={setPricingsData}
                existingTags={existingTags}
                entityInfo={{
                  type: 'Vehicle',
                  id: 'New',
                  name: formData.name || 'New Vehicle',
                }}
              />
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 justify-between mt-8">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button type="button" variant="outline" onClick={(e) => handlePrevious(e)}>
                {t('vehicle.navigation.previous')}
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                saveDraft({
                  formData,
                  pricingData: pricingsData[0], // For backwards compatibility
                  pricingsData, // Save all pricings
                  currentStep,
                  timestamp: Date.now(),
                } as any);
                toast({
                  variant: 'success',
                  title: t('vehicle.draft.savedAsDraft'),
                  description: t('vehicle.draft.draftSavedMessage'),
                });
              }}
            >
              <Save className="mr-2 h-4 w-4" />
              {t('vehicle.navigation.saveDraft')}
            </Button>
            
            {currentStep < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={(e) => handleNext(e)}
                disabled={!canProceed()}
              >
                {t('vehicle.navigation.next')}
              </Button>
            ) : (
              <Button type="submit" disabled={createMutation.isPending || !canProceed()}>
                {createMutation.isPending ? t('vehicle.navigation.creating') : t('vehicle.navigation.createVehicle')}
              </Button>
            )}
          </div>
        </div>
      </form>

      {/* Draft Dialog */}
      <Dialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('vehicle.draft.unsavedChanges')}</DialogTitle>
            <DialogDescription>
              {t('vehicle.draft.unsavedMessage')}
              {getDraftTimestamp() && (
                <div className="mt-2 text-xs">
                  {t('vehicle.draft.lastSaved')}: {getDraftTimestamp()?.toLocaleString()}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleStartFresh}>
              {t('vehicle.draft.startFresh')}
            </Button>
            <Button onClick={handleContinueDraft}>
              {t('vehicle.draft.continueEditing')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Professional Error Notification - Bottom Center */}
      {errorMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-xl border border-red-200 bg-white shadow-2xl dark:border-red-900 dark:bg-gray-950">
              {/* Header */}
              <div className="flex items-center justify-between gap-4 border-b border-red-100 bg-red-50 px-6 py-4 dark:border-red-900 dark:bg-red-950/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-900 dark:text-red-100">
                      {errorTitle || t('common.error')}
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      {errorMessage}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setErrorMessage(null);
                    setErrorTitle('');
                    setErrorDetails(null);
                  }}
                  className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Error Details */}
              {errorDetails && Object.keys(errorDetails).length > 0 && (
                <div className="px-6 py-4">
                  <div className="space-y-2">
                    {Object.entries(errorDetails).map(([field, message]) => (
                      <div
                        key={field}
                        className="flex items-start gap-3 rounded-lg bg-red-50/50 px-4 py-3 dark:bg-red-950/20"
                      >
                        <div className="mt-0.5 h-2 w-2 rounded-full bg-red-500 dark:bg-red-400" />
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-100 capitalize">
                            {field.replace(/([A-Z])/g, ' $1').trim()}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
