'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { hateoasClient } from '@/lib/api/hateoas-client';
import type { Vehicle, VehicleStatus } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditVehiclePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const vehicleId = params.id as string;

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({
        title: 'Success',
        description: 'Vehicle updated successfully',
      });
      router.push(`/vehicles/${vehicleId}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
        <p className="text-muted-foreground">Loading vehicle details...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <p className="text-destructive">Vehicle not found</p>
        <Link href="/vehicles">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vehicles
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href={`/vehicles/${vehicleId}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Vehicle</h1>
          <p className="text-muted-foreground">Update vehicle information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Vehicle Name *</Label>
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
                  <Label htmlFor="status">Status *</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="RENTED">Rented</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="RETIRED">Retired</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licensePlate">License Plate *</Label>
                  <Input
                    id="licensePlate"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleChange}
                    placeholder="ABC123"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vin">VIN *</Label>
                  <Input
                    id="vin"
                    name="vin"
                    value={formData.vin}
                    onChange={handleChange}
                    placeholder="1HGBH41JXMN109186"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="odometer">Odometer (km) *</Label>
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
              <CardTitle>Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="make">Make *</Label>
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
                  <Label htmlFor="model">Model *</Label>
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
                  <Label htmlFor="year">Year *</Label>
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
                  <Label htmlFor="fuelType">Fuel Type *</Label>
                  <select
                    id="fuelType"
                    name="fuelType"
                    value={formData.fuelType}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                  <Label htmlFor="transmissionType">Transmission *</Label>
                  <select
                    id="transmissionType"
                    name="transmissionType"
                    value={formData.transmissionType}
                    onChange={handleChange}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

          {/* Rental Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Rental Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bufferMinutes">Buffer Minutes</Label>
                  <Input
                    id="bufferMinutes"
                    name="bufferMinutes"
                    type="number"
                    value={formData.bufferMinutes}
                    onChange={handleChange}
                    min="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Time buffer between rentals
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minRentalHours">Minimum Rental Hours</Label>
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
                  <Label htmlFor="maxRentalDays">Maximum Rental Days</Label>
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
                  <Label htmlFor="maxFutureBookingDays">Max Future Booking Days</Label>
                  <Input
                    id="maxFutureBookingDays"
                    name="maxFutureBookingDays"
                    type="number"
                    value={formData.maxFutureBookingDays}
                    onChange={handleChange}
                    min="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    How far ahead customers can book
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="details">Description</Label>
                <Textarea
                  id="details"
                  name="details"
                  value={formData.details}
                  onChange={handleChange}
                  placeholder="Additional information about the vehicle..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-end">
            <Link href={`/vehicles/${vehicleId}`}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Updating...' : 'Update Vehicle'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
