'use client';

/**
 * Manual Payment Dialog
 * 
 * A dialog component for recording manual/offline payments for bookings.
 * Supports:
 * - Multiple payment methods (cash, bank transfer, etc.)
 * - Receipt image upload
 * - Deposit/partial payments
 * - Auto-confirmation option
 * - Transaction type selection (advance payment, deposit, etc.)
 * - Post-completion charges (damage, fines, etc.)
 * 
 * Based on PAYMENT_SETTLEMENT_API_GUIDE.md
 */

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
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
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import {
    getPaymentMethodInfo,
    getPaymentStatusColor,
    getPaymentSummary,
    PAYMENT_METHODS,
    recordManualPayment,
    recordManualPaymentWithReceipt,
    type ManualPaymentRequest,
    type ManualPaymentResponse,
    type PaymentMethodType
} from '@/lib/api/manual-payment';
import { cn } from '@/lib/utils';
import {
    getTransactionTypeInfo,
    TRANSACTION_TYPES,
    type TransactionType,
    type TransactionTypeInfo,
} from '@/types/settlement';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    DollarSign,
    History,
    Loader2,
    Receipt,
    Upload,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface ManualPaymentDialogProps {
  bookingId: number;
  bookingTotal?: number;
  balanceDue?: number;
  bookingStatus?: string;
  guestEmail?: string;
  guestName?: string;
  guestPhone?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (response: ManualPaymentResponse) => void;
}

