'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TagInput } from '@/components/ui/tag-input';
import type { PricingFormData } from '@/lib/validations/schemas';
import { DollarSign } from 'lucide-react';
import { useState } from 'react';

export type { PricingFormData } from '@/lib/validations/schemas';

interface PricingPanelProps {
  initialData?: PricingFormData;
  onDataChange?: (data: PricingFormData) => void;
  readOnly?: boolean;
  showValidity?: boolean;
  existingTags?: string[]; // Tags from previous pricing entries
  entityInfo?: {
    type: string; // e.g., "Vehicle", "Package", "Offering"
    id: string | number;
    name?: string;
  };
}

export function PricingPanel({
  initialData,
  onDataChange,
  readOnly = false,
  showValidity = true,
  existingTags = [],
  entityInfo,
}: PricingPanelProps) {
  const [formData, setFormData] = useState<PricingFormData>(
    initialData || {
      baseRate: 0,
      rateType: 'Daily',
      depositAmount: 0,
      minimumRentalDays: 1,
      validFrom: '',
      validTo: '',
      tags: [],
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
          Set the pricing details for this {entityInfo ? entityInfo.type.toLowerCase() : 'entity'}
        </p>
        {entityInfo && (
          <div className="mt-3 p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-muted-foreground">Connected to:</span>
              <span className="font-semibold">{entityInfo.type}</span>
              <span className="text-muted-foreground">•</span>
              <span className="font-medium">
                {entityInfo.name || `ID: ${entityInfo.id}`}
              </span>
            </div>
          </div>
        )}
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
              <option value="Hourly">Hourly</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Flat">Flat Rate</option>
            </select>
            <p className="text-xs text-muted-foreground">
              How the base rate is calculated
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseRate">Base Rate (MYR) *</Label>
            <CurrencyInput
              id="baseRate"
              value={formData.baseRate}
              onChange={(value) => handleChange({ baseRate: value })}
              disabled={readOnly}
              required
            />
            <p className="text-xs text-muted-foreground">
              Base rental rate per {formData.rateType.toLowerCase()} period
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="depositAmount">Deposit Amount (MYR) *</Label>
            <CurrencyInput
              id="depositAmount"
              value={formData.depositAmount}
              onChange={(value) => handleChange({ depositAmount: value })}
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
                <DateTimePicker
                  id="validFrom"
                  value={formData.validFrom}
                  onChange={(value) => handleChange({ validFrom: value })}
                  disabled={readOnly}
                />
                <p className="text-xs text-muted-foreground">
                  Start date and time for this pricing
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="validTo">Valid To *</Label>
                <DateTimePicker
                  id="validTo"
                  value={formData.validTo}
                  onChange={(value) => handleChange({ validTo: value })}
                  disabled={readOnly}
                />
                <p className="text-xs text-muted-foreground">
                  End date and time for this pricing
                </p>
              </div>
            </>
          )}

          {/* Tags Input */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="tags">Tags (Optional)</Label>
            <TagInput
              value={formData.tags || []}
              onChange={(tags) => handleChange({ tags })}
              placeholder="Add tags to categorize this pricing..."
              suggestions={existingTags}
              disabled={readOnly}
            />
            <p className="text-xs text-muted-foreground">
              Use tags like "seasonal", "weekend", "holiday", "early-bird", etc.
            </p>
          </div>
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
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-col gap-1 pt-2 border-t">
                <span className="text-muted-foreground">Tags:</span>
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
