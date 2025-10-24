'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PricingFormData } from '@/lib/validations/schemas';
import { DollarSign } from 'lucide-react';
import { useState } from 'react';

export type { PricingFormData } from '@/lib/validations/schemas';

interface PricingPanelProps {
  initialData?: PricingFormData;
  onDataChange?: (data: PricingFormData) => void;
  readOnly?: boolean;
  showValidity?: boolean;
}

export function PricingPanel({
  initialData,
  onDataChange,
  readOnly = false,
  showValidity = true,
}: PricingPanelProps) {
  const [formData, setFormData] = useState<PricingFormData>(
    initialData || {
      baseRate: 0,
      rateType: 'DAILY',
      depositAmount: 0,
      minimumRentalDays: 1,
      validFrom: '',
      validTo: '',
    }
  );

  const handleChange = (updates: Partial<PricingFormData>) => {
    const newData = { ...formData, ...updates };
    setFormData(newData);
    onDataChange?.(newData);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <CardTitle>Pricing Configuration</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Set the pricing details for this offering or package
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rateType">Rate Type *</Label>
            <select
              id="rateType"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.rateType}
              onChange={(e) => handleChange({ rateType: e.target.value })}
              disabled={readOnly}
              required
            >
              <option value="HOURLY">Hourly</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="FLAT">Flat Rate</option>
            </select>
            <p className="text-xs text-muted-foreground">
              How the base rate is calculated
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseRate">Base Rate (MYR) *</Label>
            <Input
              id="baseRate"
              type="number"
              min="0"
              step="0.01"
              value={formData.baseRate}
              onChange={(e) => handleChange({ baseRate: parseFloat(e.target.value) || 0 })}
              disabled={readOnly}
              required
            />
            <p className="text-xs text-muted-foreground">
              Base rental rate per {formData.rateType.toLowerCase()} period
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="depositAmount">Deposit Amount (MYR) *</Label>
            <Input
              id="depositAmount"
              type="number"
              min="0"
              step="0.01"
              value={formData.depositAmount}
              onChange={(e) => handleChange({ depositAmount: parseFloat(e.target.value) || 0 })}
              disabled={readOnly}
              required
            />
            <p className="text-xs text-muted-foreground">
              Security deposit required
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minimumRentalDays">Minimum Rental Period *</Label>
            <Input
              id="minimumRentalDays"
              type="number"
              min="1"
              value={formData.minimumRentalDays}
              onChange={(e) => handleChange({ minimumRentalDays: parseInt(e.target.value) || 1 })}
              disabled={readOnly}
              required
            />
            <p className="text-xs text-muted-foreground">
              Minimum rental period
            </p>
          </div>

          {showValidity && (
            <>
              <div className="space-y-2">
                <Label htmlFor="validFrom">Valid From *</Label>
                <Input
                  id="validFrom"
                  type="datetime-local"
                  value={formData.validFrom}
                  onChange={(e) => handleChange({ validFrom: e.target.value })}
                  disabled={readOnly}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Start date and time for this pricing
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="validTo">Valid To *</Label>
                <Input
                  id="validTo"
                  type="datetime-local"
                  value={formData.validTo}
                  onChange={(e) => handleChange({ validTo: e.target.value })}
                  disabled={readOnly}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  End date and time for this pricing
                </p>
              </div>
            </>
          )}
        </div>

        <div className="rounded-lg border bg-muted/50 p-4">
          <h4 className="text-sm font-medium mb-2">Pricing Summary</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rate Type:</span>
              <span className="font-medium">{formData.rateType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base Rate:</span>
              <span className="font-medium">MYR {formData.baseRate.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deposit:</span>
              <span className="font-medium">MYR {formData.depositAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min Period:</span>
              <span className="font-medium">{formData.minimumRentalDays}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
