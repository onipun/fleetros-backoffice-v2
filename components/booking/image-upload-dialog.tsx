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
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useBookingImageCategories, useUploadBookingImages } from '@/hooks/use-booking-images';
import { toast } from '@/hooks/use-toast';
import type { BookingImageCategory } from '@/types';
import { FileImage, Upload, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface ImageUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: number | string;
  onUploadSuccess?: () => void;
}

interface PreviewFile extends File {
  preview?: string;
}

// Image compression helper function
const compressImage = async (file: File, maxWidth = 1920, maxHeight = 1920, quality = 0.85): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new window.Image();
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = maxWidth;
            height = Math.round(width / aspectRatio);
          } else {
            height = maxHeight;
            width = Math.round(height * aspectRatio);
          }
        }
        
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Use better image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            // Create new file from compressed blob
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            
            // Only use compressed version if it's actually smaller
            if (compressedFile.size < file.size) {
              console.log(`Compressed ${file.name}: ${(file.size / 1024).toFixed(2)}KB → ${(compressedFile.size / 1024).toFixed(2)}KB (${((1 - compressedFile.size / file.size) * 100).toFixed(1)}% reduction)`);
              resolve(compressedFile);
            } else {
              console.log(`Keeping original ${file.name}: compression would increase size`);
              resolve(file);
            }
          },
          file.type,
          quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

