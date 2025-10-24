'use client';

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
      console.log('🔄 Fetching images for vehicle:', vehicleId);
      
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
          console.log('⚠️ Images endpoint returned 404, returning empty array');
          return { images: [] };
        }
        throw new Error(`Failed to fetch images: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('📸 Images API response:', data);
      
      // Handle both array response and paginated response
      if (Array.isArray(data)) {
        console.log('✅ Response is array, wrapping in images object');
        return { images: data };
      }
      
      console.log('✅ Response is object, returning as-is');
      return data;
    },
    enabled: !!vehicle,
  });

  const images: VehicleImage[] = Array.isArray(imagesData?.images) 
    ? imagesData.images 
    : (imagesData?._embedded?.images || []);

  console.log('📦 Images data received:', imagesData);
  console.log('🖼️ Extracted images array (count:', images.length, '):', images);
  console.log('🎯 Images loading state:', imagesLoading);

  // Delete vehicle mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await hateoasClient.delete('vehicles', vehicleId);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Vehicle deleted successfully',
      });
      router.push('/vehicles');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
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
        title: 'Success',
        description: 'Image deleted successfully',
      });
    },
    onError: (error: Error) => {
      let errorMessage = error.message;
      
      // Handle common error scenarios
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        errorMessage = 'You do not have permission to delete images.';
      } else if (errorMessage.includes('404')) {
        errorMessage = 'Image not found.';
      }
      
      toast({
        title: 'Delete Failed',
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
        title: 'Invalid File Type',
        description: 'Please upload a valid image file (JPEG, PNG, GIF, or WebP).',
        variant: 'destructive',
      });
      event.target.value = '';
      return;
    }
    
    // Validate file size (max 10MB)
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeInBytes) {
      toast({
        title: 'File Too Large',
        description: `Image size must be less than 10MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
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

      console.log('✅ Upload result:', result);
      console.log('📷 Uploaded image:', result.image);

      // Refresh images list - force refetch
      console.log('🔄 Invalidating and refetching images query...');
      await queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId, 'images'] });
      const refetchResult = await queryClient.refetchQueries({ queryKey: ['vehicle', vehicleId, 'images'] });
      console.log('✅ Refetch complete:', refetchResult);
      
      toast({
        title: 'Success',
        description: result.message || 'Image uploaded successfully',
      });

      // Close dialog and reset state
      setUploadDialogOpen(false);
      setPendingFile(null);
      setImageDescription('');
      setIsPrimaryImage(false);
    } catch (error) {
      console.error('Image upload error:', error);
      
      let errorMessage = 'Failed to upload image';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Handle common error scenarios
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        errorMessage = 'Session expired. Please log in again.';
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        errorMessage = 'You do not have permission to upload images.';
      } else if (errorMessage.includes('404')) {
        errorMessage = 'Vehicle not found.';
      } else if (errorMessage.includes('413') || errorMessage.includes('too large')) {
        errorMessage = 'Image file is too large. Please choose a smaller file.';
      } else if (errorMessage.includes('415') || errorMessage.includes('Unsupported Media Type')) {
        errorMessage = 'Invalid file type. Please upload a valid image file.';
      }
      
      toast({
        title: 'Upload Failed',
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
        <p className="text-destructive">Error loading vehicle details</p>
        <Link href="/vehicles">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vehicles
          </Button>
        </Link>
      </div>
    );
  }

  const primaryImage = images.find(img => img.isPrimary);
  const displayImageUrl = selectedImage || primaryImage?.imageUrl || images[0]?.imageUrl;

  console.log('🎨 Display state:', {
    selectedImage,
    primaryImage,
    displayImageUrl,
    imagesCount: images.length,
    firstImageUrl: images[0]?.imageUrl
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/vehicles">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
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
              Edit
            </Button>
          </Link>
          <Button 
            variant="destructive"
            onClick={() => {
              if (confirm('Are you sure you want to delete this vehicle?')) {
                deleteMutation.mutate();
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Images Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Vehicle Images</CardTitle>
              <label htmlFor="image-upload">
                <Button 
                  size="sm" 
                  variant="outline"
                  disabled={isUploading}
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? 'Uploading...' : 'Upload'}
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
              <div className="relative aspect-video w-full bg-muted rounded-lg overflow-hidden">
                <Image
                  src={displayImageUrl}
                  alt={vehicle.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                  quality={85}
                  onError={(e) => {
                    console.error('❌ Failed to load main image:', displayImageUrl);
                  }}
                  onLoad={() => {
                    console.log('✅ Main image loaded successfully:', displayImageUrl);
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center aspect-video w-full bg-muted rounded-lg">
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                  <p>No images available</p>
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
                        className={`aspect-square rounded-md overflow-hidden border-2 transition-all ${
                          selectedImage === image.imageUrl || (selectedImage === null && image.isPrimary)
                            ? 'border-primary'
                            : 'border-transparent hover:border-muted-foreground'
                        }`}
                      >
                        <Image
                          src={image.imageUrl}
                          alt={image.description || image.caption || 'Vehicle image'}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 25vw, 12vw"
                          quality={75}
                          onError={(e) => {
                            console.error('❌ Failed to load thumbnail:', image.imageUrl, image);
                          }}
                          onLoad={() => {
                            console.log('✅ Thumbnail loaded:', image.id, image.imageUrl);
                          }}
                        />
                      </div>
                      {image.isPrimary && (
                        <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">
                          Primary
                        </div>
                      )}
                      <button
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this image?')) {
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

        {/* Vehicle Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Status</span>
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
                      {vehicle.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">License Plate</span>
                  <p className="font-medium">{vehicle.licensePlate || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">VIN</span>
                  <p className="font-mono text-sm">{vehicle.vin || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Odometer</span>
                  <p className="font-medium">
                    {vehicle.odometer != null ? vehicle.odometer.toLocaleString() : 'N/A'} km
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Specifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Make</span>
                  <p className="font-medium">{vehicle.make || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Model</span>
                  <p className="font-medium">{vehicle.model || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Year</span>
                  <p className="font-medium">{vehicle.year || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Fuel Type</span>
                  <p className="font-medium">{vehicle.fuelType || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Transmission</span>
                  <p className="font-medium">{vehicle.transmissionType || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rental Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Buffer Minutes</span>
                  <p className="font-medium">{vehicle.bufferMinutes ?? 0} min</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Min Rental Hours</span>
                  <p className="font-medium">{vehicle.minRentalHours ?? 0} hrs</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Max Rental Days</span>
                  <p className="font-medium">{vehicle.maxRentalDays ?? 0} days</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Max Future Booking</span>
                  <p className="font-medium">{vehicle.maxFutureBookingDays ?? 0} days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {vehicle.details && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
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
            <DialogTitle>Upload Vehicle Image</DialogTitle>
            <DialogDescription>
              Add a description and set whether this image should be the primary image.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="e.g., Front view of the vehicle"
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
                Set as primary image
              </Label>
            </div>

            {pendingFile && (
              <div className="text-sm text-muted-foreground">
                File: {pendingFile.name} ({(pendingFile.size / 1024).toFixed(2)} KB)
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
              Cancel
            </Button>
            <Button
              onClick={handleImageUpload}
              disabled={isUploading || !pendingFile}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