export function ManualPaymentDialog({
  bookingId,
  bookingTotal = 0,
  balanceDue = 0,
  bookingStatus,
  guestEmail,
  guestName,
  guestPhone,
  open,
  onOpenChange,
  onSuccess,
}: ManualPaymentDialogProps) {
  const { formatCurrency } = useLocale();

  // Check if booking is already confirmed
  const isBookingConfirmed = bookingStatus === 'CONFIRMED' || bookingStatus === 'ACTIVE' || bookingStatus === 'COMPLETED';

  // Check if booking is completed (for post-completion charges)
  const isBookingCompleted = bookingStatus === 'COMPLETED';

  // Form state
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');
  const [transactionType, setTransactionType] = useState<TransactionType>('ADVANCE_PAYMENT');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [notes, setNotes] = useState('');
  const [payerName, setPayerName] = useState('');
  const [isDeposit, setIsDeposit] = useState(false);
  const [autoConfirmBooking, setAutoConfirmBooking] = useState(true);
  const [confirmBooking, setConfirmBooking] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Get transaction type info for selected type
  const selectedTransactionTypeInfo = getTransactionTypeInfo(transactionType);

  // Get available transaction types based on booking status
  // Post-completion charges are automatically available when booking is completed
  // DEPOSIT_RETURN is excluded as it's handled automatically by the system
  const getAvailableTransactionTypes = (): TransactionTypeInfo[] => {
    if (isBookingCompleted) {
      // For completed bookings, show post-completion charges
      return TRANSACTION_TYPES.filter(t => t.category === 'post-completion');
    }
    // Standard payment types (exclude DEPOSIT_RETURN - handled automatically)
    return TRANSACTION_TYPES.filter(t => 
      (t.category === 'pre-rental' || 
       t.category === 'during-rental' || 
       t.category === 'completion') &&
      t.value !== 'DEPOSIT_RETURN'
    );
  };

  // Fetch payment summary when dialog opens
  const { data: paymentSummary, isLoading: isSummaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['payment-summary-dialog', bookingId],
    queryFn: () => getPaymentSummary(bookingId),
    enabled: open && !!bookingId,
    staleTime: 0, // Always fetch fresh data
  });

  // Use fetched values or fallback to props
  const actualBookingTotal = paymentSummary?.bookingTotal ?? bookingTotal;
  const actualBalanceDue = paymentSummary?.balanceDue ?? balanceDue;
  const actualTotalPaid = paymentSummary?.totalPaid ?? 0;
  const paymentHistory = paymentSummary?.paymentHistory ?? [];

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      // Pre-fill with balance due if available
      const balance = paymentSummary?.balanceDue ?? balanceDue;
      setAmount(balance > 0 ? balance.toFixed(2) : '');
      setPaymentMethod('CASH');
      // Auto-set transaction type based on booking status
      setTransactionType(isBookingCompleted ? 'FINAL_SETTLEMENT' : 'ADVANCE_PAYMENT');
      setReferenceNumber('');
      setPaymentDate('');
      setNotes('');
      // Set payer name from guest name only
      setPayerName(guestName || '');
      setIsDeposit(false);
      setAutoConfirmBooking(true);
      setConfirmBooking(false);
      setReceiptFile(null);
      setReceiptPreview(null);
      setShowPaymentHistory(false);
      setShowAdvancedOptions(false);
    }
  }, [open, balanceDue, paymentSummary?.balanceDue, guestName, isBookingCompleted]);

  // Handle receipt file selection
  const handleReceiptSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file (JPEG, PNG, etc.)',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Receipt image must be less than 10MB',
          variant: 'destructive',
        });
        return;
      }

      setReceiptFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setReceiptPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Clear receipt
  const clearReceipt = useCallback(() => {
    setReceiptFile(null);
    setReceiptPreview(null);
  }, []);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const paymentRequest: ManualPaymentRequest = {
        amount: parseFloat(amount),
        paymentMethod,
        transactionType,
        isPostCompletion: isBookingCompleted, // Auto-set based on booking status
        referenceNumber: referenceNumber || undefined,
        paymentDate: paymentDate || undefined,
        notes: notes || undefined,
        payerName: payerName || undefined,
        isDeposit,
        autoConfirmBooking,
        confirmBooking: !isBookingConfirmed ? confirmBooking : undefined,
      };

      if (receiptFile) {
        return recordManualPaymentWithReceipt(bookingId, paymentRequest, receiptFile);
      } else {
        return recordManualPayment(bookingId, paymentRequest);
      }
    },
    onSuccess: (response) => {
      toast({
        title: isBookingCompleted ? 'Charge Added' : 'Payment Recorded',
        description: response.message || `${isBookingCompleted ? 'Charge' : 'Payment'} of ${formatCurrency(response.amount)} recorded successfully`,
      });
      onOpenChange(false);
      onSuccess?.(response);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Record Payment',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Validate form
  const isValid = () => {
    const amountValue = parseFloat(amount);
    return !isNaN(amountValue) && amountValue > 0 && paymentMethod;
  };

  // Check if amount exceeds balance
  const amountValue = parseFloat(amount) || 0;
  const exceedsBalance = actualBalanceDue > 0 && amountValue > actualBalanceDue;

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-MY', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Record Manual Payment
          </DialogTitle>
          <DialogDescription>
            Record an offline payment (cash, bank transfer, etc.) for booking #{bookingId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Payment Summary Card */}
          <div className="rounded-lg border bg-muted/30 overflow-hidden">
            {/* Summary Stats */}
            {isSummaryLoading ? (
              <div className="p-4 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading payment info...</span>
              </div>
            ) : (
              <>
                <div className="p-4 space-y-3">
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-md bg-background p-2">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-sm font-semibold">{formatCurrency(actualBookingTotal)}</p>
                    </div>
                    <div className="rounded-md bg-green-50 dark:bg-green-950/30 p-2">
                      <p className="text-xs text-muted-foreground">Paid</p>
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(actualTotalPaid)}
                      </p>
                    </div>
                    <div className={cn(
                      'rounded-md p-2',
                      actualBalanceDue > 0 
                        ? 'bg-orange-50 dark:bg-orange-950/30' 
                        : 'bg-green-50 dark:bg-green-950/30'
                    )}>
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className={cn(
                        'text-sm font-semibold',
                        actualBalanceDue > 0 
                          ? 'text-orange-600 dark:text-orange-400' 
                          : 'text-green-600 dark:text-green-400'
                      )}>
                        {formatCurrency(actualBalanceDue)}
                      </p>
                    </div>
                  </div>

                  {/* Payment Status */}
                  {paymentSummary?.isFullyPaid && (
                    <div className="flex items-center justify-center gap-2 py-1">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Fully Paid</span>
                    </div>
                  )}
                </div>

                {/* Payment History Toggle */}
                {paymentHistory.length > 0 && (
                  <div className="border-t">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between p-3 text-sm hover:bg-muted/50 transition-colors"
                      onClick={() => setShowPaymentHistory(!showPaymentHistory)}
                    >
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <History className="h-4 w-4" />
                        Payment History ({paymentHistory.length})
                      </span>
                      {showPaymentHistory ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>

                    {/* Payment History List */}
                    {showPaymentHistory && (
                      <div className="border-t bg-background max-h-40 overflow-y-auto">
                        {paymentHistory.map((payment, index) => {
                          const methodInfo = getPaymentMethodInfo(payment.paymentMethod);
                          const statusColor = getPaymentStatusColor(payment.status);
                          return (
                            <div
                              key={payment.id || index}
                              className="flex items-center justify-between p-3 border-b last:border-b-0 text-sm"
                            >
                              <div className="flex items-center gap-2">
                                <span>{methodInfo.icon}</span>
                                <div>
                                  <p className="font-medium">{formatCurrency(payment.amount)}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(payment.paymentDate)}
                                  </p>
                                </div>
                              </div>
                              <span className={cn('text-xs px-2 py-0.5 rounded-full', statusColor)}>
                                {payment.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
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

            {/* Quick Amount Selection - Show when no payment history (first payment) */}
            {paymentHistory.length === 0 && actualBalanceDue > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Quick select:</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={amount === actualBalanceDue.toFixed(2) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setAmount(actualBalanceDue.toFixed(2));
                      setIsDeposit(false);
                    }}
                  >
                    Full: {formatCurrency(actualBalanceDue)}
                  </Button>
                  <Button
                    type="button"
                    variant={amount === (actualBalanceDue * 0.5).toFixed(2) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setAmount((actualBalanceDue * 0.5).toFixed(2));
                      setIsDeposit(true);
                    }}
                  >
                    50%: {formatCurrency(actualBalanceDue * 0.5)}
                  </Button>
                  <Button
                    type="button"
                    variant={amount === (actualBalanceDue * 0.3).toFixed(2) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setAmount((actualBalanceDue * 0.3).toFixed(2));
                      setIsDeposit(true);
                    }}
                  >
                    30%: {formatCurrency(actualBalanceDue * 0.3)}
                  </Button>
                  <Button
                    type="button"
                    variant={amount === (actualBalanceDue * 0.2).toFixed(2) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setAmount((actualBalanceDue * 0.2).toFixed(2));
                      setIsDeposit(true);
                    }}
                  >
                    20%: {formatCurrency(actualBalanceDue * 0.2)}
                  </Button>
                </div>
              </div>
            )}

            {exceedsBalance && (
              <p className="text-sm text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Amount exceeds balance due
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">
              Payment Method <span className="text-destructive">*</span>
            </Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethodType)}>
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

          {/* Transaction Type */}
          <div className="space-y-2">
            <Label htmlFor="transactionType">
              Transaction Type
            </Label>
            <Select value={transactionType} onValueChange={(v) => setTransactionType(v as TransactionType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select transaction type" />
              </SelectTrigger>
              <SelectContent>
                {!isBookingCompleted && (
                  <>
                    <SelectGroup>
                      <SelectLabel>Pre-Rental</SelectLabel>
                      {TRANSACTION_TYPES.filter(t => t.category === 'pre-rental').map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            <span>{type.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>During Rental</SelectLabel>
                      {TRANSACTION_TYPES.filter(t => t.category === 'during-rental').map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            <span>{type.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </>
                )}
                <SelectGroup>
                  <SelectLabel>Completion</SelectLabel>
                  {TRANSACTION_TYPES.filter(t => t.category === 'completion').map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
                {isBookingCompleted && (
                  <SelectGroup>
                    <SelectLabel>Post-Completion Charges</SelectLabel>
                    {TRANSACTION_TYPES.filter(t => t.category === 'post-completion').map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <span className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
            {selectedTransactionTypeInfo && (
              <p className="text-xs text-muted-foreground">
                {selectedTransactionTypeInfo.description}
              </p>
            )}
          </div>

          {/* Reference Number */}
          <div className="space-y-2">
            <Label htmlFor="referenceNumber">Reference Number</Label>
            <Input
              id="referenceNumber"
              placeholder="Bank ref, receipt no., transaction ID..."
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="paymentDate">Payment Date</Label>
            <DateTimePicker
              value={paymentDate}
              onChange={setPaymentDate}
              showTimeSelect
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use current date/time
            </p>
          </div>

          {/* Payer Name */}
          <div className="space-y-2">
            <Label htmlFor="payerName">Payer Name</Label>
            <Input
              id="payerName"
              placeholder="Name of person who made the payment"
              value={payerName}
              onChange={(e) => setPayerName(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this payment..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Receipt Upload */}
          <div className="space-y-2">
            <Label>Receipt Image</Label>
            {receiptPreview ? (
              <div className="relative rounded-lg border overflow-hidden">
                <img
                  src={receiptPreview}
                  alt="Receipt preview"
                  className="max-h-48 w-full object-contain bg-muted"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={clearReceipt}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">Upload Receipt</span>
                <span className="text-xs text-muted-foreground">
                  JPEG, PNG (max 10MB)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleReceiptSelect}
                />
              </label>
            )}
          </div>

          {/* Options */}
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isDeposit" className="text-sm font-medium">
                  Deposit Payment
                </Label>
                <p className="text-xs text-muted-foreground">
                  Mark this as a partial/deposit payment
                </p>
              </div>
              <input
                id="isDeposit"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={isDeposit}
                onChange={(e) => setIsDeposit(e.target.checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoConfirm" className="text-sm font-medium">
                  Auto-confirm Booking
                </Label>
                <p className="text-xs text-muted-foreground">
                  Automatically confirm booking when fully paid
                </p>
              </div>
              <input
                id="autoConfirm"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={autoConfirmBooking}
                onChange={(e) => setAutoConfirmBooking(e.target.checked)}
              />
            </div>

            <div className={cn(
              "flex items-center justify-between",
              isBookingConfirmed && "opacity-50"
            )}>
              <div>
                <Label htmlFor="confirmBooking" className="text-sm font-medium">
                  Confirm Booking Now
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isBookingConfirmed 
                    ? `Booking is already ${bookingStatus?.toLowerCase()}`
                    : "Manually confirm the booking with this payment"
                  }
                </p>
              </div>
              <input
                id="confirmBooking"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                checked={confirmBooking}
                onChange={(e) => setConfirmBooking(e.target.checked)}
                disabled={isBookingConfirmed}
              />
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
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recording...
              </>
            ) : (
              <>
                <Receipt className="mr-2 h-4 w-4" />
                Record Payment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
