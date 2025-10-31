'use client';

import { useLocale } from '@/components/providers/locale-provider';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useDeleteBookingImage, useGroupedBookingImages } from '@/hooks/use-booking-images';
import { toast } from '@/hooks/use-toast';
import { formatDateTime } from '@/lib/utils';
import type { BookingImage } from '@/types';
import { AlertCircle, ChevronLeft, ChevronRight, FileImage, Trash2, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState } from 'react';

interface BookingImageGalleryProps {
  bookingId: number | string;
}

export function BookingImageGallery({ bookingId }: BookingImageGalleryProps) {
  const { t } = useLocale();
  const [selectedImage, setSelectedImage] = useState<BookingImage | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<BookingImage | null>(null);

  const { data: groupedData, isLoading, error } = useGroupedBookingImages(bookingId);
  const deleteMutation = useDeleteBookingImage(bookingId);

  // Helper function to translate category names
  const translateCategoryName = (categoryName: string): string => {
    // Check if it's a predefined category code
    const predefinedCodes = [
      'DELIVERY_INSPECTION',
      'PICKUP_INSPECTION',
      'ACCIDENT_INSPECTION',
      'PRE_RENTAL_INSPECTION',
      'POST_RENTAL_INSPECTION',
      'LICENSE_DOCUMENT',
      'RENTAL_AGREEMENT',
      'FUEL_RECEIPT',
      'TOLL_RECEIPT',
      'MAINTENANCE',
      'OTHER'
    ];
    
    if (predefinedCodes.includes(categoryName)) {
      return t(`booking.images.categories.names.${categoryName}`);
    }
    
    // For custom categories, return the name as-is
    return categoryName;
  };

  const allImages = useMemo(() => {
    if (!groupedData?.grouped) return [];
    return Object.values(groupedData.grouped).flat();
  }, [groupedData]);

  const currentImageIndex = useMemo(() => {
    if (!selectedImage) return -1;
    return allImages.findIndex((img) => img.id === selectedImage.id);
  }, [allImages, selectedImage]);

  const handlePreviousImage = () => {
    if (currentImageIndex > 0) {
      setSelectedImage(allImages[currentImageIndex - 1]);
    }
  };

  const handleNextImage = () => {
    if (currentImageIndex < allImages.length - 1) {
      setSelectedImage(allImages[currentImageIndex + 1]);
    }
  };

  const handleImageClick = (image: BookingImage) => {
    setSelectedImage(image);
    setLightboxOpen(true);
  };

  const handleDeleteClick = (image: BookingImage) => {
    setImageToDelete(image);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!imageToDelete?.id) return;

    try {
      await deleteMutation.mutateAsync(imageToDelete.id);
      toast({
        title: t('booking.images.gallery.deleteSuccess'),
        description: t('booking.images.gallery.deleteSuccessDescription'),
      });
      setDeleteDialogOpen(false);
      setImageToDelete(null);
      if (selectedImage?.id === imageToDelete.id) {
        setLightboxOpen(false);
        setSelectedImage(null);
      }
    } catch (error) {
      toast({
        title: t('booking.images.gallery.deleteError'),
        description: error instanceof Error ? error.message : t('booking.images.gallery.unknownError'),
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileImage className="h-4 w-4 animate-pulse" />
          <span>{t('booking.images.gallery.loading')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <h3 className="font-semibold text-destructive">{t('booking.images.gallery.errorTitle')}</h3>
            <p className="text-sm text-destructive/80">{error instanceof Error ? error.message : t('booking.images.gallery.unknownError')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!groupedData?.grouped || Object.keys(groupedData.grouped).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-lg">
        <FileImage className="h-12 w-12 text-muted-foreground mb-3" />
        <h3 className="text-lg font-semibold mb-1">{t('booking.images.gallery.noImages')}</h3>
        <p className="text-sm text-muted-foreground">{t('booking.images.gallery.noImagesDescription')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileImage className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium">
            {t('booking.images.gallery.totalImages')} {allImages.length}
          </span>
          <Badge variant="outline">{groupedData.totalCategories} {t('booking.images.gallery.categories')}</Badge>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={groupedData.categories} className="w-full">
        {groupedData.categories.map((categoryName) => {
          const images = groupedData.grouped[categoryName];
          if (!images || images.length === 0) return null;

          const translatedCategoryName = translateCategoryName(categoryName);

          return (
            <AccordionItem key={categoryName} value={categoryName}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{translatedCategoryName}</span>
                  <Badge variant="secondary">{images.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
                  {images.map((image) => (
                    <div key={image.id} className="group relative aspect-square">
                      <button
                        type="button"
                        onClick={() => handleImageClick(image)}
                        className="relative h-full w-full overflow-hidden rounded-lg border border-border hover:border-primary transition-all"
                      >
                        <Image
                          src={image.imageUrl}
                          alt={image.notes || image.description || translatedCategoryName}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(image)}
                        className="absolute top-2 right-2 rounded-full bg-destructive p-1.5 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        title={t('booking.images.gallery.delete')}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      {image.uploadedAt && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-xs text-white truncate">
                            {formatDateTime(image.uploadedAt)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {images[0]?.notes && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground font-semibold mb-1">{t('booking.images.gallery.notes')}</p>
                    <p className="text-sm whitespace-pre-wrap">{images[0].notes}</p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0">
          {selectedImage && (
            <div className="flex flex-col h-full">
              <DialogHeader className="px-6 pt-6 pb-4">
                <DialogTitle>
                  {selectedImage.effectiveCategoryName 
                    ? translateCategoryName(selectedImage.effectiveCategoryName)
                    : t('booking.images.gallery.image')}
                </DialogTitle>
                {selectedImage.uploadedAt && (
                  <DialogDescription>
                    {t('booking.images.gallery.uploadedOn')} {formatDateTime(selectedImage.uploadedAt)}
                  </DialogDescription>
                )}
              </DialogHeader>

              <div className="relative flex-1 bg-black/5 min-h-[400px]">
                <Image
                  src={selectedImage.imageUrl}
                  alt={selectedImage.notes || selectedImage.description || ''}
                  fill
                  className="object-contain"
                  sizes="90vw"
                  priority
                />

                {/* Navigation Arrows */}
                {currentImageIndex > 0 && (
                  <button
                    type="button"
                    onClick={handlePreviousImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}
                {currentImageIndex < allImages.length - 1 && (
                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-3 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                )}

                {/* Image Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {allImages.length}
                </div>
              </div>

              {selectedImage.notes && (
                <div className="px-6 py-4 bg-muted">
                  <p className="text-sm font-semibold mb-1">{t('booking.images.gallery.notes')}</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedImage.notes}</p>
                </div>
              )}

              <DialogFooter className="px-6 py-4">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleDeleteClick(selectedImage)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('booking.images.gallery.delete')}
                </Button>
                <Button type="button" variant="outline" onClick={() => setLightboxOpen(false)}>
                  {t('common.close')}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('booking.images.gallery.deleteConfirmTitle')}</DialogTitle>
            <DialogDescription>{t('booking.images.gallery.deleteConfirmDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setImageToDelete(null);
              }}
              disabled={deleteMutation.isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t('booking.images.gallery.deleting') : t('booking.images.gallery.deleteConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
