'use client';

import { OfferingImageUploadDialog } from '@/components/offering/offering-image-upload-dialog';
import { OfferingPricePanel } from '@/components/offering/offering-price-panel';
import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const { t, formatCurrency } = useLocale();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const offeringId = params.id as string;
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

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
