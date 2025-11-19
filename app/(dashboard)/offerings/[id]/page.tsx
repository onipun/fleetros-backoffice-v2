'use client';

import { OfferingPricePanel } from '@/components/offering/offering-price-panel';
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
import { toast } from '@/hooks/use-toast';
import { hateoasClient } from '@/lib/api/hateoas-client';
import type { Offering, OfferingImage } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit, Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function OfferingDetailPage() {
  const { t } = useLocale();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const offeringId = params.id as string;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [imageDescription, setImageDescription] = useState('');
  const [isPrimaryImage, setIsPrimaryImage] = useState(false);

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

  // Delete offering mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await hateoasClient.delete('offerings', offeringId);
    },
    onSuccess: () => {
      toast({
        title: t('common.success'),
        description: t('offering.deleteSuccess'),
      });
      router.push('/offerings');
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offering', offeringId, 'images'] });
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
        title: t('offering.invalidImageTypeTitle'),
        description: t('offering.invalidImageTypeDescription'),
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
        title: t('offering.fileTooLargeTitle'),
        description: `${t('offering.fileTooLargeDescription')} ${fileSizeMb}MB.`,
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
        `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8082'}/api/offerings/${offeringId}/images/single`,
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
      await queryClient.invalidateQueries({ queryKey: ['offering', offeringId, 'images'] });
      await queryClient.refetchQueries({ queryKey: ['offering', offeringId, 'images'] });
      
      toast({
        title: t('common.success'),
        description: result.message || t('offering.uploadSuccess'),
      });

      // Close dialog and reset state
      setUploadDialogOpen(false);
      setPendingFile(null);
      setImageDescription('');
      setIsPrimaryImage(false);
    } catch (error) {
      let errorMessage = t('offering.uploadError');
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Handle common error scenarios
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorMessage = t('offering.networkError');
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        errorMessage = t('offering.sessionExpired');
      } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
        errorMessage = t('offering.permissionError');
      } else if (errorMessage.includes('404')) {
        errorMessage = t('offering.offeringNotFound');
      } else if (errorMessage.includes('413') || errorMessage.includes('too large')) {
        errorMessage = t('offering.imageTooLarge');
      } else if (errorMessage.includes('415') || errorMessage.includes('Unsupported Media Type')) {
        errorMessage = t('offering.invalidImageTypeDescription');
      }
      
      toast({
        title: t('offering.uploadFailedTitle'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

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
  
  // Get offering type label
  const getOfferingTypeLabel = (type: string) => {
    const typeKey = type.toLowerCase().replace(/_/g, '');
    return t(`offering.types.${typeKey}`) || type;
  };

  return (
    <div className="space-y-8">
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

      <div className="grid gap-8 md:grid-cols-2">
        {/* Left Column - Images and Pricing */}
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('offering.images')}</CardTitle>
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
                    ${offering.price?.toFixed(2) || '0.00'}
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

      {/* Upload Image Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('offering.uploadImageTitle')}</DialogTitle>
            <DialogDescription>
              {t('offering.imageDialogDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">{t('offering.imageDescriptionLabel')}</Label>
              <Textarea
                id="description"
                placeholder={t('offering.captionPlaceholder')}
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
                {t('offering.setPrimaryImage')}
              </Label>
            </div>

            {pendingFile && (
              <div className="text-sm text-muted-foreground">
                {t('offering.selectedFileLabel')} {pendingFile.name} ({(pendingFile.size / 1024).toFixed(2)} KB)
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
