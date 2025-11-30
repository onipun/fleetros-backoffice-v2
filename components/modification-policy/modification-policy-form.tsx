/**
 * Modification Policy Form Component
 * For creating and editing modification policies
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
    CreateModificationPolicyRequest,
    DEFAULT_POLICY_VALUES,
    LOYALTY_TIERS,
    LoyaltyTier,
} from '@/types/modification-policy';
import { Info } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';

export interface ModificationPolicyFormState extends CreateModificationPolicyRequest {
  id?: number;
}

interface ModificationPolicyFormProps {
  initialData?: Partial<ModificationPolicyFormState>;
  submitting?: boolean;
  submitLabel: string;
  onCancelHref: string;
  onSubmit: (values: ModificationPolicyFormState) => void;
}

const defaultValues: ModificationPolicyFormState = {
  policyName: '',
  description: '',
  loyaltyTier: null,
  ...DEFAULT_POLICY_VALUES,
} as ModificationPolicyFormState;

export function ModificationPolicyForm({
  initialData,
  submitting = false,
  submitLabel,
  onCancelHref,
  onSubmit,
}: ModificationPolicyFormProps) {
  const { t } = useLocale();
  const [formState, setFormState] = useState<ModificationPolicyFormState>({
    ...defaultValues,
    ...initialData,
  });

  useEffect(() => {
    setFormState({ ...defaultValues, ...initialData });
  }, [initialData]);

  const handleChange = (updates: Partial<ModificationPolicyFormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Validation
    if (!formState.policyName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Policy name is required',
        variant: 'destructive',
      });
      return;
    }

    if (formState.policyName.length > 100) {
      toast({
        title: 'Validation Error',
        description: 'Policy name must not exceed 100 characters',
        variant: 'destructive',
      });
      return;
    }

    if (formState.description && formState.description.length > 1000) {
      toast({
        title: 'Validation Error',
        description: 'Description must not exceed 1000 characters',
        variant: 'destructive',
      });
      return;
    }

    if (formState.freeModificationHours < 0) {
      toast({
        title: 'Validation Error',
        description: 'Free modification hours must be at least 0',
        variant: 'destructive',
      });
      return;
    }

    if (formState.lateModificationFee < 0) {
      toast({
        title: 'Validation Error',
        description: 'Late modification fee must be at least 0',
        variant: 'destructive',
      });
      return;
    }

    if (formState.categoryChangeFee < 0) {
      toast({
        title: 'Validation Error',
        description: 'Category change fee must be at least 0',
        variant: 'destructive',
      });
      return;
    }

    if (formState.locationChangeFee < 0) {
      toast({
        title: 'Validation Error',
        description: 'Location change fee must be at least 0',
        variant: 'destructive',
      });
      return;
    }

    if (formState.maxDateChangeDays < 0) {
      toast({
        title: 'Validation Error',
        description: 'Max date change days must be at least 0',
        variant: 'destructive',
      });
      return;
    }

    if (formState.majorModificationPriceThresholdPercent < 0) {
      toast({
        title: 'Validation Error',
        description: 'Major modification price threshold must be at least 0',
        variant: 'destructive',
      });
      return;
    }

    if (formState.majorModificationDateThresholdDays < 0) {
      toast({
        title: 'Validation Error',
        description: 'Major modification date threshold must be at least 0',
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
          <CardDescription>Define the policy name and description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="policyName">
              Policy Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="policyName"
              value={formState.policyName}
              onChange={(e) => handleChange({ policyName: e.target.value })}
              placeholder="e.g., Standard Modification Policy"
              maxLength={100}
              required
            />
            <p className="text-xs text-muted-foreground">
              Maximum 100 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formState.description || ''}
              onChange={(e) => handleChange({ description: e.target.value })}
              placeholder="Describe the policy purpose and benefits..."
              rows={3}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              Maximum 1000 characters (optional)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="loyaltyTier">Loyalty Tier</Label>
            <Select
              value={formState.loyaltyTier || 'null'}
              onValueChange={(value) =>
                handleChange({ loyaltyTier: value === 'null' ? null : (value as LoyaltyTier) })
              }
            >
              <SelectTrigger id="loyaltyTier">
                <SelectValue placeholder="Select tier (null = default for all)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="null">Default (All Customers)</SelectItem>
                {LOYALTY_TIERS.map((tier) => (
                  <SelectItem key={tier} value={tier}>
                    {tier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                Leave as 'Default' for all customers, or select a specific loyalty tier for tier-based policies
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modification Windows & Fees */}
      <Card>
        <CardHeader>
          <CardTitle>Modification Windows & Fees</CardTitle>
          <CardDescription>Configure free modification period and late fees</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="freeModificationHours">
                Free Modification Hours <span className="text-red-500">*</span>
              </Label>
              <Input
                id="freeModificationHours"
                type="number"
                min="0"
                step="1"
                value={formState.freeModificationHours}
                onChange={(e) =>
                  handleChange({ freeModificationHours: parseInt(e.target.value, 10) || 0 })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Hours before pickup when modifications are free
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lateModificationFee">
                Late Modification Fee <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lateModificationFee"
                type="number"
                min="0"
                step="0.01"
                value={formState.lateModificationFee}
                onChange={(e) =>
                  handleChange({ lateModificationFee: parseFloat(e.target.value) || 0 })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Fee charged for late modifications
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change-Specific Fees */}
      <Card>
        <CardHeader>
          <CardTitle>Change-Specific Fees</CardTitle>
          <CardDescription>Fees for specific types of modifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="categoryChangeFee">
                Category Change Fee <span className="text-red-500">*</span>
              </Label>
              <Input
                id="categoryChangeFee"
                type="number"
                min="0"
                step="0.01"
                value={formState.categoryChangeFee}
                onChange={(e) =>
                  handleChange({ categoryChangeFee: parseFloat(e.target.value) || 0 })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Fee for changing vehicle category
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationChangeFee">
                Location Change Fee <span className="text-red-500">*</span>
              </Label>
              <Input
                id="locationChangeFee"
                type="number"
                min="0"
                step="0.01"
                value={formState.locationChangeFee}
                onChange={(e) =>
                  handleChange({ locationChangeFee: parseFloat(e.target.value) || 0 })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Fee for changing pickup/return location
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Allowed Modifications */}
      <Card>
        <CardHeader>
          <CardTitle>Allowed Modifications</CardTitle>
          <CardDescription>Control what can be modified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="allowVehicleChange"
              checked={formState.allowVehicleChange}
              onCheckedChange={(checked) =>
                handleChange({ allowVehicleChange: checked as boolean })
              }
            />
            <Label htmlFor="allowVehicleChange" className="font-normal cursor-pointer">
              Allow Vehicle/Category Change
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="allowDateChange"
              checked={formState.allowDateChange}
              onCheckedChange={(checked) =>
                handleChange({ allowDateChange: checked as boolean })
              }
            />
            <Label htmlFor="allowDateChange" className="font-normal cursor-pointer">
              Allow Date Change
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="allowLocationChange"
              checked={formState.allowLocationChange}
              onCheckedChange={(checked) =>
                handleChange({ allowLocationChange: checked as boolean })
              }
            />
            <Label htmlFor="allowLocationChange" className="font-normal cursor-pointer">
              Allow Location Change
            </Label>
          </div>

          {formState.allowDateChange && (
            <div className="space-y-2 mt-4">
              <Label htmlFor="maxDateChangeDays">
                Maximum Date Change Days <span className="text-red-500">*</span>
              </Label>
              <Input
                id="maxDateChangeDays"
                type="number"
                min="0"
                step="1"
                value={formState.maxDateChangeDays}
                onChange={(e) =>
                  handleChange({ maxDateChangeDays: parseInt(e.target.value, 10) || 0 })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Maximum days booking can be extended
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Major Modification Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>Major Modification Thresholds</CardTitle>
          <CardDescription>Define what constitutes a major modification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="majorModificationPriceThresholdPercent">
                Price Threshold (%) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="majorModificationPriceThresholdPercent"
                type="number"
                min="0"
                step="0.01"
                value={formState.majorModificationPriceThresholdPercent}
                onChange={(e) =>
                  handleChange({
                    majorModificationPriceThresholdPercent: parseFloat(e.target.value) || 0,
                  })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Price change % that triggers major modification
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="majorModificationDateThresholdDays">
                Date Threshold (Days) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="majorModificationDateThresholdDays"
                type="number"
                min="0"
                step="1"
                value={formState.majorModificationDateThresholdDays}
                onChange={(e) =>
                  handleChange({
                    majorModificationDateThresholdDays: parseInt(e.target.value, 10) || 0,
                  })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Date change days that trigger major modification
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
