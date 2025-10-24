'use client';

import { BookingForm, type BookingFormSubmission } from '@/components/booking/booking-form';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { hateoasClient } from '@/lib/api/hateoas-client';
import type { Booking } from '@/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewBookingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (payload: BookingFormSubmission) => {
      const normalizedPayload = {
        ...payload,
        packageId: payload.packageId ?? undefined,
        discountId: payload.discountId ?? undefined,
      };

      return hateoasClient.create<Booking>('bookings', normalizedPayload);
    },
    onSuccess: (booking: Booking) => {
      toast({
        title: 'Booking Created',
        description: 'The booking has been created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      if (booking.id) {
        router.push(`/bookings/${booking.id}`);
      } else {
        router.push('/bookings');
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create booking',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (values: BookingFormSubmission) => {
    createMutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/bookings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Booking</h1>
          <p className="text-muted-foreground">Capture a new rental booking</p>
        </div>
      </div>

      <BookingForm
        submitLabel="Create Booking"
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
        onCancel={() => router.push('/bookings')}
      />
    </div>
  );
}
