'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { VehiclePricingList } from '@/components/vehicle/vehicle-pricing-list';
import { VehicleDetailSkeleton } from '@/components/vehicle/vehicle-skeletons';
import { toast } from '@/hooks/use-toast';
import { hateoasClient } from '@/lib/api/hateoas-client';
import type { Vehicle, VehicleImage } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function VehicleDetailPage() {
  const { t } = useLocale();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const vehicleId = params.id as string;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [imageDescription, setImageDescription] = useState('');
  const [isPrimaryImage, setIsPrimaryImage] = useState(false);

  // Fetch vehicle details
  const { data: vehicle, isLoading: vehicleLoading, error: vehicleError } = useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: async () => {
      return hateoasClient.getResource<Vehicle>('vehicles', vehicleId);
    },
  });

  // Fetch vehicle images
  const { data: imagesData, isLoading: imagesLoading, refetch: refetchImages } = useQuery({
    queryKey: ['vehicle', vehicleId, 'images'],
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
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082'}/api/vehicles/${vehicleId}/images`,
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
    enabled: !!vehicle,
  });

  const images: VehicleImage[] = Array.isArray(imagesData?.images) 
    ? imagesData.images 
    : (imagesData?._embedded?.images || []);

  // Delete vehicle mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await hateoasClient.delete('vehicles', vehicleId);
    },
    onSuccess: () => {
      toast({
        title: t('common.success'),
        description: t('vehicle.deleteSuccess'),
      });
      router.push('/vehicles');
    },
    onError: (error: Error) => {
      toast({
        title: t('common.error'),
        description: error.message || t('vehicle.deleteError'),
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
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082'}/api/vehicles/${vehicleId}/images/${imageId}`,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId, 'images'] });
      toast({
        title: t('common.success'),
        description: t('vehicle.deleteImageSuccess'),
      });
    },
    onError: (error: Error) => {
      let errorMessage = error.message;
      
      // Handle common error scenarios
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorMessage = t('vehicle.networkError');
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        errorMessage = t('vehicle.sessionExpired');
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        errorMessage = t('vehicle.permissionError');
      } else if (errorMessage.includes('404')) {
        errorMessage = t('vehicle.imageNotFound');
      }
      
      toast({
        title: t('vehicle.deleteImageErrorTitle'),
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Handle image file selection
  const handleImageFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Take the first file and validate it
    const file = files[0];
    
    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      toast({
        title: t('vehicle.invalidImageTypeTitle'),
        description: t('vehicle.invalidImageTypeDescription'),
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }
    
    // Validate file size (max 10MB)
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeInBytes) {
      const fileSizeMb = (file.size / 1024 / 1024).toFixed(2);
      toast({
        title: t('vehicle.fileTooLargeTitle'),
        description: `${t('vehicle.fileTooLargeDescription')} ${fileSizeMb}MB.`,
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }
    
    // File is valid, open dialog for metadata
    setPendingFile(file);
    setImageDescription('');
    setIsPrimaryImage(images.length === 0); // Default to primary if no images
    setUploadDialogOpen(true);
    
    // Clear the input
    event.target.value = '';
  };

  // Handle image upload with metadata
  const handleImageUpload = async () => {
    if (!pendingFile) return;

    setIsUploading(true);

    try {
      // Get access token from session
      const sessionResponse = await fetch('/api/auth/session');
      if (!sessionResponse.ok) {
        throw new Error('Failed to get authentication token');
      }
      const session = await sessionResponse.json();
      const token = session.accessToken;

      if (!token) {
        throw new Error('No access token available');
      }

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('file', pendingFile);
      
      if (imageDescription.trim()) {
        formData.append('description', imageDescription.trim());
      }
      
      formData.append('isPrimary', String(isPrimaryImage));

      // Upload to backend API using single image endpoint
      const uploadResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082'}/api/vehicles/${vehicleId}/images/single`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        // Try to parse JSON error response first
        let errorMessage = `Upload failed with status ${uploadResponse.status}`;
        
        try {
          const contentType = uploadResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await uploadResponse.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } else {
            const errorText = await uploadResponse.text();
            errorMessage = errorText || errorMessage;
          }
        } catch (parseError) {
          // If parsing fails, use the status text
          errorMessage = uploadResponse.statusText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const result = await uploadResponse.json();

      // Refresh images list - force refetch
      await queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId, 'images'] });
      await queryClient.refetchQueries({ queryKey: ['vehicle', vehicleId, 'images'] });
      
      toast({
        title: t('common.success'),
        description: result.message || t('vehicle.uploadSuccess'),
      });

      // Close dialog and reset state
      setUploadDialogOpen(false);
      setPendingFile(null);
      setImageDescription('');
      setIsPrimaryImage(false);
    } catch (error) {
      let errorMessage = t('vehicle.uploadError');
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Handle common error scenarios
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorMessage = t('vehicle.networkError');
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        errorMessage = t('vehicle.sessionExpired');
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        errorMessage = t('vehicle.permissionError');
      } else if (errorMessage.includes('404')) {
        errorMessage = t('vehicle.vehicleNotFound');
      } else if (errorMessage.includes('413') || errorMessage.includes('too large')) {
        errorMessage = t('vehicle.imageTooLarge');
      } else if (errorMessage.includes('415') || errorMessage.includes('Unsupported Media Type')) {
        errorMessage = t('vehicle.invalidImageTypeDescription');
      }
      
      toast({
        title: t('vehicle.uploadFailedTitle'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (vehicleLoading) {
    return <VehicleDetailSkeleton />;
  }

  if (vehicleError || !vehicle) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <p className="text-destructive">{t('vehicle.errorLoadingDetails')}</p>
        <Link href="/vehicles">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('vehicle.backToVehicles')}
          </Button>
        </Link>
      </div>
    );
  }

  const primaryImage = images.find(img => img.isPrimary);
  const displayImageUrl = selectedImage || primaryImage?.imageUrl || images[0]?.imageUrl;
  const normalizedStatus = vehicle.status?.toLowerCase();
  const detailStatusLabel = normalizedStatus && ['available', 'rented', 'maintenance', 'retired'].includes(normalizedStatus)
    ? t(`vehicle.${normalizedStatus}`)
    : vehicle.status || t('vehicle.unknownStatus');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/vehicles">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('common.back')}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{vehicle.name}</h1>
            <p className="text-muted-foreground">
              {vehicle.make} {vehicle.model} ({vehicle.year})
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/vehicles/${vehicleId}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              {t('common.edit')}
            </Button>
          </Link>
          <Button 
            variant="destructive"
            onClick={() => {
              if (confirm(t('vehicle.deleteConfirm'))) {
                deleteMutation.mutate();
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t('common.delete')}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Left Column - Images and Pricing */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('vehicle.images')}</CardTitle>
                <label htmlFor="image-upload">
                  <Button 
                    size="sm" 
                    variant="outline"
                    disabled={isUploading}
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {isUploading ? t('common.uploading') : t('common.upload')}
                  </Button>
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFileSelect}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main Display Image */}
              {displayImageUrl ? (
                <div className="relative w-full bg-muted rounded-lg overflow-hidden" style={{ height: '300px' }}>
                  <Image
                    src={displayImageUrl}
                    alt={vehicle.name}
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
                    <p>{t('vehicle.noImages')}</p>
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
                            alt={image.description || image.caption || t('vehicle.imageAltFallback')}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 25vw, 12vw"
                            quality={75}
                          />
                        </div>
                        {image.isPrimary && (
                          <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                            {t('vehicle.primaryImage')}
                          </div>
                        )}
                        <button
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(t('vehicle.deleteImageConfirm'))) {
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

          {/* Pricing List Section - Now in left column */}
          <VehiclePricingList vehicleId={vehicleId} />
        </div>

        {/* Right Column - Vehicle Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('vehicle.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">{t('vehicle.status')}</span>
                  <div className="mt-1">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-medium ${
                        vehicle.status === 'AVAILABLE'
                          ? 'bg-success/20 text-success'
                          : vehicle.status === 'RENTED'
                          ? 'bg-info/20 text-info'
                          : vehicle.status === 'MAINTENANCE'
                          ? 'bg-warning/20 text-warning'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {detailStatusLabel}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">{t('vehicle.licensePlate')}</span>
                  <p className="font-medium">{vehicle.licensePlate || t('common.notAvailable')}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">{t('vehicle.vinNumber')}</span>
                  <p className="font-mono text-sm">{vehicle.vin || t('common.notAvailable')}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">{t('vehicle.odometer')}</span>
                  <p className="font-medium">
                    {vehicle.odometer != null ? vehicle.odometer.toLocaleString() : t('common.notAvailable')} {t('vehicle.kilometersShort')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('vehicle.specifications')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">{t('vehicle.make')}</span>
                  <p className="font-medium">{vehicle.make || t('common.notAvailable')}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">{t('vehicle.model')}</span>
                  <p className="font-medium">{vehicle.model || t('common.notAvailable')}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">{t('vehicle.year')}</span>
                  <p className="font-medium">{vehicle.year || t('common.notAvailable')}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">{t('vehicle.carTypeLabel')}</span>
                  <p className="font-medium">
                    {vehicle.carType ? t(`vehicle.carType.${vehicle.carType.toLowerCase()}`) : t('common.notAvailable')}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">{t('vehicle.seaterCount')}</span>
                  <p className="font-medium">
                    {vehicle.seaterCount != null ? `${vehicle.seaterCount} ${vehicle.seaterCount === 1 ? 'seat' : 'seats'}` : t('common.notAvailable')}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">{t('vehicle.fuelType')}</span>
                  <p className="font-medium">{vehicle.fuelType || t('common.notAvailable')}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">{t('vehicle.transmissionType')}</span>
                  <p className="font-medium">{vehicle.transmissionType || t('common.notAvailable')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('vehicle.rentalSettings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">{t('vehicle.bufferMinutes')}</span>
                  <p className="font-medium">{vehicle.bufferMinutes ?? 0} {t('vehicle.minutesShort')}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">{t('vehicle.minRentalHours')}</span>
                  <p className="font-medium">{vehicle.minRentalHours ?? 0} {t('vehicle.hoursShort')}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">{t('vehicle.maxRentalDays')}</span>
                  <p className="font-medium">{vehicle.maxRentalDays ?? 0} {t('vehicle.daysShort')}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">{t('vehicle.maxFutureBookingDays')}</span>
                  <p className="font-medium">{vehicle.maxFutureBookingDays ?? 0} {t('vehicle.daysShort')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {vehicle.details && (
            <Card>
              <CardHeader>
                <CardTitle>{t('vehicle.additionalDetails')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {vehicle.details}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Upload Image Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('vehicle.uploadImageTitle')}</DialogTitle>
            <DialogDescription>
              {t('vehicle.imageDialogDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">{t('vehicle.imageDescriptionLabel')}</Label>
              <Textarea
                id="description"
                placeholder={t('vehicle.captionPlaceholder')}
                value={imageDescription}
                onChange={(e) => setImageDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPrimary"
                checked={isPrimaryImage}
                onCheckedChange={(checked) => setIsPrimaryImage(checked as boolean)}
              />
              <Label
                htmlFor="isPrimary"
                className="text-sm font-normal cursor-pointer"
              >
                {t('vehicle.setPrimaryImage')}
              </Label>
            </div>

            {pendingFile && (
              <div className="text-sm text-muted-foreground">
                {t('vehicle.selectedFileLabel')} {pendingFile.name} ({(pendingFile.size / 1024).toFixed(2)} KB)
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                setPendingFile(null);
                setImageDescription('');
                setIsPrimaryImage(false);
              }}
              disabled={isUploading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleImageUpload}
              disabled={isUploading || !pendingFile}
            >
              {isUploading ? t('common.uploading') : t('common.upload')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
