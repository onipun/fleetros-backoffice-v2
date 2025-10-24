'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { hateoasClient } from '@/lib/api/hateoas-client';
import type { Booking, HATEOASCollection } from '@/types';
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: Booking;
}

export function EventCalendar() {
  const { data: bookings } = useQuery<HATEOASCollection<Booking>>({
    queryKey: ['bookings'],
    queryFn: () => hateoasClient.getCollection<Booking>('bookings', { page: 0, size: 100 }),
  });

  const events: CalendarEvent[] = useMemo(() => {
    if (!bookings?._embedded?.bookings) return [];

    const toDate = (value?: string) => {
      if (!value) return undefined;
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    };

    return bookings._embedded.bookings.flatMap((booking) => {
      const vehicleLabel = booking.vehicle
        ? `${booking.vehicle.make} ${booking.vehicle.model}`
        : booking.vehicleId
          ? `Vehicle #${booking.vehicleId}`
          : 'Vehicle';

      const customerName = booking.customer?.firstName || booking.customer?.lastName || 'Customer';

      const deliveryDate = toDate(booking.bookingStartDate ?? booking.startDate);
      const returnDate = toDate(booking.bookingEndDate ?? booking.endDate);

      const entry: CalendarEvent[] = [];

      if (deliveryDate) {
        entry.push({
          title: `Delivery: ${vehicleLabel} to ${customerName}`,
          start: deliveryDate,
          end: deliveryDate,
          allDay: true,
          resource: booking,
        });
      }

      if (returnDate) {
        entry.push({
          title: `Return: ${vehicleLabel} from ${customerName}`,
          start: returnDate,
          end: returnDate,
          allDay: true,
          resource: booking,
        });
      }

      return entry;
    });
  }, [bookings]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <CardTitle>Delivery &amp; Return Calendar</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">Upcoming vehicle deliveries and returns.</p>
      </CardHeader>
      <CardContent>
        <div style={{ height: '600px' }}>
          <Calendar localizer={localizer} events={events} startAccessor="start" endAccessor="end" />
        </div>
      </CardContent>
    </Card>
  );
}