export function ImageUploadDialog({ open, onOpenChange, bookingId, onUploadSuccess }: ImageUploadDialogProps) {
  const { t } = useLocale();
  const [selectedFiles, setSelectedFiles] = useState<PreviewFile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<BookingImageCategory | 'custom' | ''>('');
  const [selectedCustomCategoryId, setSelectedCustomCategoryId] = useState<string>('');
  const [notes, setNotes] = useState('');

  const { data: categoriesData, isLoading: categoriesLoading } = useBookingImageCategories();
  const uploadMutation = useUploadBookingImages(bookingId);
  const [isCompressing, setIsCompressing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 50 * 1024 * 1024; // 50MB - allow larger files since we'll compress them

    const validFiles = acceptedFiles.filter((file) => {
      if (!validTypes.includes(file.type)) {
        toast({
          title: t('booking.images.upload.invalidType'),
          description: `${file.name} ${t('booking.images.upload.invalidTypeDescription')}`,
          variant: 'destructive',
        });
        return false;
      }

      if (file.size > maxSize) {
        toast({
          title: t('booking.images.upload.fileTooLarge'),
          description: `${file.name} exceeds 50MB. Please select a smaller file.`,
          variant: 'destructive',
        });
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    console.log('Starting compression for', validFiles.length, 'files...');
    // Show compression indicator
    setIsCompressing(true);

    try {
      // Compress images
      const compressedFiles = await Promise.all(
        validFiles.map(async (file) => {
          try {
            console.log(`Compressing ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)...`);
            const compressed = await compressImage(file);
            console.log(`Compressed ${file.name} to ${(compressed.size / 1024 / 1024).toFixed(2)}MB`);
            return compressed;
          } catch (error) {
            console.error(`Failed to compress ${file.name}:`, error);
            // Return original file if compression fails
            return file;
          }
        })
      );

      console.log('Compression complete, creating previews...');
      // Create previews
      const filesWithPreview = compressedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      setSelectedFiles((prev) => [...prev, ...filesWithPreview]);
      console.log('Files ready for upload');
    } catch (error) {
      console.error('Error processing images:', error);
      toast({
        title: 'Error',
        description: 'Failed to process some images',
        variant: 'destructive',
      });
    } finally {
      setIsCompressing(false);
    }
  }, [t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    multiple: true,
    maxSize: 50 * 1024 * 1024, // 50MB - allow larger files since we'll compress them
  });

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: t('booking.images.upload.noFiles'),
        description: t('booking.images.upload.noFilesDescription'),
        variant: 'destructive',
      });
      return;
    }

    if (!selectedCategory) {
      toast({
        title: t('booking.images.upload.noCategorySelected'),
        description: t('booking.images.upload.noCategorySelectedDescription'),
        variant: 'destructive',
      });
      return;
    }

    if (selectedCategory === 'custom' && !selectedCustomCategoryId) {
      toast({
        title: t('booking.images.upload.noCustomCategorySelected'),
        description: t('booking.images.upload.noCustomCategorySelectedDescription'),
        variant: 'destructive',
      });
      return;
    }

    const options: {
      category?: BookingImageCategory;
      customCategoryId?: number;
      notes?: string;
    } = {};

    if (selectedCategory !== 'custom') {
      options.category = selectedCategory as BookingImageCategory;
    } else {
      options.customCategoryId = parseInt(selectedCustomCategoryId);
    }

    if (notes.trim()) {
      options.notes = notes.trim();
    }

    try {
      await uploadMutation.mutateAsync({
        files: selectedFiles,
        options,
      });

      toast({
        title: t('booking.images.upload.success'),
        description: `${t('booking.images.upload.successDescription')} (${selectedFiles.length})`,
      });

      // Cleanup
      selectedFiles.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });

      setSelectedFiles([]);
      setSelectedCategory('');
      setSelectedCustomCategoryId('');
      setNotes('');
      onOpenChange(false);
      onUploadSuccess?.();
    } catch (error) {
      toast({
        title: t('booking.images.upload.error'),
        description: error instanceof Error ? error.message : t('booking.images.upload.unknownError'),
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    // Cleanup previews
    selectedFiles.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setSelectedFiles([]);
    setSelectedCategory('');
    setSelectedCustomCategoryId('');
    setNotes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('booking.images.upload.title')}</DialogTitle>
          <DialogDescription>{t('booking.images.upload.description')}</DialogDescription>
        </DialogHeader>

        {/* Upload Loading Overlay */}
        {uploadMutation.isPending && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
            <div className="text-center space-y-4">
              <Upload className="mx-auto h-12 w-12 text-primary animate-bounce" />
              <div className="space-y-2">
                <p className="text-lg font-semibold">Uploading images...</p>
                <p className="text-sm text-muted-foreground">
                  Uploading {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} to server
                </p>
              </div>
              <div className="relative w-64 h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-primary via-blue-500 to-primary"
                  style={{
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite'
                  }}
                />
              </div>
              <style jsx>{`
                @keyframes shimmer {
                  0% { background-position: -200% 0; }
                  100% { background-position: 200% 0; }
                }
              `}</style>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Dropzone */}
          <div>
            <Label>{t('booking.images.upload.selectFiles')}</Label>
            <div
              {...getRootProps()}
              className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              } ${isCompressing ? 'pointer-events-none opacity-50' : ''}`}
            >
              <input {...getInputProps()} disabled={isCompressing} />
              <Upload className={`mx-auto h-12 w-12 text-muted-foreground mb-4 ${isCompressing ? 'animate-pulse' : ''}`} />
              {isCompressing ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-primary">Compressing images...</p>
                  <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-primary via-primary/80 to-primary animate-pulse"
                      style={{
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 1.5s infinite'
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Please wait while we optimize your images</p>
                  <style jsx>{`
                    @keyframes shimmer {
                      0% { background-position: -200% 0; }
                      100% { background-position: 200% 0; }
                    }
                  `}</style>
                </div>
              ) : isDragActive ? (
                <p className="text-sm text-muted-foreground">{t('booking.images.upload.dropHere')}</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-1">{t('booking.images.upload.dragAndDrop')}</p>
                  <p className="text-xs text-muted-foreground">{t('booking.images.upload.supportedFormats')}</p>
                </>
              )}
            </div>
          </div>

          {/* File Previews */}
          {selectedFiles.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>{t('booking.images.upload.selectedFiles')} ({selectedFiles.length})</Label>
                <span className="text-xs text-muted-foreground">
                  Total: {(selectedFiles.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)}MB
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {selectedFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="group relative aspect-square">
                    <div className="relative h-full w-full overflow-hidden rounded-lg border border-border">
                      {file.preview ? (
                        <Image
                          src={file.preview}
                          alt={file.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-muted">
                          <FileImage className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      {/* File size badge */}
                      <div className="absolute bottom-1 left-1 right-1 bg-black/60 text-white text-[10px] px-1 py-0.5 rounded text-center backdrop-blur-sm">
                        {(file.size / 1024).toFixed(0)}KB
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 rounded-full bg-destructive p-1.5 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <p className="mt-1 text-xs text-muted-foreground truncate" title={file.name}>{file.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Selection */}
          <div>
            <Label htmlFor="category">{t('booking.images.upload.category')}</Label>
            <Select value={selectedCategory} onValueChange={(value: string) => setSelectedCategory(value as any)}>
              <SelectTrigger id="category" className="mt-2">
                <SelectValue placeholder={t('booking.images.upload.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {categoriesLoading ? (
                  <SelectItem value="loading" disabled>
                    {t('common.loading')}
                  </SelectItem>
                ) : (
                  <>
                    <SelectGroup>
                      <SelectLabel>{t('booking.images.categories.predefined')}</SelectLabel>
                      {categoriesData?.predefined.map((category) => (
                        <SelectItem key={category.code} value={category.code}>
                          {t(`booking.images.categories.names.${category.code}`)}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    {categoriesData?.custom && categoriesData.custom.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>{t('booking.images.categories.custom')}</SelectLabel>
                        <SelectItem value="custom">{t('booking.images.upload.useCustomCategory')}</SelectItem>
                      </SelectGroup>
                    )}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Category Selection */}
          {selectedCategory === 'custom' && categoriesData?.custom && categoriesData.custom.length > 0 && (
            <div>
              <Label htmlFor="custom-category">{t('booking.images.upload.customCategory')}</Label>
              <Select value={selectedCustomCategoryId} onValueChange={setSelectedCustomCategoryId}>
                <SelectTrigger id="custom-category" className="mt-2">
                  <SelectValue placeholder={t('booking.images.upload.selectCustomCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {categoriesData.custom.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      <div className="flex items-center gap-2">
                        {category.displayColor && (
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: category.displayColor }}
                          />
                        )}
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">{t('booking.images.upload.notes')}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('booking.images.upload.notesPlaceholder')}
              rows={4}
              className="mt-2"
              maxLength={500}
            />
            <p className="mt-1 text-xs text-muted-foreground text-right">
              {notes.length}/500
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={uploadMutation.isPending}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={handleUpload} disabled={uploadMutation.isPending || selectedFiles.length === 0}>
            {uploadMutation.isPending && (
              <Upload className="mr-2 h-4 w-4 animate-pulse" />
            )}
            {uploadMutation.isPending ? t('booking.images.upload.uploading') : t('booking.images.upload.uploadButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
