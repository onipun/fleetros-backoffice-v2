'use client';

import { OfferingImageUploadDialog } from '@/components/offering/offering-image-upload-dialog';
import { OfferingPricePanel } from '@/components/offering/offering-price-panel';
import { useLocale } from '@/components/providers/locale-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { hateoasClient } from '@/lib/api/hateoas-client';
import { formatDateTime } from '@/lib/utils';
import type { Offering, OfferingImage } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Edit, Eye, Image as ImageIcon, Info, Trash2, Upload, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

// Booking status type
type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export default function OfferingDetailPage() {
  const { t, formatCurrency } = useLocale();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const offeringId = params.id as string;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'details');

  // Booking search states
  const [bookingSearchStatus, setBookingSearchStatus] = useState<BookingStatus | 'ALL'>('ALL');
  const [bookingSearchStartDate, setBookingSearchStartDate] = useState('');
  const [bookingSearchEndDate, setBookingSearchEndDate] = useState('');
  const [bookingPage, setBookingPage] = useState(0);
  const [bookingPageSize] = useState(10);

  // Update active tab when URL changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['details', 'bookings'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Fetch offering details
  const { data: offering, isLoading: offeringLoading, error: offeringError } = useQuery({
    queryKey: ['offering', offeringId],
    queryFn: async () => {
      return hateoasClient.getResource<Offering>('offerings', offeringId);
    },
  });

  // Fetch offering images
  const { data: imagesData, isLoading: imagesLoading, refetch: refetchImages } = useQuery({
    queryKey: ['offering', offeringId, 'images'],
    queryFn: async () => {
      // Get access token
      const sessionResponse = await fetch('/api/auth/session');
      if (!sessionResponse.ok) {
        throw new Error('Failed to get authentication token');
      }
      const session = await sessionResponse.json();
      const token = session.accessToken;

      if (!token) {
        throw new Error('No access token available');
      }

      // Fetch images from backend API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082'}/api/offerings/${offeringId}/images`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return { images: [] };
        }
        throw new Error(`Failed to fetch images: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle both array response and paginated response
      if (Array.isArray(data)) {
        return { images: data };
      }
      
      return data;
    },
    enabled: !!offering,
  });

  const images: OfferingImage[] = Array.isArray(imagesData?.images) 
    ? imagesData.images 
    : (imagesData?._embedded?.images || []);

  // Fetch bookings associated with this offering
  const { 
    data: bookingsData, 
    isLoading: bookingsLoading, 
    refetch: refetchBookings 
  } = useQuery({
    queryKey: ['offering', offeringId, 'bookings', bookingSearchStatus === 'ALL' ? '' : bookingSearchStatus, bookingSearchStartDate, bookingSearchEndDate, bookingPage, bookingPageSize],
    queryFn: async () => {
      const sessionResponse = await fetch('/api/auth/session');
      if (!sessionResponse.ok) {
        throw new Error('Failed to get authentication token');
      }
      const session = await sessionResponse.json();
      const token = session.accessToken;

      if (!token) {
        throw new Error('No access token available');
      }

      // Build query params based on filters
      const params = new URLSearchParams();
      params.append('offeringId', offeringId);
      params.append('page', bookingPage.toString());
      params.append('size', bookingPageSize.toString());
      params.append('sort', 'startDate,desc');

      // Helper to extract date part and format with time
      const formatStartDate = (dateStr: string) => {
        // If already has time component (contains 'T'), extract just the date part
        const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        return `${datePart}T00:00:00`;
      };
      
      const formatEndDate = (dateStr: string) => {
        // If already has time component (contains 'T'), extract just the date part
        const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
        return `${datePart}T23:59:59`;
      };

      // Determine which endpoint to use based on filters
      let endpoint = 'findBookingsByOffering';
      
      if (bookingSearchStatus && bookingSearchStatus !== 'ALL' && bookingSearchStartDate && bookingSearchEndDate) {
        endpoint = 'findBookingsByOfferingStatusAndDateRange';
        params.append('status', bookingSearchStatus);
        params.append('startDate', formatStartDate(bookingSearchStartDate));
        params.append('endDate', formatEndDate(bookingSearchEndDate));
      } else if (bookingSearchStatus && bookingSearchStatus !== 'ALL') {
        endpoint = 'findBookingsByOfferingAndStatus';
        params.append('status', bookingSearchStatus);
      } else if (bookingSearchStartDate && bookingSearchEndDate) {
        endpoint = 'findBookingsByOfferingAndDateRange';
        params.append('startDate', formatStartDate(bookingSearchStartDate));
        params.append('endDate', formatEndDate(bookingSearchEndDate));
      }

      const response = await fetch(
        `${API_BASE_URL}/api/bookingOfferings/search/${endpoint}?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return { bookings: [], page: { totalElements: 0, totalPages: 0, number: 0, size: bookingPageSize } };
        }
        throw new Error(`Failed to fetch bookings: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        bookings: data._embedded?.bookings || [],
        page: data.page || { totalElements: 0, totalPages: 0, number: 0, size: bookingPageSize },
      };
    },
    enabled: !!offering && activeTab === 'bookings',
  });

  const associatedBookings = bookingsData?.bookings || [];
  const bookingPagination = bookingsData?.page || { totalElements: 0, totalPages: 0, number: 0, size: bookingPageSize };

  // Reset booking search filters
  const handleResetBookingFilters = () => {
    setBookingSearchStatus('ALL');
    setBookingSearchStartDate('');
    setBookingSearchEndDate('');
    setBookingPage(0);
  };

  // Get booking status badge color
  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge className="bg-success/20 text-success border-success/30">{t('booking.status.confirmed')}</Badge>;
      case 'PENDING':
        return <Badge className="bg-warning/20 text-warning border-warning/30">{t('booking.status.pending')}</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-info/20 text-info border-info/30">{t('booking.status.inProgress') || 'In Progress'}</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-muted text-muted-foreground">{t('booking.status.completed')}</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">{t('booking.status.cancelled')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Delete offering mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await hateoasClient.delete('offerings', offeringId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['offerings'] });
      toast({
        title: t('common.success'),
        description: t('offering.deleteSuccess'),
      });
      router.push('/offerings');
      router.refresh();
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message || t('offering.deleteError'),
        variant: 'destructive',
      });
    },
  });

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      // Get access token
      const sessionResponse = await fetch('/api/auth/session');
      if (!sessionResponse.ok) {
        throw new Error('Failed to get authentication token');
      }
      const session = await sessionResponse.json();
      const token = session.accessToken;

      if (!token) {
        throw new Error('No access token available');
      }

      // Delete image from backend API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082'}/api/offerings/${offeringId}/images/${imageId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        // Try to parse JSON error response first
        let errorMessage = `Failed to delete image (Status: ${response.status})`;
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          }
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['offering', offeringId, 'images'] });
      toast({
        title: t('common.success'),
        description: t('offering.deleteImageSuccess'),
      });
    },
    onError: (error: Error) => {
      let errorMessage = error.message;
      
      // Handle common error scenarios
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorMessage = t('offering.networkError');
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        errorMessage = t('offering.sessionExpired');
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        errorMessage = t('offering.permissionError');
      } else if (errorMessage.includes('404')) {
        errorMessage = t('offering.imageNotFound');
      }
      
      toast({
        title: t('offering.deleteImageErrorTitle'),
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  if (offeringLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">{t('offering.loading')}</p>
      </div>
    );
  }

  if (offeringError || !offering) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <p className="text-destructive">{t('offering.errorLoadingDetails')}</p>
        <Link href="/offerings">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('offering.backToOfferings')}
          </Button>
        </Link>
      </div>
    );
  }

  const primaryImage = images.find(img => img.isPrimary);
  const displayImageUrl = selectedImage || primaryImage?.imageUrl || images[0]?.imageUrl;
  
  // Get offering type label - convert SNAKE_CASE to camelCase for translation keys
  const getOfferingTypeLabel = (type: string) => {
    // Convert FULL_TANK -> fullTank, AIRPORT_PICKUP -> airportPickup, etc.
    const camelCaseKey = type.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    return t(`offering.types.${camelCaseKey}`) || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/offerings">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{offering.name}</h1>
            <p className="text-muted-foreground">
              {getOfferingTypeLabel(offering.offeringType)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/offerings/${offeringId}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              {t('common.edit')}
            </Button>
          </Link>
          <Button 
            variant="destructive"
            onClick={() => {
              if (confirm(t('offering.deleteConfirm'))) {
                deleteMutation.mutate();
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t('common.delete')}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">
            <Info className="mr-2 h-4 w-4" />
            {t('offering.tabs.details') || 'Details'}
          </TabsTrigger>
          <TabsTrigger value="bookings">
            <Calendar className="mr-2 h-4 w-4" />
            {t('offering.tabs.bookings') || 'Bookings'}
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-6">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Left Column - Images and Pricing */}
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{t('offering.images')}</CardTitle>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setUploadDialogOpen(true)}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {t('common.upload')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Main Display Image */}
                  {displayImageUrl ? (
                    <div className="relative w-full bg-muted rounded-lg overflow-hidden" style={{ height: '300px' }}>
                      <Image
                        src={displayImageUrl}
                        alt={offering.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                        quality={85}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full bg-muted rounded-lg" style={{ height: '300px' }}>
                      <div className="text-center text-muted-foreground">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                        <p>{t('offering.noImages')}</p>
                      </div>
                    </div>
                  )}

                  {/* Thumbnail Gallery */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {images.map((image) => {
                        return (
                          <div
                            key={image.id}
                            className="relative group cursor-pointer"
                            onClick={() => setSelectedImage(image.imageUrl)}
                          >
                            <div
                              className={`relative aspect-square rounded-md overflow-hidden border-2 transition-all ${
                                selectedImage === image.imageUrl || (selectedImage === null && image.isPrimary)
                                  ? 'border-primary'
                                  : 'border-transparent hover:border-muted-foreground'
                              }`}
                            >
                              <Image
                                src={image.imageUrl}
                                alt={image.description || image.caption || t('offering.imageAltFallback')}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 25vw, 12vw"
                                quality={75}
                              />
                            </div>
                            {image.isPrimary && (
                              <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                                {t('offering.primaryImage')}
                              </div>
                            )}
                            <button
                              className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(t('offering.deleteImageConfirm'))) {
                                  deleteImageMutation.mutate(image.id!);
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pricing Panel Section */}
              <OfferingPricePanel offeringId={Number(offeringId)} offeringName={offering.name} />
            </div>

            {/* Right Column - Offering Details */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('offering.basicInfo')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">{t('offering.typeLabel')}</span>
                      <p className="font-medium">{getOfferingTypeLabel(offering.offeringType)}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">{t('offering.unitPriceLabel')}</span>
                      <p className="font-medium">
                        {formatCurrency(offering.price ?? 0)}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">{t('offering.availability')}</span>
                      <p className="font-medium">{offering.availability ?? 0}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">{t('offering.maxQuantity')}</span>
                      <p className="font-medium">{offering.maxQuantityPerBooking ?? 1}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-muted-foreground">{t('offering.mandatory')}</span>
                      <p className="font-medium">
                        {offering.isMandatory ? t('common.yes') : t('common.no')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Inventory Settings Card */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('offering.inventorySettings')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">{t('offering.inventoryModeLabel')}</span>
                      <p className="font-medium">
                        {offering.inventoryMode === 'EXCLUSIVE' ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                              {t('offering.inventoryMode.exclusive')}
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                              {t('offering.inventoryMode.shared')}
                            </span>
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {offering.inventoryMode === 'EXCLUSIVE' 
                          ? t('offering.inventoryMode.exclusiveDesc') 
                          : t('offering.inventoryMode.sharedDesc')}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">{t('offering.consumableTypeLabel')}</span>
                      <p className="font-medium capitalize">
                        {offering.consumableType 
                          ? t(`offering.consumableType.${offering.consumableType.toLowerCase()}`)
                          : t('offering.consumableType.returnable')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {offering.consumableType 
                          ? t(`offering.consumableType.${offering.consumableType.toLowerCase()}Desc`)
                          : t('offering.consumableType.returnableDesc')}
                      </p>
                    </div>
                    {offering.purchaseLimitPerBooking && (
                      <div className="col-span-2">
                        <span className="text-sm text-muted-foreground">{t('offering.purchaseLimitPerBooking')}</span>
                        <p className="font-medium">{offering.purchaseLimitPerBooking}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {offering.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('offering.description')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {offering.description}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="mt-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('offering.associatedBookings') || 'Associated Bookings'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {bookingPagination.totalElements} {t('offering.bookingsTotal') || 'total bookings'}
              </p>
            </div>
          </div>

          {/* Search Filters */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label>{t('booking.search.status') || 'Status'}</Label>
              <Select
                value={bookingSearchStatus}
                onValueChange={(value) => {
                  setBookingSearchStatus(value as BookingStatus | 'ALL');
                  setBookingPage(0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('booking.search.allStatuses') || 'All Statuses'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('booking.search.allStatuses') || 'All Statuses'}</SelectItem>
                  <SelectItem value="PENDING">{t('booking.status.pending')}</SelectItem>
                  <SelectItem value="CONFIRMED">{t('booking.status.confirmed')}</SelectItem>
                  <SelectItem value="IN_PROGRESS">{t('booking.status.inProgress') || 'In Progress'}</SelectItem>
                  <SelectItem value="COMPLETED">{t('booking.status.completed')}</SelectItem>
                  <SelectItem value="CANCELLED">{t('booking.status.cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('booking.search.startDate') || 'Start Date'}</Label>
              <DateTimePicker
                value={bookingSearchStartDate}
                onChange={(value) => {
                  setBookingSearchStartDate(value);
                  setBookingPage(0);
                }}
                showTimeSelect={false}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('booking.search.endDate') || 'End Date'}</Label>
              <DateTimePicker
                value={bookingSearchEndDate}
                onChange={(value) => {
                  setBookingSearchEndDate(value);
                  setBookingPage(0);
                }}
                showTimeSelect={false}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetBookingFilters}
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                {t('common.reset') || 'Reset'}
              </Button>
            </div>
          </div>

          {/* Bookings Table */}
          {bookingsLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('common.loading') || 'Loading...'}</p>
            </div>
          ) : associatedBookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">{t('offering.noBookingsFound') || 'No bookings found'}</p>
              <p className="text-sm text-muted-foreground">
                {t('offering.noBookingsDescription') || 'This offering has not been used in any bookings yet.'}
              </p>
            </div>
          ) : (
            <>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('booking.table.booking') || 'Booking ID'}</TableHead>
                          <TableHead>{t('booking.table.dates') || 'Dates'}</TableHead>
                          <TableHead>{t('booking.table.status') || 'Status'}</TableHead>
                          <TableHead className="text-center">{t('common.actions')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {associatedBookings.map((booking: any) => (
                          <TableRow key={booking.id}>
                            <TableCell className="font-mono">#{booking.id}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm">
                                  {booking.startDate ? formatDateTime(booking.startDate) : '-'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  to {booking.endDate ? formatDateTime(booking.endDate) : '-'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{getBookingStatusBadge(booking.status)}</TableCell>
                            <TableCell className="text-center">
                              <Link href={`/bookings/${booking.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Pagination */}
              {bookingPagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {t('common.page') || 'Page'} {bookingPagination.number + 1} {t('common.of') || 'of'} {bookingPagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBookingPage((p) => Math.max(0, p - 1))}
                      disabled={bookingPagination.number === 0}
                    >
                      {t('common.previous') || 'Previous'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBookingPage((p) => p + 1)}
                      disabled={bookingPagination.number >= bookingPagination.totalPages - 1}
                    >
                      {t('common.next') || 'Next'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Multi-Image Upload Dialog */}
      <OfferingImageUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        offeringId={offeringId}
        hasExistingImages={images.length > 0}
        onUploadSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['offering', offeringId, 'images'] });
        }}
      />
    </div>
  );
}
