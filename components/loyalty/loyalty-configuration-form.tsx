/**
 * Loyalty Configuration Form Component
 * For creating and editing loyalty tier configurations
 */
'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import {
    CreateLoyaltyConfigurationRequest,
    DEFAULT_LOYALTY_CONFIG_VALUES,
    LOYALTY_TIERS,
    LoyaltyTier,
} from '@/types/modification-policy';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';

export interface LoyaltyConfigurationFormState extends CreateLoyaltyConfigurationRequest {
  id?: number;
}

interface LoyaltyConfigurationFormProps {
  initialData?: Partial<LoyaltyConfigurationFormState>;
  submitting?: boolean;
  submitLabel: string;
  onCancelHref: string;
  onSubmit: (values: LoyaltyConfigurationFormState) => void;
}

const defaultValues: LoyaltyConfigurationFormState = {
  tier: 'BRONZE',
  displayName: '',
  minimumRentalsPerYear: 0,
  maximumRentalsPerYear: null,
  pointsPerCurrencyUnit: 1.0,
  ...DEFAULT_LOYALTY_CONFIG_VALUES,
} as LoyaltyConfigurationFormState;

export function LoyaltyConfigurationForm({
  initialData,
  submitting = false,
  submitLabel,
  onCancelHref,
  onSubmit,
}: LoyaltyConfigurationFormProps) {
  const { t } = useLocale();
  const [formState, setFormState] = useState<LoyaltyConfigurationFormState>({
    ...defaultValues,
    ...initialData,
  });

  useEffect(() => {
    setFormState({ ...defaultValues, ...initialData });
  }, [initialData]);

  const handleChange = (updates: Partial<LoyaltyConfigurationFormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Validation
    if (!formState.tier) {
      toast({
        title: 'Validation Error',
        description: 'Loyalty tier is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formState.displayName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Display name is required',
        variant: 'destructive',
      });
      return;
    }

    if (formState.minimumRentalsPerYear < 0) {
      toast({
        title: 'Validation Error',
        description: 'Minimum rentals per year must be at least 0',
        variant: 'destructive',
      });
      return;
    }

    // Check if maximum rentals is empty for non-PLATINUM tiers
    if (formState.maximumRentalsPerYear === null && formState.tier !== 'PLATINUM') {
      toast({
        title: 'Validation Error',
        description: 'Only PLATINUM tier can have unlimited maximum rentals. Please set a maximum value.',
        variant: 'destructive',
      });
      return;
    }

    if (
      formState.maximumRentalsPerYear !== null &&
      formState.maximumRentalsPerYear !== undefined &&
      formState.maximumRentalsPerYear < formState.minimumRentalsPerYear
    ) {
      toast({
        title: 'Validation Error',
        description: 'Maximum rentals must be greater than or equal to minimum rentals',
        variant: 'destructive',
      });
      return;
    }

    if (formState.pointsPerCurrencyUnit < 0) {
      toast({
        title: 'Validation Error',
        description: 'Points per currency unit must be at least 0',
        variant: 'destructive',
      });
      return;
    }

    if ((formState.bookingCompletionBonus || 0) < 0) {
      toast({
        title: 'Validation Error',
        description: 'Booking completion bonus must be at least 0',
        variant: 'destructive',
      });
      return;
    }

    if ((formState.tierDiscountPercentage || 0) < 0) {
      toast({
        title: 'Validation Error',
        description: 'Tier discount percentage must be at least 0',
        variant: 'destructive',
      });
      return;
    }

    if ((formState.freeAdditionalDriverDays || 0) < 0) {
      toast({
        title: 'Validation Error',
        description: 'Free additional driver days must be at least 0',
        variant: 'destructive',
      });
      return;
    }

    if (
      formState.guaranteedAvailability &&
      formState.guaranteedAvailabilityHours &&
      formState.guaranteedAvailabilityHours < 0
    ) {
      toast({
        title: 'Validation Error',
        description: 'Guaranteed availability hours must be at least 0',
        variant: 'destructive',
      });
      return;
    }

    onSubmit(formState);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Define the tier and display information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tier">
              Loyalty Tier <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formState.tier}
              onValueChange={(value) =>
                handleChange({ tier: value as Exclude<LoyaltyTier, null> })
              }
            >
              <SelectTrigger id="tier">
                <SelectValue placeholder="Select tier" />
              </SelectTrigger>
              <SelectContent>
                {LOYALTY_TIERS.map((tier) => (
                  <SelectItem key={tier} value={tier}>
                    {tier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">
              Display Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="displayName"
              value={formState.displayName}
              onChange={(e) => handleChange({ displayName: e.target.value })}
              placeholder="e.g., Bronze Member, Silver Elite"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formState.description || ''}
              onChange={(e) => handleChange({ description: e.target.value })}
              placeholder="Describe the tier benefits and eligibility..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tier Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Tier Requirements</CardTitle>
          <CardDescription>Define eligibility criteria for this tier</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minimumRentalsPerYear">
                Minimum Rentals Per Year <span className="text-red-500">*</span>
              </Label>
              <Input
                id="minimumRentalsPerYear"
                type="number"
                min="0"
                step="1"
                value={formState.minimumRentalsPerYear}
                onChange={(e) =>
                  handleChange({ minimumRentalsPerYear: parseInt(e.target.value, 10) || 0 })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maximumRentalsPerYear">Maximum Rentals Per Year</Label>
              <Input
                id="maximumRentalsPerYear"
                type="number"
                min="0"
                step="1"
                value={formState.maximumRentalsPerYear ?? ''}
                onChange={(e) =>
                  handleChange({
                    maximumRentalsPerYear: e.target.value ? parseInt(e.target.value, 10) : null,
                  })
                }
                placeholder="Leave empty for unlimited"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for PLATINUM tier only (no maximum)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Points & Rewards */}
      <Card>
        <CardHeader>
          <CardTitle>Points & Rewards</CardTitle>
          <CardDescription>Configure points earning and bonuses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pointsPerCurrencyUnit">
                Points Per Currency Unit <span className="text-red-500">*</span>
              </Label>
              <Input
                id="pointsPerCurrencyUnit"
                type="number"
                min="0"
                step="0.01"
                value={formState.pointsPerCurrencyUnit}
                onChange={(e) =>
                  handleChange({ pointsPerCurrencyUnit: parseFloat(e.target.value) || 0 })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                e.g., 1.5 means 150 points per 100 currency
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bookingCompletionBonus">Booking Completion Bonus</Label>
              <Input
                id="bookingCompletionBonus"
                type="number"
                min="0"
                step="1"
                value={formState.bookingCompletionBonus || 0}
                onChange={(e) =>
                  handleChange({ bookingCompletionBonus: parseInt(e.target.value, 10) || 0 })
                }
              />
              <p className="text-xs text-muted-foreground">
                Bonus points awarded upon booking completion
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Premium Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Premium Benefits</CardTitle>
          <CardDescription>Enable special benefits for this tier</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="priorityCheckIn"
              checked={formState.priorityCheckIn || false}
              onCheckedChange={(checked) =>
                handleChange({ priorityCheckIn: checked as boolean })
              }
            />
            <Label htmlFor="priorityCheckIn" className="font-normal cursor-pointer">
              Priority Check-In Service
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="freeUpgrade"
              checked={formState.freeUpgrade || false}
              onCheckedChange={(checked) =>
                handleChange({ freeUpgrade: checked as boolean })
              }
            />
            <Label htmlFor="freeUpgrade" className="font-normal cursor-pointer">
              Free Car Upgrades (subject to availability)
            </Label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="guaranteedAvailability"
                checked={formState.guaranteedAvailability || false}
                onCheckedChange={(checked) => {
                  handleChange({ 
                    guaranteedAvailability: checked as boolean,
                    guaranteedAvailabilityHours: checked ? formState.guaranteedAvailabilityHours || 24 : null
                  });
                }}
              />
              <Label htmlFor="guaranteedAvailability" className="font-normal cursor-pointer">
                Guaranteed Vehicle Availability
              </Label>
            </div>

            {formState.guaranteedAvailability && (
              <div className="ml-6 space-y-2">
                <Label htmlFor="guaranteedAvailabilityHours">
                  Guaranteed Hours Before Pickup
                </Label>
                <Input
                  id="guaranteedAvailabilityHours"
                  type="number"
                  min="0"
                  step="1"
                  value={formState.guaranteedAvailabilityHours ?? 24}
                  onChange={(e) =>
                    handleChange({
                      guaranteedAvailabilityHours: parseInt(e.target.value, 10) || null,
                    })
                  }
                  placeholder="e.g., 24, 48"
                />
                <p className="text-xs text-muted-foreground">
                  Hours before pickup when availability is guaranteed
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Discounts & Perks */}
      <Card>
        <CardHeader>
          <CardTitle>Discounts & Perks</CardTitle>
          <CardDescription>Additional tier benefits and discounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tierDiscountPercentage">Tier Discount Percentage (%)</Label>
              <Input
                id="tierDiscountPercentage"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formState.tierDiscountPercentage || 0}
                onChange={(e) =>
                  handleChange({ tierDiscountPercentage: parseFloat(e.target.value) || 0 })
                }
              />
              <p className="text-xs text-muted-foreground">
                Base discount applied to all bookings
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="freeAdditionalDriverDays">Free Additional Driver Days</Label>
              <Input
                id="freeAdditionalDriverDays"
                type="number"
                min="0"
                step="1"
                value={formState.freeAdditionalDriverDays || 0}
                onChange={(e) =>
                  handleChange({ freeAdditionalDriverDays: parseInt(e.target.value, 10) || 0 })
                }
              />
              <p className="text-xs text-muted-foreground">
                Number of free additional driver days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" asChild>
          <Link href={onCancelHref}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
