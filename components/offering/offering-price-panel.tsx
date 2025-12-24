'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import {
    createOfferingPrice,
    deleteOfferingPrice,
    getOfferingPrices,
    updateOfferingPrice,
} from '@/lib/api/offering-price-api';
import { OfferingRateType, type OfferingPrice } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit, Plus, Save, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface OfferingPricePanelProps {
  offeringId: number;
  offeringName: string;
}

export function OfferingPricePanel({ offeringId, offeringName }: OfferingPricePanelProps) {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Validate offeringId
  if (!offeringId || isNaN(Number(offeringId))) {
    console.error('OfferingPricePanel: Invalid offeringId received:', offeringId);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pricing Rules</CardTitle>
          <CardDescription className="text-destructive">
            Unable to load pricing rules: Invalid offering ID
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const [formData, setFormData] = useState<Partial<OfferingPrice>>({
    baseRate: 0,
    rateType: OfferingRateType.DAILY,
    priority: 5,
    active: true,
    isDefault: false,
    minimumQuantity: undefined,
    maximumQuantity: undefined,
    validFrom: undefined,
    validTo: undefined,
    description: '',
  });

  // Fetch offering prices
  const { data: prices = [], isLoading } = useQuery({
    queryKey: ['offering-prices', offeringId],
    queryFn: async () => {
      console.log('Fetching offering prices for offeringId:', offeringId, 'Type:', typeof offeringId);
      const result = await getOfferingPrices(offeringId);
      console.log('Fetched offering prices:', result);
      console.log('Price IDs:', result.map(p => p.id));
      return result;
    },
    enabled: !!offeringId && !isNaN(Number(offeringId)), // Only run query if offeringId is valid
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      if (!offeringId || isNaN(Number(offeringId))) {
        throw new Error('Invalid offering ID');
      }
      return createOfferingPrice(offeringId, data as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offering-prices', offeringId] });
      toast({
        title: t('common.success'),
        description: 'Offering price created successfully',
      });
      resetForm();
      setIsAdding(false);
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<OfferingPrice> }) =>
      updateOfferingPrice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offering-prices', offeringId] });
      toast({
        title: t('common.success'),
        description: 'Offering price updated successfully',
      });
      resetForm();
      setEditingId(null);
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteOfferingPrice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offering-prices', offeringId] });
      toast({
        title: t('common.success'),
        description: 'Offering price deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      baseRate: 0,
      rateType: OfferingRateType.DAILY,
      priority: 5,
      active: true,
      isDefault: false,
      minimumQuantity: undefined,
      maximumQuantity: undefined,
      validFrom: undefined,
      validTo: undefined,
      description: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (price: OfferingPrice) => {
    setFormData({
      baseRate: price.baseRate,
      rateType: price.rateType,
      priority: price.priority,
      active: price.active,
      isDefault: price.isDefault,
      minimumQuantity: price.minimumQuantity,
      maximumQuantity: price.maximumQuantity,
      validFrom: price.validFrom,
      validTo: price.validTo,
      description: price.description,
    });
    setEditingId(price.id!);
    setIsAdding(true);
  };

  const handleDelete = (id: number | undefined) => {
    if (!id) {
      toast({
        title: t('common.error'),
        description: 'Invalid price ID',
        variant: 'destructive',
      });
      return;
    }
    if (confirm('Are you sure you want to delete this pricing rule?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCancel = () => {
    resetForm();
    setIsAdding(false);
    setEditingId(null);
  };

  const rateTypeOptions: { value: OfferingRateType; label: string }[] = [
    { value: OfferingRateType.DAILY, label: 'Daily' },
    { value: OfferingRateType.HOURLY, label: 'Hourly' },
    { value: OfferingRateType.FIXED, label: 'Fixed' },
    { value: OfferingRateType.PER_RENTAL, label: 'Per Rental' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pricing Rules for {offeringName}</CardTitle>
            <CardDescription>
              Manage flexible pricing based on dates, quantity, and priority
            </CardDescription>
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Price Rule
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add/Edit Form */}
        {isAdding && (
          <form onSubmit={handleSubmit} className="space-y-4 border-b pb-6">
            <h3 className="text-sm font-semibold">
              {editingId ? 'Edit Price Rule' : 'Add New Price Rule'}
            </h3>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="baseRate">
                  Base Rate {t('common.required')}
                </Label>
                <CurrencyInput
                  id="baseRate"
                  value={formData.baseRate || 0}
                  onChange={(value) => setFormData((prev) => ({ ...prev, baseRate: value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rateType">
                  Rate Type {t('common.required')}
                </Label>
                <select
                  id="rateType"
                  value={formData.rateType}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, rateType: e.target.value as OfferingRateType }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  {rateTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">
                  Priority {t('common.required')}
                </Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, priority: parseInt(e.target.value) || 0 }))
                  }
                  placeholder="Higher value = higher priority"
                  required
                />
                <p className="text-xs text-muted-foreground">Higher values take precedence</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minimumQuantity">Minimum Quantity</Label>
                <Input
                  id="minimumQuantity"
                  type="number"
                  min="1"
                  value={formData.minimumQuantity || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      minimumQuantity: e.target.value ? parseInt(e.target.value) : undefined,
                    }))
                  }
                  placeholder="Optional"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maximumQuantity">Maximum Quantity</Label>
                <Input
                  id="maximumQuantity"
                  type="number"
                  min="1"
                  value={formData.maximumQuantity || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      maximumQuantity: e.target.value ? parseInt(e.target.value) : undefined,
                    }))
                  }
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="validFrom">Valid From</Label>
                <DateTimePicker
                  id="validFrom"
                  value={formData.validFrom || ''}
                  onChange={(value) => setFormData((prev) => ({ ...prev, validFrom: value || undefined }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validTo">Valid To</Label>
                <DateTimePicker
                  id="validTo"
                  value={formData.validTo || ''}
                  onChange={(value) => setFormData((prev) => ({ ...prev, validTo: value || undefined }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="E.g., Weekend rate, Bulk discount, etc."
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, active: checked as boolean }))
                  }
                />
                <Label htmlFor="active" className="cursor-pointer">
                  Active
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, isDefault: checked as boolean }))
                  }
                />
                <Label htmlFor="isDefault" className="cursor-pointer">
                  Default (Fallback)
                </Label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {editingId ? 'Update' : 'Create'} Rule
              </Button>
            </div>
          </form>
        )}

        {/* Existing Prices List */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Existing Price Rules</h3>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading pricing rules...</p>
          ) : prices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No pricing rules yet. Add one to enable flexible pricing.
            </p>
          ) : (
            <div className="space-y-2">
              {prices
                .sort((a, b) => (b.priority || 0) - (a.priority || 0))
                .map((price, index) => (
                  <div
                    key={price.id || `price-${index}`}
                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">${price.baseRate}</span>
                        <span className="text-sm text-muted-foreground">/ {price.rateType}</span>
                        <span className="text-xs rounded-full bg-primary/10 px-2 py-0.5">
                          Priority: {price.priority}
                        </span>
                        {price.isDefault && (
                          <span className="text-xs rounded-full bg-blue-500/10 px-2 py-0.5 text-blue-600">
                            Default
                          </span>
                        )}
                        {!price.active && (
                          <span className="text-xs rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">
                            Inactive
                          </span>
                        )}
                      </div>
                      {price.description && (
                        <p className="text-sm text-muted-foreground">{price.description}</p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {price.minimumQuantity && <span>Min Qty: {price.minimumQuantity}</span>}
                        {price.maximumQuantity && <span>Max Qty: {price.maximumQuantity}</span>}
                        {price.validFrom && (
                          <span>From: {new Date(price.validFrom).toLocaleDateString()}</span>
                        )}
                        {price.validTo && (
                          <span>To: {new Date(price.validTo).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/offering-prices/${price.id}/edit`}>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!price.id}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(price.id)}
                        disabled={deleteMutation.isPending || !price.id}
                        title={!price.id ? 'Invalid price ID' : 'Delete price'}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
