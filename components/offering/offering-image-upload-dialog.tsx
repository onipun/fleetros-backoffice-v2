'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface OfferingImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offeringId: number | string;
  hasExistingImages: boolean;
  onUploadSuccess?: () => void;
}

interface ImageWithMetadata {
  file: File;
  preview: string;
  description: string;
  isPrimary: boolean;
}

export function OfferingImageUploadDialog({ 
  open, 
  onOpenChange, 
  offeringId, 
  hasExistingImages,
  onUploadSuccess 
}: OfferingImageUploadDialogProps) {
  const { t } = useLocale();
  const [images, setImages] = useState<ImageWithMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB per file

    const validFiles = acceptedFiles.filter((file) => {
      if (!validTypes.includes(file.type)) {
        toast({
          title: t('offering.invalidImageTypeTitle'),
          description: `${file.name} - ${t('offering.invalidImageTypeDescription')}`,
          variant: 'destructive',
        });
        return false;
      }

      if (file.size > maxSize) {
        toast({
          title: t('offering.fileTooLargeTitle'),
          description: `${file.name} - ${t('offering.fileTooLargeDescription')} ${(file.size / 1024 / 1024).toFixed(2)}MB`,
          variant: 'destructive',
        });
        return false;
      }

      return true;
    });

    const newImages: ImageWithMetadata[] = validFiles.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      description: '',
      // Set first image as primary if no existing images and this is the first new image
      isPrimary: !hasExistingImages && images.length === 0 && index === 0,
    }));

    setImages((prev) => [...prev, ...newImages]);
  }, [t, hasExistingImages, images.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024,
  });

  const removeImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      // Revoke object URL to prevent memory leaks
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      
      // If removed image was primary and there are other images, make first one primary
      if (prev[index].isPrimary && newImages.length > 0 && !hasExistingImages) {
        newImages[0].isPrimary = true;
      }
      
      return newImages;
    });
  };

  const updateDescription = (index: number, description: string) => {
    setImages((prev) => {
      const newImages = [...prev];
      newImages[index].description = description;
      return newImages;
    });
  };

  const setPrimary = (index: number) => {
    setImages((prev) => {
      return prev.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }));
    });
  };

  const handleUpload = async () => {
    if (images.length === 0) {
      toast({
        title: t('offering.noImagesSelected'),
        description: t('offering.pleaseSelectImages'),
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
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

      let uploadedCount = 0;
      let failedCount = 0;

      // Upload images sequentially to maintain order and handle primary flag correctly
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        
        try {
          const formData = new FormData();
          formData.append('file', image.file);
          
          if (image.description.trim()) {
            formData.append('description', image.description.trim());
          }
          
          formData.append('isPrimary', String(image.isPrimary));

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
            const errorData = await uploadResponse.json().catch(() => ({ error: 'Upload failed' }));
            throw new Error(errorData.message || errorData.error || 'Upload failed');
          }

          uploadedCount++;
        } catch (error) {
          console.error(`Failed to upload ${image.file.name}:`, error);
          failedCount++;
          
          toast({
            title: t('offering.uploadFailedTitle'),
            description: `${image.file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: 'destructive',
          });
        }
      }

      // Clean up object URLs
      images.forEach(img => URL.revokeObjectURL(img.preview));

      if (uploadedCount > 0) {
        toast({
          title: t('common.success'),
          description: `${uploadedCount} ${t('offering.imagesUploadedSuccess')}`,
        });

        // Close dialog and reset state
        setImages([]);
        onOpenChange(false);
        onUploadSuccess?.();
      }

      if (failedCount > 0 && uploadedCount === 0) {
        throw new Error(t('offering.allUploadsFailedError'));
      }
    } catch (error) {
      let errorMessage = t('offering.uploadError');
      
      if (error instanceof Error) {
        errorMessage = error.message;
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

  const handleClose = () => {
    if (images.length > 0) {
      if (confirm(t('offering.discardImagesConfirm'))) {
        // Clean up object URLs
        images.forEach(img => URL.revokeObjectURL(img.preview));
        setImages([]);
        onOpenChange(false);
      }
    } else {
      onOpenChange(false);
    }
  };

  const totalSize = images.reduce((sum, img) => sum + img.file.size, 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('offering.uploadImagesTitle')}</DialogTitle>
          <DialogDescription>
            {t('offering.uploadImagesDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {images.length === 0 ? (
            // Drop zone when no images selected
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">
                {isDragActive ? t('offering.dropImagesHere') : t('offering.dragDropImages')}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {t('offering.orClickToBrowse')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('offering.supportedFormats')}: JPEG, PNG, GIF, WebP (max 10MB each)
              </p>
            </div>
          ) : (
            // Images list when images are selected
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {images.length} {t('offering.selectedImages')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t('offering.totalSize')}: {(totalSize / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('add-more-input')?.click()}
                  disabled={isUploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {t('offering.addMore')}
                </Button>
                <input
                  id="add-more-input"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      onDrop(Array.from(e.target.files));
                      e.target.value = '';
                    }
                  }}
                />
              </div>

              {/* Images grid with metadata */}
              <div className="h-[450px] overflow-y-auto pr-4">
                <div className="space-y-4">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${
                        image.isPrimary ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <div className="flex gap-4">
                        {/* Image preview */}
                        <div className="relative w-32 h-32 flex-shrink-0">
                          <Image
                            src={image.preview}
                            alt={image.file.name}
                            fill
                            className="object-cover rounded-md"
                            sizes="128px"
                          />
                          {image.isPrimary && (
                            <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                              {t('offering.primaryImage')}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full hover:bg-destructive/90"
                            disabled={isUploading}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Metadata inputs */}
                        <div className="flex-1 space-y-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              {t('offering.fileName')}
                            </Label>
                            <p className="text-sm font-medium truncate">{image.file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(image.file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor={`description-${index}`} className="text-xs">
                              {t('offering.imageDescriptionLabel')}
                            </Label>
                            <Input
                              id={`description-${index}`}
                              placeholder={t('offering.captionPlaceholder')}
                              value={image.description}
                              onChange={(e) => updateDescription(index, e.target.value)}
                              disabled={isUploading}
                            />
                          </div>

                          {!hasExistingImages && (
                            <Button
                              type="button"
                              variant={image.isPrimary ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setPrimary(index)}
                              disabled={isUploading || image.isPrimary}
                            >
                              {image.isPrimary
                                ? t('offering.isPrimaryImage')
                                : t('offering.setAsPrimary')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || images.length === 0}
          >
            {isUploading
              ? `${t('offering.uploading')} ${images.length} ${t('offering.images')}`
              : `${t('offering.uploadImages')} (${images.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
