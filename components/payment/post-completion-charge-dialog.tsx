'use client';

/**
 * Post-Completion Charge Dialog
 * 
 * A dialog component for adding charges after a booking is completed:
 * - Damage charges
 * - Fuel charges
 * - Traffic/parking fines
 * - Cleaning fees
 * - Late fees
 * - Toll charges
 * - Admin fees
 * 
 * Based on PAYMENT_SETTLEMENT_API_GUIDE.md
 */

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
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
    PAYMENT_METHODS,
    recordManualPayment,
    type ManualPaymentRequest,
    type ManualPaymentResponse,
    type PaymentMethodType,
} from '@/lib/api/manual-payment';
import {
    getPostCompletionChargeTypes,
    type TransactionType
} from '@/types/settlement';
import { useMutation } from '@tanstack/react-query';
import {
    AlertTriangle,
    Loader2,
    Plus,
    Receipt
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface PostCompletionChargeDialogProps {
  bookingId: number;
  bookingStatus?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (response: ManualPaymentResponse) => void;
}

export function PostCompletionChargeDialog({
  bookingId,
  bookingStatus,
  open,
  onOpenChange,
  onSuccess,
}: PostCompletionChargeDialogProps) {
  const { formatCurrency } = useLocale();

  // Check if booking is completed
  const isCompleted = bookingStatus === 'COMPLETED';

  // Post-completion charge types
  const chargeTypes = getPostCompletionChargeTypes();

  // Form state
  const [amount, setAmount] = useState('');
  const [chargeType, setChargeType] = useState<TransactionType>('DAMAGE_CHARGE');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('OTHER');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Get selected charge type info
  const selectedChargeInfo = chargeTypes.find((t) => t.value === chargeType);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setAmount('');
      setChargeType('DAMAGE_CHARGE');
      setPaymentMethod('OTHER');
      setReferenceNumber('');
      setNotes('');
    }
  }, [open]);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const request: ManualPaymentRequest = {
        amount: parseFloat(amount),
        paymentMethod,
        transactionType: chargeType,
        isPostCompletion: true,
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
      };

      return recordManualPayment(bookingId, request);
    },
    onSuccess: (response) => {
      toast({
        title: 'Charge Added',
        description: `${selectedChargeInfo?.label || 'Charge'} of ${formatCurrency(parseFloat(amount))} added successfully`,
      });
      onOpenChange(false);
      onSuccess?.(response);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Add Charge',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Validate form
  const isValid = () => {
    const amountValue = parseFloat(amount);
    return !isNaN(amountValue) && amountValue > 0 && chargeType;
  };

  // Show warning if booking is not completed
  if (!isCompleted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Cannot Add Post-Completion Charge
            </DialogTitle>
            <DialogDescription>
              Post-completion charges can only be added to completed bookings.
              Current booking status: <strong>{bookingStatus}</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Post-Completion Charge
          </DialogTitle>
          <DialogDescription>
            Add a charge to booking #{bookingId} after completion (e.g., damage, fines, fuel)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Charge Type */}
          <div className="space-y-2">
            <Label htmlFor="chargeType">
              Charge Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={chargeType}
              onValueChange={(v) => setChargeType(v as TransactionType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select charge type" />
              </SelectTrigger>
              <SelectContent>
                {chargeTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedChargeInfo && (
              <p className="text-xs text-muted-foreground">
                {selectedChargeInfo.description}
              </p>
            )}
          </div>

          {/* Quick Charge Type Selection */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Quick Select:</Label>
            <div className="flex flex-wrap gap-2">
              {chargeTypes.slice(0, 6).map((type) => (
                <Button
                  key={type.value}
                  type="button"
                  variant={chargeType === type.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChargeType(type.value)}
                >
                  <span className="mr-1">{type.icon}</span>
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                MYR
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className="pl-14"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Payment Method (how they will pay) */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Expected Payment Method</Label>
            <Select
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethodType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    <span className="flex items-center gap-2">
                      <span>{method.icon}</span>
                      <span>{method.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reference Number */}
          <div className="space-y-2">
            <Label htmlFor="referenceNumber">Reference Number</Label>
            <Input
              id="referenceNumber"
              placeholder="Fine number, damage report ID, etc."
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Details</Label>
            <Textarea
              id="notes"
              placeholder="Describe the charge details..."
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Info Box */}
          <div className="rounded-lg border bg-amber-50 dark:bg-amber-950/30 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Post-Completion Charge
                </p>
                <p className="text-amber-700 dark:text-amber-300 mt-1">
                  This charge will be added to the booking&apos;s settlement. The customer will be 
                  notified and the balance will be updated accordingly.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={!isValid() || submitMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Receipt className="mr-2 h-4 w-4" />
                Add Charge
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
