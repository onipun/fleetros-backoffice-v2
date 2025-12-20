'use client';

/**
 * Payment Summary Card
 * 
 * Displays payment information for a booking including:
 * - Total amount, paid amount, and balance due
 * - Settlement status with close/reopen actions
 * - Payment history with status indicators
 * - Actions for managing payments
 * 
 * Based on PAYMENT_SETTLEMENT_API_GUIDE.md
 */

import { useLocale } from '@/components/providers/locale-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import {
  cancelPayment,
  completePayment,
  getPaymentMethodInfo,
  getPaymentStatusColor,
  getPaymentSummary,
  type PaymentHistoryItem,
  uploadPaymentReceipt
} from '@/lib/api/manual-payment';
import {
  closeSettlement,
  getSettlementDetails,
  getSettlementStatusInfo,
  reopenSettlement,
  writeOffAndClose,
  writeOffBadDebt,
} from '@/lib/api/settlement-api';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  DollarSign,
  Eye,
  FileX,
  Loader2,
  Lock,
  Plus,
  Receipt,
  Unlock,
  Upload,
  XCircle,
} from 'lucide-react';
import { useCallback, useState } from 'react';

interface PaymentSummaryCardProps {
  bookingId: number;
  bookingStatus?: string;
  onRecordPayment?: () => void;
  onAddCharge?: () => void;
  showSettlementActions?: boolean;
  compact?: boolean;
}

