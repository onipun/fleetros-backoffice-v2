'use client';

import { TablePageSkeleton } from '@/components/skeletons/page-skeletons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCollection } from '@/lib/api/hooks';
import { formatCurrency, formatDate, parseHalResource } from '@/lib/utils';
import type { Booking } from '@/types';
import { Calendar, Download, Plus, Search } from 'lucide-react';
import { useState } from 'react';

export default function BookingsPage() {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading, error } = useCollection<Booking>('bookings', {
    page,
    size: 20,
    sort: 'startDate,desc',
  });

  const bookings = data ? parseHalResource<Booking>(data, 'bookings') : [];
  const totalPages = data?.page?.totalPages || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-success/20 text-success';
      case 'PENDING':
        return 'bg-warning/20 text-warning';
      case 'COMPLETED':
        return 'bg-info/20 text-info';
      case 'CANCELLED':
        return 'bg-destructive/20 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">
            Manage customer reservations and bookings
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Booking
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer or booking ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      {isLoading ? (
        <TablePageSkeleton rows={8} />
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-destructive">Error loading bookings: {error.message}</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No bookings found</p>
          <Button className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Booking
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">
                          Booking #{booking.id || 'Unknown'}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(
                            booking.status || 'UNKNOWN'
                          )}`}
                        >
                          {booking.status || 'UNKNOWN'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Booking ID:</span>
                          <p className="font-medium">#{booking.id || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Vehicle ID:</span>
                          <p className="font-medium">#{booking.vehicleId || 'N/A'}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="text-muted-foreground">Start:</span>
                            <p className="font-medium">
                              {booking.startDate ? formatDate(booking.startDate) : 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="text-muted-foreground">End:</span>
                            <p className="font-medium">
                              {booking.endDate ? formatDate(booking.endDate) : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Pickup:</span>
                          <p className="font-medium">{booking.pickupLocation || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Dropoff:</span>
                          <p className="font-medium">{booking.dropoffLocation || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Duration:</span>
                          <p className="font-medium">{booking.totalDays || 0} days</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Final Price:</span>
                          <p className="font-bold text-lg">
                            {booking.finalPrice != null ? formatCurrency(booking.finalPrice) : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Balance Due:</span>
                          <p className="font-medium text-warning">
                            {booking.balancePayment != null ? formatCurrency(booking.balancePayment) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm">View Details</Button>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
