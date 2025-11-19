'use client';

import { useLocale } from '@/components/providers/locale-provider';
import { Button } from '@/components/ui/button';
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
import { Image as ImageIcon, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface ImageWithMetadata {
  file: File;
  preview: string;
  description: string;
  isPrimary: boolean;
}

interface VehicleImageUploadDialogProps {
  vehicleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: () => void;
  existingImagesCount: number;
}

export function VehicleImageUploadDialog({
  vehicleId,
  open,
  onOpenChange,
  onUploadComplete,
  existingImagesCount,
}: VehicleImageUploadDialogProps) {
  const { t } = useLocale();
  const [images, setImages] = useState<ImageWithMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Cleanup preview URLs on unmount or when images change
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, [images]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      // Validate file type
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validImageTypes.includes(file.type)) {
        toast({
          title: t('vehicle.invalidImageTypeTitle'),
          description: t('vehicle.invalidImageTypeDescription'),
          variant: 'destructive',
        });
        return false;
      }

      // Validate file size (max 10MB)
      const maxSizeInBytes = 10 * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        const fileSizeMb = (file.size / 1024 / 1024).toFixed(2);
        toast({
          title: t('vehicle.fileTooLargeTitle'),
          description: `${t('vehicle.fileTooLargeDescription')} ${fileSizeMb}MB.`,
          variant: 'destructive',
        });
        return false;
      }

      return true;
    });

    const newImages = validFiles.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      description: '',
      isPrimary: existingImagesCount === 0 && images.length === 0 && index === 0,
    }));

    setImages(prev => [...prev, ...newImages]);
  }, [t, existingImagesCount, images.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const updateImageDescription = (index: number, description: string) => {
    setImages(prev => {
      const newImages = [...prev];
      newImages[index].description = description;
      return newImages;
    });
  };

  const updateImagePrimary = (index: number, isPrimary: boolean) => {
    setImages(prev => {
      const newImages = [...prev];
      // If setting as primary, unset all others
      if (isPrimary) {
        newImages.forEach((img, i) => {
          img.isPrimary = i === index;
        });
      } else {
        newImages[index].isPrimary = false;
      }
      return newImages;
    });
  };

  const handleUpload = async () => {
    if (images.length === 0) return;

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

      let successCount = 0;
      let failCount = 0;

      // Upload images sequentially to maintain order
      for (const image of images) {
        try {
          const formData = new FormData();
          formData.append('file', image.file);
          
          if (image.description.trim()) {
            formData.append('description', image.description.trim());
          }
          
          formData.append('isPrimary', String(image.isPrimary));

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
              errorMessage = uploadResponse.statusText || errorMessage;
            }
            
            throw new Error(errorMessage);
          }

          successCount++;
        } catch (error) {
          failCount++;
          console.error(`Failed to upload ${image.file.name}:`, error);
        }
      }

      // Show result toast
      if (successCount > 0) {
        toast({
          title: t('common.success'),
          description: `${successCount} ${t('vehicle.imagesUploadedSuccess')}`,
        });
      }

      if (failCount > 0) {
        toast({
          title: t('vehicle.uploadFailedTitle'),
          description: `${failCount} ${t('vehicle.imagesUploadFailed')}`,
          variant: 'destructive',
        });
      }

      // Clean up and close
      images.forEach(img => URL.revokeObjectURL(img.preview));
      setImages([]);
      onUploadComplete();
      onOpenChange(false);
    } catch (error) {
      let errorMessage = t('vehicle.uploadError');
      
      if (error instanceof Error) {
        errorMessage = error.message;
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

  const handleCancel = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{t('vehicle.uploadImagesTitle')}</DialogTitle>
          <DialogDescription>
            {t('vehicle.uploadImagesDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-sm">{t('vehicle.dropHere')}</p>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-medium">{t('vehicle.dragDropImages')}</p>
                <p className="text-xs text-muted-foreground">{t('vehicle.uploadImageLimit')}</p>
              </div>
            )}
          </div>

          {/* Selected Images Count */}
          {images.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {images.length} {t('vehicle.selectedImages')}
            </div>
          )}

          {/* Images List */}
          {images.length > 0 && (
            <div className="h-[450px] overflow-y-auto pr-4 space-y-4">
              {images.map((image, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex gap-4">
                    {/* Image Preview */}
                    <div className="relative w-32 h-32 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                      <Image
                        src={image.preview}
                        alt={image.file.name}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    </div>

                    {/* Image Metadata */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium truncate">{image.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(image.file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeImage(index)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`description-${index}`} className="text-xs">
                          {t('vehicle.imageDescriptionLabel')}
                        </Label>
                        <Textarea
                          id={`description-${index}`}
                          placeholder={t('vehicle.captionPlaceholder')}
                          value={image.description}
                          onChange={(e) => updateImageDescription(index, e.target.value)}
                          rows={2}
                          className="text-sm"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`primary-${index}`}
                          checked={image.isPrimary}
                          onCheckedChange={(checked) => updateImagePrimary(index, checked as boolean)}
                        />
                        <Label
                          htmlFor={`primary-${index}`}
                          className="text-xs font-normal cursor-pointer"
                        >
                          {t('vehicle.setPrimaryImage')}
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add More Button */}
          {images.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
              className="w-full"
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              {t('vehicle.addMoreImages')}
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isUploading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading || images.length === 0}
          >
            {isUploading ? `${t('vehicle.uploading')}...` : `${t('common.upload')} (${images.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
