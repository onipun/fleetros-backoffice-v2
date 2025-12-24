'use client';

import { MultiPricingPanel } from '@/components/pricing/multi-pricing-panel';
import { type PricingFormData } from '@/components/pricing/pricing-panel';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VehiclePricingList } from '@/components/vehicle/vehicle-pricing-list';
import { toast } from '@/hooks/use-toast';
import { hateoasClient } from '@/lib/api/hateoas-client';
import { usePricingTags } from '@/lib/api/hooks';
import { preventEnterSubmission } from '@/lib/form-utils';
import type { Vehicle, VehicleStatus } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function EditVehiclePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const vehicleId = params.id as string;
  const { t } = useLocale();
  
  // Fetch existing tags for autocomplete
  const { data: existingTags = [] } = usePricingTags();

  const [formData, setFormData] = useState<Partial<Vehicle>>({
    name: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    vin: '',
    odometer: 0,
    fuelType: 'Gasoline',
    transmissionType: 'Automatic',
    status: 'AVAILABLE' as VehicleStatus,
    details: '',
    bufferMinutes: 30,
    minRentalHours: 24,
    maxRentalDays: 30,
    maxFutureBookingDays: 90,
  });

  const [pricingsData, setPricingsData] = useState<PricingFormData[]>([]);

  const statusOptions = useMemo(
    () => [
      { value: 'AVAILABLE' as VehicleStatus, label: t('vehicle.available') },
      { value: 'RENTED' as VehicleStatus, label: t('vehicle.rented') },
      { value: 'MAINTENANCE' as VehicleStatus, label: t('vehicle.maintenance') },
      { value: 'RETIRED' as VehicleStatus, label: t('vehicle.retired') },
    ],
    [t],
  );

  const fuelTypeOptions = useMemo(
    () => [
      { value: 'Gasoline', label: t('vehicle.fuelTypes.gasoline') },
      { value: 'Diesel', label: t('vehicle.fuelTypes.diesel') },
      { value: 'Electric', label: t('vehicle.fuelTypes.electric') },
      { value: 'Hybrid', label: t('vehicle.fuelTypes.hybrid') },
      { value: 'Plug-in Hybrid', label: t('vehicle.fuelTypes.plugInHybrid') },
    ],
    [t],
  );

  const transmissionOptions = useMemo(
    () => [
      { value: 'Automatic', label: t('vehicle.transmissions.automatic') },
      { value: 'Manual', label: t('vehicle.transmissions.manual') },
      { value: 'CVT', label: t('vehicle.transmissions.cvt') },
    ],
    [t],
  );

  // Fetch vehicle details
  const { data: vehicle, isLoading } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: async () => {
      return hateoasClient.getResource<Vehicle>('vehicles', vehicleId);
    },
  });

  // Populate form when vehicle data is loaded
  useEffect(() => {
    if (vehicle) {
      setFormData({
        name: vehicle.name,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        licensePlate: vehicle.licensePlate,
        vin: vehicle.vin,
        odometer: vehicle.odometer,
        fuelType: vehicle.fuelType,
        transmissionType: vehicle.transmissionType,
        carType: vehicle.carType,
        seaterCount: vehicle.seaterCount,
        status: vehicle.status,
        details: vehicle.details || '',
        bufferMinutes: vehicle.bufferMinutes ?? 30,
        minRentalHours: vehicle.minRentalHours ?? 24,
        maxRentalDays: vehicle.maxRentalDays ?? 30,
        maxFutureBookingDays: vehicle.maxFutureBookingDays ?? 90,
      });
    }
  }, [vehicle]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Vehicle>) => {
      return hateoasClient.update<Vehicle>('vehicles', vehicleId, data);
    },
    onSuccess: async () => {
      // Create multiple pricing entries if provided
      // Pricing is valid if baseRate > 0 AND (neverExpires OR has date range)
      const validPricings = pricingsData.filter(p => p.baseRate > 0 && (p.neverExpires || (p.validFrom && p.validTo)));
      
      if (validPricings.length > 0) {
        let successCount = 0;
        let failCount = 0;
        
        for (const pricing of validPricings) {
          try {
            const pricingPayload = {
              vehicleId: Number(vehicleId),
              vehicle: `/api/vehicles/${vehicleId}`,
              baseRate: Number(pricing.baseRate),
              rateType: pricing.rateType,
              depositAmount: Number(pricing.depositAmount),
              minimumRentalDays: Number(pricing.minimumRentalDays),
              validFrom: pricing.validFrom,
              validTo: pricing.validTo,
              isDefault: Boolean(pricing.isDefault),
              ...(pricing.tags && pricing.tags.length > 0 && { tagNames: pricing.tags }),
            };
            
            console.log('Creating pricing with payload:', JSON.stringify(pricingPayload, null, 2));
            await hateoasClient.create('pricings', pricingPayload);
            successCount++;
          } catch (error) {
            console.error('Failed to create pricing:', error);
            failCount++;
          }
        }
        
        // Invalidate ALL related queries AFTER pricing creation
        await queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId] });
        await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        await queryClient.invalidateQueries({ queryKey: ['pricings'] });
        
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
      } else {
        // No pricing entries, just show vehicle update success
        await queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId] });
        await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
        
        toast({
          variant: 'success',
          title: t('common.success'),
          description: t('toast.updateSuccess'),
        });
      }
      
      // Small delay to let user see the toast before navigating
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Force a hard refresh by navigating and then reloading
      router.push(`/vehicles/${vehicleId}`);
      router.refresh();
    },
    onError: (error: Error) => {
      console.error('Vehicle update failed:', error);
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Updating vehicle with pricings data:', pricingsData);
    updateMutation.mutate(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">{t('vehicle.loadingDetails')}</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <p className="text-destructive">{t('vehicle.vehicleNotFound')}</p>
        <Link href="/vehicles">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('vehicle.backToVehicles')}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href={`/vehicles/${vehicleId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{t('vehicle.editVehicle')}</h1>
          <p className="text-muted-foreground">{t('vehicle.editDescription')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} onKeyDown={preventEnterSubmission}>
        <div className="grid gap-8 xl:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('vehicle.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    {t('vehicle.vehicleName')} {t('common.required')}
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t('vehicle.namePlaceholder')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">
                    {t('vehicle.status')} {t('common.required')}
                  </Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licensePlate">
                    {t('vehicle.licensePlate')} {t('common.required')}
                  </Label>
                  <Input
                    id="licensePlate"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleChange}
                    placeholder={t('vehicle.platePlaceholder')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vin">
                    {t('vehicle.vin')} ({t('common.optional')})
                  </Label>
                  <Input
                    id="vin"
                    name="vin"
                    value={formData.vin}
                    onChange={handleChange}
                    placeholder={t('vehicle.vinPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="odometer">
                    {t('vehicle.odometer')} ({t('vehicle.kilometersShort')}) {t('common.required')}
                  </Label>
                  <Input
                    id="odometer"
                    name="odometer"
                    type="number"
                    value={formData.odometer}
                    onChange={handleChange}
                    min="0"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>{t('vehicle.specifications')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="make">
                    {t('vehicle.make')} {t('common.required')}
                  </Label>
                  <Input
                    id="make"
                    name="make"
                    value={formData.make}
                    onChange={handleChange}
                    placeholder={t('vehicle.makePlaceholder')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">
                    {t('vehicle.model')} {t('common.required')}
                  </Label>
                  <Input
                    id="model"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder={t('vehicle.modelPlaceholder')}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">
                    {t('vehicle.year')} {t('common.required')}
                  </Label>
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
                  <Label htmlFor="fuelType">
                    {t('vehicle.fuelType')} {t('common.required')}
                  </Label>
                  <select
                    id="fuelType"
                    name="fuelType"
                    value={formData.fuelType}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    {fuelTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="carType">
                    {t('vehicle.carTypeLabel')} {t('common.required')}
                  </Label>
                  <select
                    id="carType"
                    name="carType"
                    value={formData.carType || ''}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  <Label htmlFor="seaterCount">
                    {t('vehicle.seaterCount')} {t('common.required')}
                  </Label>
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
                  <Label htmlFor="transmissionType">
                    {t('vehicle.transmissionType')} {t('common.required')}
                  </Label>
                  <select
                    id="transmissionType"
                    name="transmissionType"
                    value={formData.transmissionType}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    {transmissionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rental Settings */}
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

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>{t('vehicle.additionalDetails')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="details">{t('vehicle.details')}</Label>
                <Textarea
                  id="details"
                  name="details"
                  value={formData.details}
                  onChange={handleChange}
                  placeholder={t('vehicle.detailsPlaceholder')}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Existing Pricings */}
            <VehiclePricingList vehicleId={vehicleId} />
            
            <MultiPricingPanel
              onDataChange={setPricingsData}
              existingTags={existingTags}
              entityInfo={{
                type: 'Vehicle',
                id: vehicleId,
                name: vehicle?.name,
              }}
              startExpanded={false}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-end mt-8">
          <Link href={`/vehicles/${vehicleId}`}>
            <Button type="button" variant="outline" size="lg">
              {t('common.cancel')}
            </Button>
          </Link>
          <Button type="submit" disabled={updateMutation.isPending} size="lg">
            {updateMutation.isPending ? t('common.updating') : t('vehicle.updateAction')}
          </Button>
        </div>
      </form>
    </div>
  );
}
