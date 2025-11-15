'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { hateoasClient } from '@/lib/api/hateoas-client';
import type { Booking, HATEOASCollection } from '@/types';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar as CalendarIcon,
  Car,
  Clock,
  ExternalLink,
  MapPin,
  Phone,
  TrendingDown,
  TrendingUp,
  User,
} from 'lucide-react';
import moment from 'moment';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { Calendar, momentLocalizer, type Event as BigCalendarEvent } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface CalendarEvent extends BigCalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: Booking & { eventType: 'delivery' | 'return' };
}

interface DayEventsModalProps {
  date: Date;
  events: CalendarEvent[];
  onClose: () => void;
}

function DayEventsModal({ date, events, onClose }: DayEventsModalProps) {
  const deliveries = events.filter((e) => e.resource?.eventType === 'delivery');
  const returns = events.filter((e) => e.resource?.eventType === 'return');

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Events for {moment(date).format('MMMM D, YYYY')}
          </DialogTitle>
          <DialogDescription>
            {events.length} {events.length === 1 ? 'event' : 'events'} scheduled for this day
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Deliveries Section */}
          {deliveries.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <h3 className="text-lg font-semibold">Deliveries ({deliveries.length})</h3>
              </div>
              <div className="space-y-3">
                {deliveries.map((event, index) => {
                  const booking = event.resource;
                  if (!booking) return null;

                  const vehicleLabel = booking.vehicle
                    ? `${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.licensePlate || 'N/A'})`
                    : `Vehicle #${booking.vehicleId}`;

                  return (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4 text-primary" />
                              <span className="font-semibold">{vehicleLabel}</span>
                              <Badge variant="outline" className="bg-green-50">
                                Delivery
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span>
                                {booking.customer?.firstName} {booking.customer?.lastName}
                              </span>
                            </div>

                            {booking.customer?.email && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                <span>{booking.customer.email}</span>
                              </div>
                            )}

                            {(booking as any).pickupLocation && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{(booking as any).pickupLocation}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {moment(booking.bookingStartDate).format('MMM D')} -{' '}
                                  {moment(booking.bookingEndDate).format('MMM D, YYYY')}
                                </span>
                              </div>
                              {(booking as any).totalAmount && (
                                <span className="font-semibold text-primary">
                                  {formatCurrency((booking as any).totalAmount)}
                                </span>
                              )}
                            </div>
                          </div>

                          <Link href={`/bookings/${booking.id}`}>
                            <Button size="sm" variant="outline">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {deliveries.length > 0 && returns.length > 0 && <Separator />}

          {/* Returns Section */}
          {returns.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Returns ({returns.length})</h3>
              </div>
              <div className="space-y-3">
                {returns.map((event, index) => {
                  const booking = event.resource;
                  if (!booking) return null;

                  const vehicleLabel = booking.vehicle
                    ? `${booking.vehicle.make} ${booking.vehicle.model} (${booking.vehicle.licensePlate || 'N/A'})`
                    : `Vehicle #${booking.vehicleId}`;

                  return (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4 text-primary" />
                              <span className="font-semibold">{vehicleLabel}</span>
                              <Badge variant="outline" className="bg-blue-50">
                                Return
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span>
                                {booking.customer?.firstName} {booking.customer?.lastName}
                              </span>
                            </div>

                            {booking.customer?.email && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                <span>{booking.customer.email}</span>
                              </div>
                            )}

                            {(booking as any).returnLocation && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>{(booking as any).returnLocation}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {moment(booking.bookingStartDate).format('MMM D')} -{' '}
                                  {moment(booking.bookingEndDate).format('MMM D, YYYY')}
                                </span>
                              </div>
                              {(booking as any).totalAmount && (
                                <span className="font-semibold text-primary">
                                  {formatCurrency((booking as any).totalAmount)}
                                </span>
                              )}
                            </div>
                          </div>

                          <Link href={`/bookings/${booking.id}`}>
                            <Button size="sm" variant="outline">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EventCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day' | 'agenda'>('month');

  const handleViewChange = useCallback((view: any) => {
    if (view === 'month' || view === 'week' || view === 'day' || view === 'agenda') {
      setCurrentView(view);
    }
  }, []);

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
          resource: { ...booking, eventType: 'delivery' as const },
        });
      }

      if (returnDate) {
        entry.push({
          title: `Return: ${vehicleLabel} from ${customerName}`,
          start: returnDate,
          end: returnDate,
          allDay: true,
          resource: { ...booking, eventType: 'return' as const },
        });
      }

      return entry;
    });
  }, [bookings]);

  // Handle clicking on a specific event
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    if (event.resource) {
      // Navigate to booking details
      window.location.href = `/bookings/${event.resource.id}`;
    }
  }, []);

  // Handle clicking on a day (when multiple events exist)
  const handleSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date; action: string }) => {
      if (slotInfo.action === 'select' || slotInfo.action === 'click') {
        const dayEvents = events.filter(
          (event) => moment(event.start).isSame(slotInfo.start, 'day')
        );

        if (dayEvents.length > 0) {
          setSelectedDate(slotInfo.start);
          setSelectedEvents(dayEvents);
        }
      }
    },
    [events]
  );

  // Custom event style to show delivery vs return
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const isDelivery = event.resource?.eventType === 'delivery';
    return {
      style: {
        backgroundColor: isDelivery ? '#10b981' : '#3b82f6',
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: '0px',
        display: 'block',
        cursor: 'pointer',
      },
    };
  }, []);

  // Custom event component to show count when multiple events
  const EventComponent = useCallback(({ event }: { event: CalendarEvent }) => {
    const dayEvents = events.filter((e) => moment(e.start).isSame(event.start, 'day'));
    const isDelivery = event.resource?.eventType === 'delivery';
    
    if (dayEvents.length > 1) {
      const deliveryCount = dayEvents.filter((e) => e.resource?.eventType === 'delivery').length;
      const returnCount = dayEvents.filter((e) => e.resource?.eventType === 'return').length;
      
      return (
        <div className="flex flex-col gap-0.5 p-1">
          {deliveryCount > 0 && (
            <div className="flex items-center gap-1 text-xs font-medium">
              <TrendingUp className="h-3 w-3" />
              <span>{deliveryCount} {deliveryCount === 1 ? 'Delivery' : 'Deliveries'}</span>
            </div>
          )}
          {returnCount > 0 && (
            <div className="flex items-center gap-1 text-xs font-medium">
              <TrendingDown className="h-3 w-3" />
              <span>{returnCount} {returnCount === 1 ? 'Return' : 'Returns'}</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 px-1">
        {isDelivery ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        <span className="text-xs truncate">{event.title}</span>
      </div>
    );
  }, [events]);

  // Custom toolbar without left navigation buttons
  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
      toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
      toolbar.onNavigate('NEXT');
    };

    const goToToday = () => {
      toolbar.onNavigate('TODAY');
    };

    const label = () => {
      const date = moment(toolbar.date);
      return (
        <span className="text-lg font-semibold">
          {date.format('MMMM YYYY')}
        </span>
      );
    };

    return (
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <div className="flex items-center gap-2">
          {label()}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={toolbar.view === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => toolbar.onView('month')}
          >
            Month
          </Button>
          <Button
            variant={toolbar.view === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => toolbar.onView('week')}
          >
            Week
          </Button>
          <Button
            variant={toolbar.view === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => toolbar.onView('day')}
          >
            Day
          </Button>
          <Button
            variant={toolbar.view === 'agenda' ? 'default' : 'outline'}
            size="sm"
            onClick={() => toolbar.onView('agenda')}
          >
            Agenda
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <CardTitle>Delivery &amp; Return Calendar</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Click on any event to view booking details. Days with multiple events show totals - click to see all.
          </p>
        </CardHeader>
        <CardContent>
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={currentView}
              onView={handleViewChange}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              eventPropGetter={eventStyleGetter}
              components={{
                event: EventComponent,
                toolbar: CustomToolbar,
              }}
              views={['month', 'week', 'day', 'agenda']}
              defaultView="month"
              popup
            />
          </div>
        </CardContent>
      </Card>

      {/* Modal for viewing multiple events on a single day */}
      {selectedDate && selectedEvents.length > 0 && (
        <DayEventsModal
          date={selectedDate}
          events={selectedEvents}
          onClose={() => {
            setSelectedDate(null);
            setSelectedEvents([]);
          }}
        />
      )}
    </>
  );
}
