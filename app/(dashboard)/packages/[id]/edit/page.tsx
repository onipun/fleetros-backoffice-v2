'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { hateoasClient } from '@/lib/api/hateoas-client';
import type { Package } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditPackagePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const packageId = params.id as string;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priceModifier: 0.90,
    validFrom: '',
    validTo: '',
    minRentalDays: 2,
  });

  // Fetch package details
  const { data: pkg, isLoading } = useQuery({
    queryKey: ['package', packageId],
    queryFn: async () => {
      return hateoasClient.getResource<Package>('packages', packageId);
    },
  });

  // Pre-populate form when data loads
  useEffect(() => {
    if (pkg) {
      // Format datetime for input[type="datetime-local"]
      const formatDateTime = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toISOString().slice(0, 16);
      };

      setFormData({
        name: pkg.name || '',
        description: pkg.description || '',
        priceModifier: pkg.priceModifier || 0.90,
        validFrom: formatDateTime(pkg.validFrom || ''),
        validTo: formatDateTime(pkg.validTo || ''),
        minRentalDays: pkg.minRentalDays || 2,
      });
    }
  }, [pkg]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return hateoasClient.update<Package>('packages', packageId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      queryClient.invalidateQueries({ queryKey: ['package', packageId] });
      toast({
        title: 'Success',
        description: 'Package updated successfully',
      });
      router.push('/packages');
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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Loading package...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/packages">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Package</h1>
          <p className="text-muted-foreground">Update package details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Package Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Weekend Special"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe the package benefits..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="priceModifier">Price Modifier *</Label>
                <Input
                  id="priceModifier"
                  name="priceModifier"
                  type="number"
                  step="0.01"
                  min="0"
                  max="2"
                  value={formData.priceModifier}
                  onChange={handleInputChange}
                  placeholder="0.90"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  0.90 = 10% discount, 1.00 = no change, 1.10 = 10% increase
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minRentalDays">Minimum Rental Days *</Label>
                <Input
                  id="minRentalDays"
                  name="minRentalDays"
                  type="number"
                  min="1"
                  value={formData.minRentalDays}
                  onChange={handleInputChange}
                  placeholder="2"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Validity Period */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Validity Period</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="validFrom">Valid From *</Label>
                <Input
                  id="validFrom"
                  name="validFrom"
                  type="datetime-local"
                  value={formData.validFrom}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validTo">Valid To *</Label>
                <Input
                  id="validTo"
                  name="validTo"
                  type="datetime-local"
                  value={formData.validTo}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Link href="/packages">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={updateMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateMutation.isPending ? 'Updating...' : 'Update Package'}
          </Button>
        </div>
      </form>
    </div>
  );
}