export function PaymentSummaryCard({
  bookingId,
  bookingStatus,
  onRecordPayment,
  onAddCharge,
  showSettlementActions = true,
  compact = false,
}: PaymentSummaryCardProps) {
  const { formatCurrency } = useLocale();
  const queryClient = useQueryClient();
  const [expandedPaymentId, setExpandedPaymentId] = useState<number | null>(null);
  const [showAllPayments, setShowAllPayments] = useState(false);
  
  // Write-off dialog state
  const [writeOffDialogOpen, setWriteOffDialogOpen] = useState(false);
  const [writeOffReason, setWriteOffReason] = useState('');
  const [writeOffApprovedBy, setWriteOffApprovedBy] = useState('');
  const [writeOffClosureNotes, setWriteOffClosureNotes] = useState('');
  const [writeOffAndCloseMode, setWriteOffAndCloseMode] = useState(false);

  // Check if booking is completed
  const isBookingCompleted = bookingStatus === 'COMPLETED';

  // Fetch payment summary
  const {
    data: summary,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['payment-summary', bookingId],
    queryFn: () => getPaymentSummary(bookingId),
    enabled: !!bookingId,
    refetchOnWindowFocus: false,
  });

  // Fetch settlement details
  const {
    data: settlement,
    refetch: refetchSettlement,
  } = useQuery({
    queryKey: ['settlement', bookingId],
    queryFn: () => getSettlementDetails(bookingId),
    enabled: !!bookingId && showSettlementActions,
    refetchOnWindowFocus: false,
  });

  const settlementSummary = settlement?.summary;
  const settlementStatusInfo = settlementSummary ? getSettlementStatusInfo(settlementSummary.status) : null;

  // Complete payment mutation
  const completeMutation = useMutation({
    mutationFn: (paymentId: number) => completePayment(bookingId, paymentId),
    onSuccess: () => {
      toast({ title: 'Payment marked as completed' });
      refetch();
      refetchSettlement();
      queryClient.invalidateQueries({ queryKey: ['booking', String(bookingId)] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to complete payment',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Cancel payment mutation
  const cancelMutation = useMutation({
    mutationFn: (paymentId: number) => {
      const reason = prompt('Enter cancellation reason:');
      if (!reason) throw new Error('Cancellation cancelled');
      return cancelPayment(bookingId, paymentId, reason);
    },
    onSuccess: () => {
      toast({ title: 'Payment cancelled' });
      refetch();
      refetchSettlement();
      queryClient.invalidateQueries({ queryKey: ['booking', String(bookingId)] });
    },
    onError: (error: Error) => {
      if (error.message !== 'Cancellation cancelled') {
        toast({
          title: 'Failed to cancel payment',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });

  // Close settlement mutation
  const closeSettlementMutation = useMutation({
    mutationFn: (notes?: string) => {
      return closeSettlement(bookingId, notes);
    },
    onSuccess: () => {
      toast({ title: 'Settlement closed successfully' });
      refetch();
      refetchSettlement();
      queryClient.invalidateQueries({ queryKey: ['booking', String(bookingId)] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to close settlement',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Write-off bad debt mutation
  const writeOffMutation = useMutation({
    mutationFn: ({ reason, approvedBy }: { reason: string; approvedBy?: string }) => {
      return writeOffBadDebt(bookingId, reason, approvedBy);
    },
    onSuccess: () => {
      toast({ title: 'Bad debt written off successfully' });
      setWriteOffDialogOpen(false);
      resetWriteOffForm();
      refetch();
      refetchSettlement();
      queryClient.invalidateQueries({ queryKey: ['booking', String(bookingId)] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to write off bad debt',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Write-off and close mutation
  const writeOffAndCloseMutation = useMutation({
    mutationFn: ({ reason, approvedBy, closureNotes }: { reason: string; approvedBy?: string; closureNotes?: string }) => {
      return writeOffAndClose(bookingId, reason, approvedBy, closureNotes);
    },
    onSuccess: () => {
      toast({ title: 'Bad debt written off and settlement closed successfully' });
      setWriteOffDialogOpen(false);
      resetWriteOffForm();
      refetch();
      refetchSettlement();
      queryClient.invalidateQueries({ queryKey: ['booking', String(bookingId)] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to write off and close',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Reset write-off form
  const resetWriteOffForm = () => {
    setWriteOffReason('');
    setWriteOffApprovedBy('');
    setWriteOffClosureNotes('');
    setWriteOffAndCloseMode(false);
  };

  // Handle close settlement button click
  const handleCloseSettlement = () => {
    const balance = settlementSummary?.balance ?? 0;
    if (balance > 0) {
      // Has outstanding balance - show write-off dialog
      setWriteOffAndCloseMode(true);
      setWriteOffDialogOpen(true);
    } else {
      // No balance - can close directly
      const notes = prompt('Enter closing notes (optional):');
      closeSettlementMutation.mutate(notes || undefined);
    }
  };

  // Handle write-off only (without closing)
  const handleWriteOffOnly = () => {
    setWriteOffAndCloseMode(false);
    setWriteOffDialogOpen(true);
  };

  // Submit write-off form
  const handleWriteOffSubmit = () => {
    if (!writeOffReason.trim()) {
      toast({
        title: 'Reason required',
        description: 'Please enter a reason for the write-off',
        variant: 'destructive',
      });
      return;
    }

    if (writeOffAndCloseMode) {
      writeOffAndCloseMutation.mutate({
        reason: writeOffReason,
        approvedBy: writeOffApprovedBy || undefined,
        closureNotes: writeOffClosureNotes || undefined,
      });
    } else {
      writeOffMutation.mutate({
        reason: writeOffReason,
        approvedBy: writeOffApprovedBy || undefined,
      });
    }
  };

  // Reopen settlement mutation
  const reopenSettlementMutation = useMutation({
    mutationFn: () => {
      const reason = prompt('Enter reason for reopening (required):');
      if (!reason) throw new Error('Reason is required');
      return reopenSettlement(bookingId, reason);
    },
    onSuccess: () => {
      toast({ title: 'Settlement reopened successfully' });
      refetch();
      refetchSettlement();
      queryClient.invalidateQueries({ queryKey: ['booking', String(bookingId)] });
    },
    onError: (error: Error) => {
      if (error.message !== 'Reason is required') {
        toast({
          title: 'Failed to reopen settlement',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
  });

  const isSettlementLoading = closeSettlementMutation.isPending || reopenSettlementMutation.isPending || writeOffMutation.isPending || writeOffAndCloseMutation.isPending;

  // Check if there's an outstanding balance
  const hasOutstandingBalance = (settlementSummary?.balance ?? 0) > 0;

  // Receipt upload handler
  const handleReceiptUpload = useCallback(
    async (paymentId: number, file: File) => {
      try {
        await uploadPaymentReceipt(bookingId, paymentId, file);
        toast({ title: 'Receipt uploaded successfully' });
        refetch();
      } catch (error: any) {
        toast({
          title: 'Failed to upload receipt',
          description: error.message,
          variant: 'destructive',
        });
      }
    },
    [bookingId, refetch]
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load payment summary</span>
          </div>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const paymentHistory = summary?.paymentHistory || [];
  const displayedPayments = showAllPayments
    ? paymentHistory
    : paymentHistory.slice(0, 3);

  // Format date helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-MY', {
        year: 'numeric',
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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" />
              Payment Summary
            </CardTitle>
            {/* Settlement Status Badge */}
            {settlementStatusInfo && showSettlementActions && (
              <Badge 
                className={cn('gap-1', settlementStatusInfo.color)}
                title={settlementStatusInfo.description}
              >
                {settlementSummary?.status === 'OPEN' ? (
                  <Unlock className="h-3 w-3" />
                ) : (
                  <Lock className="h-3 w-3" />
                )}
                {settlementStatusInfo.label}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Post-completion charge button */}
            {isBookingCompleted && onAddCharge && settlementSummary?.isOpen && (
              <Button size="sm" variant="outline" onClick={onAddCharge}>
                <Plus className="mr-1 h-4 w-4" />
                Add Charge
              </Button>
            )}
            {/* Record payment button */}
            {onRecordPayment && settlementSummary?.isOpen && (
              <Button size="sm" onClick={onRecordPayment}>
                <Plus className="mr-1 h-4 w-4" />
                Record Payment
              </Button>
            )}
            {/* Write-Off button - show when settlement is open and has outstanding balance */}
            {showSettlementActions && settlementSummary?.isOpen && hasOutstandingBalance && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleWriteOffOnly}
                disabled={isSettlementLoading}
                className="text-orange-600 hover:text-orange-700 border-orange-300 hover:border-orange-400"
              >
                {writeOffMutation.isPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <FileX className="mr-1 h-4 w-4" />
                )}
                Write Off
              </Button>
            )}
            {/* Close Settlement button - show when settlement is open */}
            {showSettlementActions && settlementSummary?.isOpen && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCloseSettlement}
                disabled={isSettlementLoading}
              >
                {closeSettlementMutation.isPending || writeOffAndCloseMutation.isPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="mr-1 h-4 w-4" />
                )}
                Close Settlement
              </Button>
            )}
            {/* Reopen Settlement button - show when settlement is closed */}
            {showSettlementActions && settlementSummary && !settlementSummary.isOpen && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => reopenSettlementMutation.mutate()}
                disabled={reopenSettlementMutation.isPending}
              >
                {reopenSettlementMutation.isPending ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Unlock className="mr-1 h-4 w-4" />
                )}
                Reopen Settlement
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Stats */}
        {summary && (
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-3 text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-semibold">
                {formatCurrency(summary.bookingTotal)}
              </p>
            </div>
            <div className="rounded-lg border p-3 text-center bg-green-50 dark:bg-green-950/30">
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(summary.totalPaid)}
              </p>
            </div>
            <div
              className={cn(
                'rounded-lg border p-3 text-center',
                summary.balanceDue > 0
                  ? 'bg-orange-50 dark:bg-orange-950/30'
                  : 'bg-green-50 dark:bg-green-950/30'
              )}
            >
              <p className="text-xs text-muted-foreground">Balance</p>
              <p
                className={cn(
                  'text-lg font-semibold',
                  summary.balanceDue > 0
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-green-600 dark:text-green-400'
                )}
              >
                {formatCurrency(summary.balanceDue)}
              </p>
            </div>
          </div>
        )}

        {/* Payment Status Badge */}
        {summary && (
          <div className="flex items-center justify-center gap-2 py-2">
            {summary.isFullyPaid ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-sm font-medium text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                Fully Paid
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 px-3 py-1 text-sm font-medium text-orange-700 dark:text-orange-400">
                <AlertCircle className="h-4 w-4" />
                Balance Due
              </span>
            )}
          </div>
        )}

        {/* Payment History */}
        {paymentHistory.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Payment History</h4>
            <div className="space-y-2">
              {displayedPayments.map((payment) => (
                <PaymentHistoryRow
                  key={payment.id}
                  payment={payment}
                  bookingId={bookingId}
                  expanded={expandedPaymentId === payment.id}
                  onToggle={() =>
                    setExpandedPaymentId(
                      expandedPaymentId === payment.id ? null : payment.id
                    )
                  }
                  onComplete={() => completeMutation.mutate(payment.id)}
                  onCancel={() => cancelMutation.mutate(payment.id)}
                  onUploadReceipt={handleReceiptUpload}
                  isLoading={
                    completeMutation.isPending || cancelMutation.isPending
                  }
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              ))}
            </div>

            {paymentHistory.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setShowAllPayments(!showAllPayments)}
              >
                {showAllPayments ? (
                  <>
                    <ChevronUp className="mr-1 h-4 w-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1 h-4 w-4" />
                    Show All ({paymentHistory.length})
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Empty State */}
        {paymentHistory.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No payments recorded yet</p>
            {onRecordPayment && (
              <Button size="sm" variant="outline" className="mt-3" onClick={onRecordPayment}>
                <Plus className="mr-1 h-4 w-4" />
                Record First Payment
              </Button>
            )}
          </div>
        )}
      </CardContent>

      {/* Write-Off Dialog */}
      <Dialog open={writeOffDialogOpen} onOpenChange={(open) => {
        setWriteOffDialogOpen(open);
        if (!open) resetWriteOffForm();
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileX className="h-5 w-5 text-orange-500" />
              {writeOffAndCloseMode ? 'Write Off & Close Settlement' : 'Write Off Bad Debt'}
            </DialogTitle>
            <DialogDescription>
              {writeOffAndCloseMode 
                ? `This will write off the outstanding balance of ${formatCurrency(settlementSummary?.balance ?? 0)} and close the settlement.`
                : `Write off the outstanding balance of ${formatCurrency(settlementSummary?.balance ?? 0)} as bad debt.`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Outstanding Balance Info */}
            <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Outstanding Balance</span>
                <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {formatCurrency(settlementSummary?.balance ?? 0)}
                </span>
              </div>
            </div>

            {/* Reason (Required) */}
            <div className="space-y-2">
              <Label htmlFor="writeOffReason">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="writeOffReason"
                placeholder="Enter the reason for writing off this debt..."
                value={writeOffReason}
                onChange={(e) => setWriteOffReason(e.target.value)}
                rows={3}
              />
            </div>

            {/* Approved By (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="writeOffApprovedBy">Approved By</Label>
              <Input
                id="writeOffApprovedBy"
                placeholder="Name of person who approved"
                value={writeOffApprovedBy}
                onChange={(e) => setWriteOffApprovedBy(e.target.value)}
              />
            </div>

            {/* Closure Notes (Only for write-off and close) */}
            {writeOffAndCloseMode && (
              <div className="space-y-2">
                <Label htmlFor="writeOffClosureNotes">Closure Notes</Label>
                <Textarea
                  id="writeOffClosureNotes"
                  placeholder="Additional notes for settlement closure..."
                  value={writeOffClosureNotes}
                  onChange={(e) => setWriteOffClosureNotes(e.target.value)}
                  rows={2}
                />
              </div>
            )}

            {/* Warning */}
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                This action will create a WRITE_OFF transaction and set the balance to zero.
                This cannot be undone but the settlement can be reopened later if needed.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setWriteOffDialogOpen(false);
                resetWriteOffForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleWriteOffSubmit}
              disabled={!writeOffReason.trim() || writeOffMutation.isPending || writeOffAndCloseMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {(writeOffMutation.isPending || writeOffAndCloseMutation.isPending) ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileX className="mr-2 h-4 w-4" />
              )}
              {writeOffAndCloseMode ? 'Write Off & Close' : 'Write Off'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// Payment history row component
interface PaymentHistoryRowProps {
  payment: PaymentHistoryItem;
  bookingId: number;
  expanded: boolean;
  onToggle: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onUploadReceipt: (paymentId: number, file: File) => void;
  isLoading: boolean;
  formatCurrency: (amount: number) => string;
  formatDate: (date?: string) => string;
}

function PaymentHistoryRow({
  payment,
  bookingId,
  expanded,
  onToggle,
  onComplete,
  onCancel,
  onUploadReceipt,
  isLoading,
  formatCurrency,
  formatDate,
}: PaymentHistoryRowProps) {
  const methodInfo = getPaymentMethodInfo(payment.paymentMethod);
  const statusColor = getPaymentStatusColor(payment.status);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadReceipt(payment.id, file);
    }
  };

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Main Row */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{methodInfo.icon}</span>
          <div>
            <p className="font-medium">{formatCurrency(payment.amount)}</p>
            <p className="text-xs text-muted-foreground">
              {methodInfo.label}
              {payment.isDeposit && ' (Deposit)'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('text-xs px-2 py-1 rounded-full', statusColor)}>
            {payment.status}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t bg-muted/30 p-3 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Date:</span>
              <p className="font-medium">{formatDate(payment.paymentDate)}</p>
            </div>
            {payment.referenceNumber && (
              <div>
                <span className="text-muted-foreground">Reference:</span>
                <p className="font-medium font-mono">{payment.referenceNumber}</p>
              </div>
            )}
          </div>

          {payment.notes && (
            <div className="text-sm">
              <span className="text-muted-foreground">Notes:</span>
              <p className="mt-1">{payment.notes}</p>
            </div>
          )}

          {/* Receipt */}
          {payment.receiptUrl ? (
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <a
                href={payment.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <Eye className="h-3 w-3" />
                View Receipt
              </a>
            </div>
          ) : (
            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-primary">
              <Upload className="h-4 w-4" />
              Upload Receipt
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          )}

          {/* Actions */}
          {payment.status === 'PENDING' && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onComplete();
                }}
                disabled={isLoading}
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Complete
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
                disabled={isLoading}
              >
                <XCircle className="mr-1 h-3 w-3" />
                Cancel
              </Button>
            </div>
          )}

          {/* Only show cancel button for COMPLETED payments with positive amounts */}
          {payment.status === 'COMPLETED' && payment.amount > 0 && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancel();
                }}
                disabled={isLoading}
              >
                <Ban className="mr-1 h-3 w-3" />
                Cancel Payment
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
