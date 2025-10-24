'use client';

import { BookingForm, type BookingFormSubmission } from '@/components/booking/booking-form';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { hateoasClient } from '@/lib/api/hateoas-client';
import type { Booking } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function EditBookingPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bookingId = params.id as string;

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => hateoasClient.getResource<Booking>('bookings', bookingId),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: BookingFormSubmission) => {
      const normalizedPayload = {
        ...payload,
        packageId: payload.packageId ?? undefined,
        discountId: payload.discountId ?? undefined,
      };

      return hateoasClient.update<Booking>('bookings', bookingId, normalizedPayload);
    },
    onSuccess: (updated: Booking) => {
      toast({
        title: 'Booking Updated',
        description: 'The booking has been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      router.push(`/bookings/${bookingId}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update booking',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (values: BookingFormSubmission) => {
    updateMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Loading booking...
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-destructive">Booking not found.</p>
        <Button asChild variant="outline">
          <Link href="/bookings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bookings
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href={`/bookings/${bookingId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Booking</h1>
          <p className="text-muted-foreground">Update booking details and pricing</p>
        </div>
      </div>

      <BookingForm
        initialValues={booking}
        submitLabel="Update Booking"
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
        onCancel={() => router.push(`/bookings/${bookingId}`)}
      />
    </div>
  );
}
