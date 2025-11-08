'use client';

/**
 * Booking Modification Dialog
 * 
 * Enterprise-grade modal for modifying bookings with:
 * - Step-by-step modification flow
 * - Policy information display
 * - Preview before commit
 * - Comprehensive validation
 * - Real-time pricing updates
 */

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import {
    executeModification,
    getModificationPolicy,
    previewModification,
} from '@/lib/api/booking-modification';
import { cn } from '@/lib/utils';
import type {
    Booking,
    BookingModificationResponse,
    UpdateBookingRequest
} from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AlertCircle,
    AlertTriangle,
    Calendar,
    CheckCircle,
    Clock,
    DollarSign,
    Edit3,
    Info,
    Loader2,
    MapPin,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface BookingModificationDialogProps {
  booking: Booking;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type ModificationStep = 'policy' | 'form' | 'preview' | 'confirm';

export function BookingModificationDialog({
  booking,
  open,
  onOpenChange,
  onSuccess,
}: BookingModificationDialogProps) {
  const { formatCurrency } = useLocale();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState<ModificationStep>('policy');
  const [modificationForm, setModificationForm] = useState({
    startDate: booking.startDate || '',
    endDate: booking.endDate || '',
    pickupLocation: booking.pickupLocation || '',
    dropoffLocation: booking.dropoffLocation || '',
    modificationReason: '',
  });
  const [previewData, setPreviewData] = useState<BookingModificationResponse | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStep('policy');
      setModificationForm({
        startDate: booking.startDate || '',
        endDate: booking.endDate || '',
        pickupLocation: booking.pickupLocation || '',
        dropoffLocation: booking.dropoffLocation || '',
        modificationReason: '',
      });
      setPreviewData(null);
    }
  }, [open, booking]);

  // Fetch modification policy
  const { data: policy, isLoading: policyLoading } = useQuery({
    queryKey: ['booking-modification-policy', booking.id],
    queryFn: () => getModificationPolicy(booking.id!),
    enabled: open && !!booking.id,
  });

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: async (request: UpdateBookingRequest) => {
      return previewModification(booking.id!, request);
    },
    onSuccess: (data) => {
      setPreviewData(data);
      setCurrentStep('preview');
      toast({
        title: 'Preview Generated',
        description: 'Review the changes below before confirming.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Preview Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Execute mutation
  const executeMutation = useMutation({
    mutationFn: async (request: UpdateBookingRequest) => {
      return executeModification(booking.id!, request);
    },
    onSuccess: (data) => {
      toast({
        title: 'Booking Modified Successfully',
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['booking', booking.id] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking-history', booking.id] });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Modification Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleFieldChange = (field: keyof typeof modificationForm) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setModificationForm((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleDateChange = (field: 'startDate' | 'endDate') => (value: string) => {
    setModificationForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePreview = () => {
    if (!booking.vehicleId) {
      toast({
        title: 'Invalid Booking',
        description: 'Booking must have a vehicle ID',
        variant: 'destructive',
      });
      return;
    }

    if (modificationForm.modificationReason.length < 5) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a modification reason (min 5 characters)',
        variant: 'destructive',
      });
      return;
    }

    const request: UpdateBookingRequest = {
      bookingId: booking.id!,
      vehicles: [
        {
          vehicleId: booking.vehicleId,
          startDate: modificationForm.startDate,
          endDate: modificationForm.endDate,
          pickupLocation: modificationForm.pickupLocation,
          dropoffLocation: modificationForm.dropoffLocation,
        },
      ],
      modificationReason: modificationForm.modificationReason,
    };

    previewMutation.mutate(request);
  };

  const handleConfirm = () => {
    if (!previewData || !booking.vehicleId) return;

    const request: UpdateBookingRequest = {
      bookingId: booking.id!,
      vehicles: [
        {
          vehicleId: booking.vehicleId,
          startDate: modificationForm.startDate,
          endDate: modificationForm.endDate,
          pickupLocation: modificationForm.pickupLocation,
          dropoffLocation: modificationForm.dropoffLocation,
        },
      ],
      modificationReason: modificationForm.modificationReason,
    };

    executeMutation.mutate(request);
  };

  const hasChanges = useMemo(() => {
    return (
      modificationForm.startDate !== booking.startDate ||
      modificationForm.endDate !== booking.endDate ||
      modificationForm.pickupLocation !== booking.pickupLocation ||
      modificationForm.dropoffLocation !== booking.dropoffLocation
    );
  }, [modificationForm, booking]);

  const canProceedToPreview = useMemo(() => {
    return (
      hasChanges &&
      modificationForm.startDate &&
      modificationForm.endDate &&
      modificationForm.pickupLocation &&
      modificationForm.dropoffLocation &&
      modificationForm.modificationReason.length >= 5 &&
      new Date(modificationForm.startDate) < new Date(modificationForm.endDate)
    );
  }, [modificationForm, hasChanges]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Modify Booking #{booking.id}
          </DialogTitle>
          <DialogDescription>
            Update booking details. Changes will be previewed before confirmation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-between">
            {(['policy', 'form', 'preview', 'confirm'] as ModificationStep[]).map((step, index) => (
              <div
                key={step}
                className={cn(
                  'flex items-center gap-2',
                  index < ['policy', 'form', 'preview', 'confirm'].indexOf(currentStep) && 'opacity-50'
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold',
                    currentStep === step
                      ? 'border-primary bg-primary text-primary-foreground'
                      : index < ['policy', 'form', 'preview', 'confirm'].indexOf(currentStep)
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-muted-foreground bg-muted'
                  )}
                >
                  {index < ['policy', 'form', 'preview', 'confirm'].indexOf(currentStep) ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="hidden text-sm font-medium sm:inline">
                  {step === 'policy' && 'Policy'}
                  {step === 'form' && 'Details'}
                  {step === 'preview' && 'Preview'}
                  {step === 'confirm' && 'Confirm'}
                </span>
              </div>
            ))}
          </div>

          {/* Policy Step */}
          {currentStep === 'policy' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Modification Policy
                </CardTitle>
                <CardDescription>Review the modification policy before proceeding</CardDescription>
              </CardHeader>
              <CardContent>
                {policyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : policy ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <h4 className="font-semibold mb-2">{policy.policyName}</h4>
                      <p className="text-sm text-muted-foreground mb-4">{policy.description}</p>
                      
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Free Modification Window</p>
                            <p className="text-sm text-muted-foreground">
                              {policy.freeModificationHours} hours before pickup
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <DollarSign className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Late Modification Fee</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(policy.lateModificationFee)} ({policy.feeType})
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Hours Until Pickup</p>
                            <p className="text-sm text-muted-foreground">
                              {policy.hoursUntilPickup} hours
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          {policy.isFreeModification ? (
                            <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 mt-0.5 text-orange-600" />
                          )}
                          <div>
                            <p className="text-sm font-medium">Estimated Fee</p>
                            <p className={cn(
                              "text-sm font-semibold",
                              policy.isFreeModification ? "text-green-600" : "text-orange-600"
                            )}>
                              {policy.isFreeModification ? 'FREE' : formatCurrency(policy.estimatedFee)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className={cn(
                      "rounded-lg border p-3 flex items-start gap-2",
                      policy.isFreeModification
                        ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20"
                        : "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20"
                    )}>
                      <Info className={cn(
                        "h-5 w-5 mt-0.5",
                        policy.isFreeModification ? "text-green-600" : "text-orange-600"
                      )} />
                      <p className="text-sm">
                        {policy.contextMessage}
                      </p>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">Allowed Changes:</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        {policy.allowDateChange && <li>Date changes</li>}
                        {policy.allowVehicleChange && <li>Vehicle changes</li>}
                        {policy.allowLocationChange && <li>Location changes</li>}
                        {!policy.allowDateChange && !policy.allowVehicleChange && !policy.allowLocationChange && (
                          <li className="text-destructive">No modifications allowed</li>
                        )}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                    <div>
                      <p className="font-semibold text-destructive">Policy Not Available</p>
                      <p className="text-sm text-muted-foreground">
                        Unable to load modification policy. Please try again.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Form Step */}
          {currentStep === 'form' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5" />
                  Modification Details
                </CardTitle>
                <CardDescription>Update booking information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date & Time</Label>
                    <DateTimePicker
                      value={modificationForm.startDate}
                      onChange={handleDateChange('startDate')}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date & Time</Label>
                    <DateTimePicker
                      value={modificationForm.endDate}
                      onChange={handleDateChange('endDate')}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pickupLocation">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Pickup Location
                  </Label>
                  <Input
                    id="pickupLocation"
                    value={modificationForm.pickupLocation}
                    onChange={handleFieldChange('pickupLocation')}
                    placeholder="Enter pickup location"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dropoffLocation">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Dropoff Location
                  </Label>
                  <Input
                    id="dropoffLocation"
                    value={modificationForm.dropoffLocation}
                    onChange={handleFieldChange('dropoffLocation')}
                    placeholder="Enter dropoff location"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="modificationReason">
                    Reason for Modification <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="modificationReason"
                    value={modificationForm.modificationReason}
                    onChange={handleFieldChange('modificationReason')}
                    placeholder="Please provide a reason for this modification (minimum 5 characters)"
                    rows={3}
                    className={cn(
                      modificationForm.modificationReason.length > 0 &&
                      modificationForm.modificationReason.length < 5 &&
                      "border-destructive"
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    {modificationForm.modificationReason.length}/5 characters minimum
                  </p>
                </div>
                
                {!hasChanges && (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20 p-3 flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">No Changes Detected</p>
                      <p className="text-xs text-muted-foreground">
                        Please modify at least one field to proceed.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Preview Step */}
          {currentStep === 'preview' && previewData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Modification Preview
                </CardTitle>
                <CardDescription>Review changes before confirming</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Changed Fields */}
                {previewData.changedFields && previewData.changedFields.length > 0 && (
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <h4 className="font-semibold mb-2">Changed Fields</h4>
                    <div className="flex flex-wrap gap-2">
                      {previewData.changedFields.map((field) => (
                        <span
                          key={field}
                          className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Pricing Comparison */}
                <div className="rounded-lg border p-4 space-y-3">
                  <h4 className="font-semibold">Pricing Changes</h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Previous Amount:</span>
                      <span className="font-medium">{formatCurrency(previewData.previousAmount ?? 0)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">New Amount:</span>
                      <span className="font-medium">{formatCurrency(previewData.newAmount ?? 0)}</span>
                    </div>
                    
                    {(previewData.modificationFee ?? 0) > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Modification Fee:</span>
                        <span className="font-medium text-orange-600">
                          {formatCurrency(previewData.modificationFee ?? 0)}
                        </span>
                      </div>
                    )}
                    
                    <div className="border-t pt-2 flex items-center justify-between">
                      <span className="font-semibold">Total Adjustment:</span>
                      <span className={cn(
                        "text-lg font-bold",
                        (previewData.totalAdjustment ?? 0) > 0 ? "text-orange-600" :
                        (previewData.totalAdjustment ?? 0) < 0 ? "text-green-600" :
                        ""
                      )}>
                        {(previewData.totalAdjustment ?? 0) > 0 ? '+' : ''}
                        {formatCurrency(previewData.totalAdjustment ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Payment Action */}
                {previewData.paymentAdjustment && previewData.paymentAdjustment.adjustmentType !== 'NO_CHANGE' && (() => {
                  // Determine if charge or refund based on both adjustmentType AND amount sign as failsafe
                  const isCharge = previewData.paymentAdjustment.adjustmentType === 'CHARGE' || 
                                   (previewData.paymentAdjustment.amount ?? 0) > 0;
                  const isRefund = previewData.paymentAdjustment.adjustmentType === 'REFUND' || 
                                   (previewData.paymentAdjustment.amount ?? 0) < 0;
                  
                  return (
                    <div className={cn(
                      "rounded-lg border p-4",
                      isCharge
                        ? "border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/20"
                        : "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20"
                    )}>
                      <div className="flex items-start gap-2">
                        {isCharge ? (
                          <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-semibold mb-1">
                            {isCharge
                              ? 'Additional Payment Required'
                              : 'Refund Will Be Issued'}
                          </p>
                          <p className="text-2xl font-bold mb-2">
                            {formatCurrency(Math.abs(previewData.paymentAdjustment.amount ?? 0))}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {previewData.paymentAdjustment.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
                
                {/* New Pricing Details */}
                {previewData.newPricingDetails && previewData.newPricingDetails.vehicles && previewData.newPricingDetails.vehicles.length > 0 && (
                  <div className="rounded-lg border p-4">
                    <h4 className="font-semibold mb-3">Updated Pricing Details</h4>
                    {previewData.newPricingDetails.vehicles.map((vehicle, index) => (
                      <div key={index} className="space-y-2 mb-3 last:mb-0">
                        <p className="text-sm font-medium">{vehicle.vehicleName}</p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>
                            {new Date(vehicle.startDate).toLocaleDateString()} -{' '}
                            {new Date(vehicle.endDate).toLocaleDateString()}
                          </p>
                          <p>
                            {vehicle.daysRented} days × {formatCurrency(vehicle.dailyRate)}/day
                          </p>
                          <p className="font-semibold text-foreground">
                            Total: {formatCurrency(vehicle.total)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <div>
            {currentStep !== 'policy' && (
              <Button
                variant="outline"
                onClick={() => {
                  if (currentStep === 'form') setCurrentStep('policy');
                  if (currentStep === 'preview') setCurrentStep('form');
                }}
              >
                Back
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            
            {currentStep === 'policy' && (
              <Button onClick={() => setCurrentStep('form')}>
                Continue
              </Button>
            )}
            
            {currentStep === 'form' && (
              <Button
                onClick={handlePreview}
                disabled={!canProceedToPreview || previewMutation.isPending}
              >
                {previewMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Preview...
                  </>
                ) : (
                  'Preview Changes'
                )}
              </Button>
            )}
            
            {currentStep === 'preview' && (
              <Button
                onClick={handleConfirm}
                disabled={executeMutation.isPending}
              >
                {executeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirm Modification
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
