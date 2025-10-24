'use client';

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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { hateoasClient } from '@/lib/api/hateoas-client';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import type { Booking, BookingImage, Offering } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082';

type BookingOfferingSummary = {
  id?: number;
  name?: string;
  quantity?: number;
  price?: number;
  totalPrice?: number;
};

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bookingId = params.id as string;

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [imageDescription, setImageDescription] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { data: booking, isLoading: bookingLoading, error: bookingError } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => hateoasClient.getResource<Booking>('bookings', bookingId),
  });

  const { data: imagesData, isLoading: imagesLoading } = useQuery({
    queryKey: ['booking', bookingId, 'images'],
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

      const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/images`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { images: [] };
        }
        throw new Error(`Failed to fetch images: ${response.statusText}`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        return { images: data };
      }
      return data;
    },
    enabled: Boolean(bookingId),
  });

  const images: BookingImage[] = useMemo(() => {
    if (!imagesData) return [];
    if (Array.isArray(imagesData.images)) {
      return imagesData.images;
    }
    if (imagesData._embedded?.images) {
      return imagesData._embedded.images;
    }
    return [];
  }, [imagesData]);

  const bookingOfferings = useMemo<BookingOfferingSummary[]>(() => {
    if (!booking?.offerings) return [];

    return booking.offerings.map((item: any) => {
      if (item.offering) {
        return {
          id: item.offering.id ?? item.offeringId,
          name: item.offering.name,
          quantity: item.quantity,
          price: item.price,
          totalPrice: item.totalPrice,
        };
      }

      const offering = item as Offering;
      return {
        id: offering.id,
        name: offering.name,
        quantity: 'quantity' in item ? item.quantity : undefined,
        price: 'price' in item ? item.price : undefined,
        totalPrice: 'totalPrice' in item ? item.totalPrice : undefined,
      };
    });
  }, [booking?.offerings]);

  const deleteBookingMutation = useMutation({
    mutationFn: async () => hateoasClient.delete('bookings', bookingId),
    onSuccess: () => {
      toast({
        title: 'Booking Deleted',
        description: 'The booking has been removed.',
      });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      router.push('/bookings');
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete booking',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const sessionResponse = await fetch('/api/auth/session');
      if (!sessionResponse.ok) {
        throw new Error('Failed to get authentication token');
      }
      const session = await sessionResponse.json();
      const token = session.accessToken;

      if (!token) {
        throw new Error('No access token available');
      }

      const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let message = `Failed to delete image (${response.status})`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const payload = await response.json();
            message = payload.message || payload.error || message;
          } else {
            const text = await response.text();
            message = text || message;
          }
        } catch (error) {
          console.error('Failed to parse error response', error);
        }
        throw new Error(message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId, 'images'] });
      setSelectedImage(null);
      toast({
        title: 'Image Deleted',
        description: 'The booking image has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete image',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleImageFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please choose a JPEG, PNG, GIF, or WebP image.',
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Image must be smaller than 10MB.',
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }

    setPendingFile(file);
    setImageDescription('');
    setUploadDialogOpen(true);
    event.target.value = '';
  };

  const handleImageUpload = async () => {
    if (!pendingFile) return;

    setIsUploading(true);

    try {
      const sessionResponse = await fetch('/api/auth/session');
      if (!sessionResponse.ok) {
        throw new Error('Failed to get authentication token');
      }
      const session = await sessionResponse.json();
      const token = session.accessToken;

      if (!token) {
        throw new Error('No access token available');
      }

      const formData = new FormData();
      formData.append('file', pendingFile);
      if (imageDescription.trim()) {
        formData.append('description', imageDescription.trim());
      }

      const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/images/single`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        let message = `Upload failed (${response.status})`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const payload = await response.json();
            message = payload.message || payload.error || message;
          } else {
            const text = await response.text();
            message = text || message;
          }
        } catch (error) {
          console.error('Failed to parse upload error', error);
        }
        throw new Error(message);
      }

      await queryClient.invalidateQueries({ queryKey: ['booking', bookingId, 'images'] });
      toast({
        title: 'Image Uploaded',
        description: 'The booking image has been added.',
      });

      setUploadDialogOpen(false);
      setPendingFile(null);
      setImageDescription('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload booking image';
      toast({
        title: 'Upload failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (bookingLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        Loading booking details...
      </div>
    );
  }

  if (bookingError || !booking) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-destructive">Failed to load booking details.</p>
        <Button asChild variant="outline">
          <Link href="/bookings">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bookings
          </Link>
        </Button>
      </div>
    );
  }

  const displayImage = selectedImage || images[0]?.imageUrl || null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/bookings">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Booking #{booking.id ?? bookingId}</h1>
            <p className="text-muted-foreground">Manage booking details and assets</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={`/bookings/${bookingId}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button
            variant="destructive"
            disabled={deleteBookingMutation.isPending}
            onClick={() => {
              if (deleteBookingMutation.isPending) return;
              if (confirm('Delete this booking? This action cannot be undone.')) {
                deleteBookingMutation.mutate();
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Booking Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Manage inspection and reference photos for this booking.
              </div>
              <div>
                <label htmlFor="booking-image-upload" className="inline-flex">
                  <input
                    id="booking-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFileSelect}
                  />
                  <Button variant="outline" size="sm" disabled={isUploading}>
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </label>
              </div>
            </div>

            {displayImage ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                <Image
                  src={displayImage}
                  alt="Booking image"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-muted-foreground/40 text-muted-foreground">
                <div className="text-center">
                  <ImageIcon className="mx-auto mb-2 h-8 w-8" />
                  <p>No images uploaded yet</p>
                </div>
              </div>
            )}

            {imagesLoading ? (
              <p className="text-sm text-muted-foreground">Loading images...</p>
            ) : images.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image) => (
                  <div key={image.id ?? image.imageUrl} className="group relative">
                    <button
                      type="button"
                      className={`relative aspect-square w-full overflow-hidden rounded-md border ${
                        selectedImage === image.imageUrl ? 'border-primary' : 'border-transparent'
                      }`}
                      onClick={() => setSelectedImage(image.imageUrl)}
                    >
                      <Image
                        src={image.imageUrl}
                        alt={image.description || 'Booking image'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 25vw, 12vw"
                      />
                    </button>
                    <button
                      type="button"
                      className="absolute top-1 right-1 rounded bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => {
                        if (image.id && confirm('Remove this image?')) {
                          deleteImageMutation.mutate(image.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reservation Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <span className="text-sm text-muted-foreground">Vehicle ID</span>
                <p className="font-medium">{booking.vehicleId ? `#${booking.vehicleId}` : 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Package</span>
                <p className="font-medium">{booking.packageId ? `#${booking.packageId}` : 'None'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Discount</span>
                <p className="font-medium">{booking.discountId ? `#${booking.discountId}` : 'None'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Status</span>
                <p className="font-medium">{booking.status}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Start</span>
                <p className="font-medium">{booking.startDate ? formatDateTime(booking.startDate) : 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">End</span>
                <p className="font-medium">{booking.endDate ? formatDateTime(booking.endDate) : 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Pickup Location</span>
                <p className="font-medium">{booking.pickupLocation || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Dropoff Location</span>
                <p className="font-medium">{booking.dropoffLocation || 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financial Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <span className="text-sm text-muted-foreground">Total Days</span>
                <p className="font-medium">{booking.totalDays ?? 0}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Total Rental Fee</span>
                <p className="font-medium">{formatCurrency(booking.totalRentalFee ?? 0)}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Final Price</span>
                <p className="font-medium">{formatCurrency(booking.finalPrice ?? 0)}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Balance Payment</span>
                <p className="font-medium text-warning">{formatCurrency(booking.balancePayment ?? 0)}</p>
              </div>
              {booking.insurancePolicy && (
                <div className="md:col-span-2">
                  <span className="text-sm text-muted-foreground">Insurance Policy</span>
                  <p className="text-sm text-muted-foreground">{booking.insurancePolicy}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Included Offerings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {bookingOfferings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No additional offerings selected.</p>
              ) : (
                <div className="space-y-2">
                  {bookingOfferings.map((offering) => (
                    <div
                      key={offering.id ?? offering.name}
                      className="flex flex-wrap items-center justify-between rounded-md border p-3"
                    >
                      <div>
                        <p className="font-medium">{offering.name || `Offering #${offering.id}`}</p>
                        {offering.quantity != null && (
                          <p className="text-xs text-muted-foreground">Quantity: {offering.quantity}</p>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {offering.price != null && (
                          <p>Price: {formatCurrency(offering.price)}</p>
                        )}
                        {offering.totalPrice != null && (
                          <p>Total: {formatCurrency(offering.totalPrice)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Booking Image</DialogTitle>
            <DialogDescription>Attach inspection or damage photos to this booking.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="booking-image-description">Description (optional)</Label>
              <Textarea
                id="booking-image-description"
                value={imageDescription}
                onChange={(event) => setImageDescription(event.target.value)}
                placeholder="Describe the context of this image"
                rows={3}
              />
            </div>
            {pendingFile && (
              <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                {pendingFile.name} ({(pendingFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                setPendingFile(null);
                setImageDescription('');
              }}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleImageUpload} disabled={isUploading || !pendingFile}>
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
